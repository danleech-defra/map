'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Overlay, Feature } from 'ol'
import { transformExtent, transform } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { defaults as defaultInteractions } from 'ol/interaction'
import { Point } from 'ol/geom'
import { buffer, containsExtent } from 'ol/extent'

const maps = window.flood.maps
const { addOrUpdateParameter, getParameterByName, forEach, dispatchEvent } = window.flood.utils
const MapContainer = maps.MapContainer

function LiveMap (mapId, options) {
  // Set active map
  this.mapId = mapId
  window.flood.activeMap = this

  // Create the map container element (tabindex is managed by container)
  const containerElement = document.createElement('div')
  containerElement.id = mapId
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-label', 'Map view')
  document.body.appendChild(containerElement)

  // Dispatch initialise event
  dispatchEvent(containerElement, 'mapinit')

  // Defiitive list of query params
  const defautlQueryParams = {
    v: '', // Used to flag map view
    lyr: '', // Store the current active layers
    ext: [], // Store the current extent
    sid: '' // Store the current selecxted feature Id
  }

  // Options
  const queryParams = Object.assign({}, defautlQueryParams, options.queryParams)
  const targetArea = options.targetArea
  const smartKey = false
  const isBack = options.isBack

  // View
  const view = new View({
    zoom: options.zoom || 6,
    minZoom: 6,
    maxZoom: 18,
    center: options.center ? transform(options.center, 'EPSG:4326', 'EPSG:3857') : maps.center,
    extent: transformExtent([
      -13.930664,
      47.428087,
      8.920898,
      59.040555
    ], 'EPSG:4326', 'EPSG:3857')
  })

  // Layers
  const road = maps.layers.road()
  const satellite = maps.layers.satellite()
  const targetAreaPolygons = maps.layers.targetAreaPolygons()
  const warnings = maps.layers.warnings()
  const stations = maps.layers.stations()
  const rainfall = maps.layers.rainfall()
  const impacts = maps.layers.impacts()
  const selected = maps.layers.selected()

  const defaultLayers = [
    road,
    satellite,
    // nuts1,
    selected
  ]

  const dataLayers = [
    rainfall,
    stations,
    warnings,
    impacts
  ]

  const layers = defaultLayers.concat(dataLayers)

  // Configure default interactions
  const interactions = defaultInteractions({
    pinchRotate: false
  })

  // Store features that are visible in the viewport
  let visibleFeatures = []

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: window.flood.maps.liveMapSymbolBreakpoint,
    view: view,
    layers: layers,
    queryParams: queryParams,
    interactions: interactions,
    keyTemplate: 'key-live.html',
    exitButtonClass: isBack ? 'defra-map__back' : 'defra-map__exit'
  }

  // Create MapContainer
  const container = new MapContainer(containerElement, containerOptions)
  const map = container.map
  const closeInfoButton = container.closeInfoButton

  // Set selected feature id from querystring
  let selectedFeatureId = getParameterByName('sid') || ''

  //
  // Private methods
  //

  // Set map extent from querystring
  const setExtent = (padding = [0, 0, 0, 0]) => {
    const ext = getParameterByName('ext')
    let extent = ext.split(',').map(Number)
    extent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
    map.getView().fit(extent, { constrainResolution: false, padding: padding })
  }

  // Show or hide layers
  const toggleLayerVisibility = () => {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    dataLayers.forEach((layer) => {
      const isVisible = lyrs.some(lyr => layer.get('featureCodes').includes(lyr))
      layer.setVisible(isVisible)
    })
  }

  // Add a target area feature
  const addTargetArea = () => {
    if (!warnings.getSource().getFeatureById(targetArea.id)) {
      const feature = new Feature({
        name: targetArea.name,
        state: 14
      })
      feature.setId(targetArea.id)
      feature.setGeometry(new Point(transform(targetArea.coordinates, 'EPSG:4326', 'EPSG:3857')))
      warnings.getSource().addFeature(feature)
    }
  }

  // Show or hide features within layers
  const toggleFeatureVisibility = () => {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    dataLayers.forEach((layer) => {
      layer.getSource().forEachFeature((feature) => {
        const ref = layer.get('ref')
        const state = feature.get('state')
        const isVisible = (
          // Warnings
          (state === 11 && lyrs.includes('ts')) ||
          (state === 12 && lyrs.includes('tw')) ||
          (state === 13 && lyrs.includes('ta')) ||
          (state === 14 && lyrs.includes('tr')) ||
          // Stations
          (state === 21 && lyrs.includes('sh')) ||
          (ref === 'stations' && state !== 21 && lyrs.includes('st')) ||
          // Rainfall
          (ref === 'rainfall' && lyrs.includes('rf')) ||
          // Impacts
          (ref === 'impacts' && lyrs.includes('hi'))
        )
        feature.set('isVisible', isVisible)
      })
    })
  }

  // Toggle features selected state
  const toggleFeatureSelected = (id, state) => {
    dataLayers.forEach((layer) => {
      const feature = layer.getSource().getFeatureById(id)
      if (feature) {
        feature.set('isSelected', state)
        // Refresh vector tiles
        if (layer.get('ref') === 'warnings') {
          restyleTargetAreaPolygons()
        }
      }
    })
  }

  // Add a feature to the selected layer
  const cloneFeature = (id) => {
    dataLayers.forEach((layer) => {
      const feature = layer.getSource().getFeatureById(id)
      if (feature) {
        selected.getSource().addFeature(feature)
        selected.setStyle(layer.getStyle())
      }
    })
  }

  // Set selected feature (includes opening and closing info panel)
  const setSelectedFeature = (id) => {
    toggleFeatureSelected(selectedFeatureId, false)
    selected.getSource().clear()
    if (id) {
      selectedFeatureId = id
      toggleFeatureSelected(id, true)
      cloneFeature(id)
      container.showInfo(id)
    } else {
      selectedFeatureId = ''
    }
    // Update url
    replaceHistory('sid', selectedFeatureId)
  }

  // Set key checkboxes
  const setCheckboxes = () => {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const checkboxes = document.querySelectorAll('.defra-map-key input[type=checkbox]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = lyrs.includes(checkbox.id)
    })
  }

  // Toggle key symbols based on resolution
  const toggleKeySymbol = (resolution) => {
    forEach(containerElement.querySelectorAll('.defra-map-key__symbol'), (symbol) => {
      const isBigZoom = resolution <= containerOptions.maxBigZoom
      if (isBigZoom) {
        symbol.classList.add('defra-map-key__symbol--big')
      } else {
        symbol.classList.remove('defra-map-key__symbol--big')
      }
    })
  }

  // Update url and replace history state
  const replaceHistory = (queryParam, value) => {
    const data = { v: mapId, isBack: isBack }
    const url = addOrUpdateParameter(window.location.pathname + window.location.search, queryParam, value)
    const title = document.title
    window.history.replaceState(data, title, url)
  }

  // Get visible features
  const getVisibleFeatures = () => {
    const visibleFeatures = []
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const resolution = map.getView().getResolution()
    const extent = map.getView().calculateExtent(map.getSize())
    const isBigZoom = resolution <= containerOptions.maxBigZoom
    const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    layers.forEach((layer) => {
      if (visibleFeatures.length > 9) return true
      layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
        if (!feature.get('isVisible')) {
          return false
        }
        visibleFeatures.push({
          id: feature.getId(),
          state: layer.get('ref'), // Used to style the overlay
          isBigZoom: isBigZoom,
          centre: feature.getGeometry().getCoordinates()
        })
      })
    })
    return visibleFeatures
  }

  // Show overlays
  const showOverlays = () => {
    if (container.isKeyboardEvent) {
      hideOverlays()
      visibleFeatures = getVisibleFeatures()
      if (visibleFeatures.length <= 9) {
        visibleFeatures.forEach((feature, i) => {
          const overlayElement = document.createTextNode(i + 1)
          map.addOverlay(
            new Overlay({
              element: overlayElement,
              position: feature.centre,
              className: `defra-map-overlay defra-map-overlay--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''}`,
              offset: [0, 0]
            })
          )
        })
      }
    }
  }

  // Hide overlays
  const hideOverlays = () => {
    map.getOverlays().clear()
  }

  // Restyle polygons
  const restyleTargetAreaPolygons = () => {
    // Triggers layer to be restyled
    targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
  }

  // Set target area polygon opacity
  const setOpacityTargetAreaPolygons = () => {
    if (targetAreaPolygons.getVisible()) {
      const resolution = Math.floor(map.getView().getResolution())
      // Opacity graduates between 1 and 0.4 with resolution
      const opacity = Math.min(Math.max((resolution + 40) / 100, 0.4), 1)
      targetAreaPolygons.setOpacity(opacity)
    }
  }

  // Pan map
  const panToFeature = (feature) => {
    let extent = map.getView().calculateExtent(map.getSize())
    extent = buffer(extent, -1000)
    if (!containsExtent(extent, feature.getGeometry().getExtent())) {
      map.getView().setCenter(feature.getGeometry().getCoordinates())
    }
  }

  //
  // Setup
  //

  // Set extent from querystring
  if (getParameterByName('ext')) {
    setExtent()
  }

  // Set layers from querystring
  if (getParameterByName('lyr')) {
    toggleLayerVisibility()
    setCheckboxes()
  }

  // Set smart key visibility
  if (smartKey) {
    const keyItems = document.querySelectorAll('.defra-map-key__section--layers .defra-map-key__item')
    keyItems.forEach((keyItem) => {
      keyItem.style.display = 'none'
    })
  }

  //
  // Public properties
  //

  this.container = container
  this.map = map
  this.containerElement = containerElement
  this.queryParamKeys = Object.keys(queryParams)

  //
  // Events
  //

  // Set selected feature and vector tile states when features have loaded
  dataLayers.forEach((layer) => {
    const change = layer.getSource().on('change', (e) => {
      if (e.target.getState() === 'ready') {
        // Remove ready event when layer is ready
        unByKey(change)
        if (layer.get('ref') === 'warnings') {
          // Add optional target area
          if (targetArea) {
            addTargetArea()
          }
        }
        // Set feature visibility after all features have loaded
        toggleFeatureVisibility()
        // Store reference to warnings source for use in vector tiles style function
        if (layer.get('ref') === 'warnings') {
          maps.warningsSource = warnings.getSource()
          map.addLayer(targetAreaPolygons)
        }
        // Attempt to set selected feature when layer is ready
        setSelectedFeature(selectedFeatureId)
        // Show overlays
        showOverlays()
      }
    })
  })

  // Pan or zoom map (fires on map load aswell)
  let timer = null
  map.addEventListener('moveend', (e) => {
    const resolution = map.getView().getResolution()
    // Toggle key symbols depending on resolution
    toggleKeySymbol(resolution)
    // Update url (history state) to reflect new extent
    const extent = map.getView().calculateExtent(map.getSize())
    let ext = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
    ext = ext.map((x) => { return Number(x.toFixed(6)) })
    ext = ext.join(',')
    // Set polygon layer opacity
    setOpacityTargetAreaPolygons()
    // Timer used to stop 100 url replaces in 30 seconds limit
    clearTimeout(timer)
    timer = setTimeout(() => {
      // Show overlays for visible features
      showOverlays()
      // Is map view
      if (getParameterByName('v')) {
        replaceHistory('ext', ext)
      }
    }, 350)
  })

  // Show cursor when hovering over features
  map.addEventListener('pointermove', (e) => {
    // Detect vector feature at mouse coords
    const hit = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (!defaultLayers.includes(layer)) {
        return true
      }
    })
    map.getTarget().style.cursor = hit ? 'pointer' : ''
  })

  // Select feature if map is clicked
  map.addEventListener('click', (e) => {
    // Get mouse coordinates and check for feature
    const feature = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (!defaultLayers.includes(layer)) {
        return feature
      }
    })
    setSelectedFeature(feature ? feature.getId() : '')
  })

  // Toggle layers/features if key item changed
  const key = document.querySelector('.defra-map-key')
  key.addEventListener('click', (e) => {
    if (e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {
      const checkbox = e.target
      let lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      checkbox.checked ? lyrs.push(checkbox.id) : lyrs.splice(lyrs.indexOf(checkbox.id), 1)
      lyrs = lyrs.join(',')
      replaceHistory('lyr', lyrs)
      toggleLayerVisibility()
      toggleFeatureVisibility()
      restyleTargetAreaPolygons()
      showOverlays()
    }
  }, true)

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    setSelectedFeature()
  })

  // Detect keyboard interaction and show overlays
  const keyup = (e) => {
    // Show overlays
    showOverlays()
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && selectedFeatureId !== '') {
      setSelectedFeature()
    }
    // Listen for number keys
    if (!isNaN(e.key) && e.key >= 1 && visibleFeatures.length && visibleFeatures.length <= 9) {
      setSelectedFeature(visibleFeatures[e.key - 1].id)
    }
  }
  document.addEventListener('keyup', keyup)

  // Hide overlays when the map is clicked
  map.addEventListener('click', (e) => {
    hideOverlays()
  })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = (mapId, options = {}) => {
  // Set initial history state and window events once for all maps
  if (!window.flood.isLiveMapsInitialised) {
    window.flood.maps.initLiveMaps()
  }

  // Create map button
  const btnContainer = document.getElementById(mapId)
  const button = document.createElement('button')
  button.id = mapId + '-btn'
  button.innerText = options.btnText || 'View map'
  button.className = options.btnClasses || 'defra-button-map'
  btnContainer.parentNode.replaceChild(button, btnContainer)

  // Create map on button press
  button.addEventListener('click', (e) => {
    // Advance history
    const data = { v: mapId, isBack: true }
    const title = document.title
    let url = window.location.pathname + window.location.search
    url = addOrUpdateParameter(url, 'v', mapId)
    // Add any querystring parameters from constructor
    if (options.queryParams) {
      Object.keys(options.queryParams).forEach((key) => {
        url = addOrUpdateParameter(url, key, options.queryParams[key])
      })
    }
    window.history.pushState(data, title, url)
    options.isBack = true
    // options.isKeyboard
    // Create map instance
    return new LiveMap(mapId, options)
  })

  // Create map on direct or refresh
  if (window.flood.utils.getParameterByName('v') === mapId) {
    return new LiveMap(mapId, {
      isBack: window.history.state && window.history.state.isBack
    })
  }
}

// Add window evewnts once for multiple maps
maps.initLiveMaps = () => {
  // Set initial history state if not already set
  if (!window.history.state) {
    const data = { v: '', isBack: false }
    const title = document.title
    let url = window.location.pathname + window.location.search
    window.history.replaceState(data, title, url)
  }

  // Recreate or remove map on browser backward/forward
  window.addEventListener('popstate', (e) => {
    const bodyElements = document.querySelectorAll(`body > :not(.defra-map):not(script)`)
    if (e.state.v !== '') {
      if (window.flood.activeMap) { // * Safari fires popstate on page load?
        return
      }
      // Set document properties
      document.title = `Map view: ${document.title}`
      bodyElements.forEach((element) => {
        element.classList.add('defra-map-hidden')
      })
      // Recreate the map
      return new LiveMap(e.state.v, {
        isBack: e.state.isBack
      })
    } else {
      // Reinstate document properties and non-map elements
      document.title = document.title.replace('Map view: ', '')
      bodyElements.forEach((element) => {
        element.classList.remove('defra-map-hidden')
      })
      // Remove the map and return focus
      if (window.flood.activeMap) { // * Safari fires popstate on page load?
        const parentElement = window.flood.activeMap.containerElement.parentNode
        parentElement.removeChild(window.flood.activeMap.containerElement)
        document.getElementById(window.flood.activeMap.mapId + '-btn').focus()
        window.flood.activeMap = null
      }
    }
  })

  // Hide non-map elements and change document title when map initialises
  window.addEventListener('mapinit', (e) => {
    const bodyElements = document.querySelectorAll(`body > :not(.defra-map):not(script)`)
    document.title = `Map view: ${document.title}`
    bodyElements.forEach((element) => {
      element.classList.add('defra-map-hidden')
    })
  })

  // Remove map
  window.addEventListener('mapremove', (e) => {
    const bodyElements = document.querySelectorAll(`body > :not(.defra-map):not(script)`)
    if (window.history.state.isBack) {
      window.history.back()
    } else {
      // Remove url parameters
      let search = window.location.search
      const paramKeys = ['v', 'lyr', 'ext', 'sid']
      paramKeys.forEach(paramKey => {
        search = addOrUpdateParameter(search, paramKey, '')
      })
      // Reset history
      const data = { v: '', isBack: false }
      const url = window.location.pathname + search
      const title = document.title.replace('Map view: ', '')
      window.history.replaceState(data, title, url)
      // Reinstate document properties and non-map elements
      document.title = title
      bodyElements.forEach((element) => {
        element.classList.remove('defra-map-hidden')
      })
      // Remove the map and return focus
      const parentElement = window.flood.activeMap.containerElement.parentNode
      parentElement.removeChild(window.flood.activeMap.containerElement)
      document.getElementById(window.flood.activeMap.mapId + '-btn').focus()
      window.flood.activeMap = null
    }
  })

  window.flood.isLiveMapsInitialised = true
}
