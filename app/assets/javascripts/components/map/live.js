'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Overlay, Feature } from 'ol'
import { transform } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { defaults as defaultInteractions } from 'ol/interaction'
import { Point, MultiPolygon } from 'ol/geom'
import { buffer, containsExtent } from 'ol/extent'
import { Vector as VectorSource } from 'ol/source'

const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const maps = window.flood.maps
const { setExtentFromLonLat, getLonLatFromExtent, liveMapSymbolBreakpoint } = window.flood.maps
const MapContainer = maps.MapContainer

function LiveMap (mapId, options) {

  // Optional target area features
  const targetArea = {}

  // State object
  const state = {
    visibleFeatures: [],
    selectedFeatureId: '',
    initialExtent: []
  }

  // View
  const view = new View({
    zoom: 6, // Default zoom
    minZoom: 6, // Minimum zoom level
    maxZoom: 18, // Max zoom level
    center: maps.centre, // Default centre required
    extent: maps.extentLarge // Constrains extent
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

  // These layers are static
  const defaultLayers = [
    road,
    satellite,
    // nuts1,
    selected
  ]

  // These layers can be manipulated
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

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: liveMapSymbolBreakpoint,
    view: view,
    layers: layers,
    queryParamKeys: ['v', 'lyr', 'ext', 'sid'],
    interactions: interactions,
    keyTemplate: 'key-live.html',
    isBack: options.isBack
  }

  // Create MapContainer
  const container = new MapContainer(mapId, containerOptions)
  const map = container.map
  const containerElement = container.containerElement
  const keyElement = container.keyElement
  const resetButton = container.resetButton
  const closeInfoButton = container.closeInfoButton

  //
  // Private methods
  //

  // Compare two lonLat extent arrays and return true if they are different
  const isNewExtent = (newExtent) => {
    const isSameLon1 = newExtent[0] < (state.initialExtent[0] + 0.0001) && newExtent[0] > (state.initialExtent[0] - 0.0001)
    const isSameLon2 = newExtent[2] < (state.initialExtent[2] + 0.0001) && newExtent[2] > (state.initialExtent[2] - 0.0001)
    const isSameLat1 = newExtent[1] < (state.initialExtent[1] + 0.0001) && newExtent[1] > (state.initialExtent[1] - 0.0001)
    const isSameLat2 = newExtent[3] < (state.initialExtent[3] + 0.0001) && newExtent[3] > (state.initialExtent[3] - 0.0001)
    return !(isSameLon1 && isSameLon2 && isSameLat1 && isSameLat2)
  }

  // Show or hide layers
  const setLayerVisibility = (lyrCodes) => {
    dataLayers.forEach((layer) => {
      const isVisible = lyrCodes.some(lyrCode => layer.get('featureCodes').includes(lyrCode))
      layer.setVisible(isVisible)
    })
  }

  // Show or hide features within layers
  const setFeatureVisibility = (lyrCodes, layer) => {
    layer.getSource().forEachFeature((feature) => {
      const ref = layer.get('ref')
      const state = feature.get('state')
      const isVisible = (
        // Warnings
        (state === 11 && lyrCodes.includes('ts')) ||
        (state === 12 && lyrCodes.includes('tw')) ||
        (state === 13 && lyrCodes.includes('ta')) ||
        (state === 14 && lyrCodes.includes('tr')) ||
        (state === 15 && lyrCodes.includes('ti')) ||
        // Stations
        (state === 21 && lyrCodes.includes('sh')) ||
        (ref === 'stations' && state !== 21 && lyrCodes.includes('st')) ||
        // Rainfall
        (ref === 'rainfall' && lyrCodes.includes('rf')) ||
        // Impacts
        (ref === 'impacts' && lyrCodes.includes('hi'))
      )
      feature.set('isVisible', isVisible)
    })
  }

  // Set selected feature
  const setSelectedFeature = (newFeatureId) => {
    selected.getSource().clear()
    dataLayers.forEach((layer) => {
      const originalFeature = layer.getSource().getFeatureById(state.selectedFeatureId)
      const newFeature = layer.getSource().getFeatureById(newFeatureId)
      if (originalFeature) {
        originalFeature.set('isSelected', false)
      }
      if (newFeature) {
        newFeature.set('isSelected', true)
        selected.getSource().addFeature(newFeature)
        selected.setStyle(layer.getStyle())
        container.showInfo(newFeatureId)
      }
      // Refresh target area polygons
      if (layer.get('ref') === 'warnings') {
        targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
      }
    })
    state.selectedFeatureId = newFeatureId
    // Update url
    replaceHistory('sid', newFeatureId)
  }

  // Toggle key symbols based on resolution
  const toggleKeySymbol = () => {
    forEach(containerElement.querySelectorAll('.defra-map-key__symbol'), (symbol) => {
      const isBigZoom = map.getView().getResolution() <= containerOptions.maxBigZoom
      isBigZoom ? symbol.classList.add('defra-map-key__symbol--big') : symbol.classList.remove('defra-map-key__symbol--big')
    })
  }

  // Update url and replace history state
  const replaceHistory = (key, value) => {
    const data = { v: mapId, isBack: options.isBack, initialExtent: state.initialExtent }
    const url = addOrUpdateParameter(window.location.pathname + window.location.search, key, value)
    const title = document.title
    window.history.replaceState(data, title, url)
  }

  // Get features visible in the current viewport
  const getVisibleFeatures = () => {
    const features = []
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const resolution = map.getView().getResolution()
    const extent = map.getView().calculateExtent(map.getSize())
    const isBigZoom = resolution <= containerOptions.maxBigZoom
    const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    layers.forEach((layer) => {
      if (features.length > 9) return true
      layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
        if (!feature.get('isVisible')) {
          return false
        }
        features.push({
          id: feature.getId(),
          state: layer.get('ref'), // Used to style the overlay
          isBigZoom: isBigZoom,
          centre: feature.getGeometry().getCoordinates()
        })
      })
    })
    return features
  }

  // Show overlays
  const showOverlays = () => {
    if (container.state.isKeyboard) {
      hideOverlays()
      state.visibleFeatures = getVisibleFeatures()
      if (state.visibleFeatures.length <= 9) {
        state.visibleFeatures.forEach((feature, i) => {
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

  // Set initial selected feature id
  if (getParameterByName('sid')) {
    state.selectedFeatureId = getParameterByName('sid')
  }

  // Create optional target area features
  if (options.targetArea) {
    if (options.targetArea.centre) {
      targetArea.pointFeature = new Feature({
        geometry: new Point(transform(options.targetArea.centre, 'EPSG:4326', 'EPSG:3857')),
        name: options.targetArea.name,
        state: 15 // Inactive
      })
      targetArea.pointFeature.setId(options.targetArea.id)
    }
    if (options.targetArea.polygon) {
      targetArea.polygonFeature = new Feature({
        geometry: new MultiPolygon(options.targetArea.polygon).transform('EPSG:4326', 'EPSG:3857')
      })
      targetArea.polygonFeature.setId(options.targetArea.id)
    }
  }

  // Define map extent
  let extent
  if (getParameterByName('ext')) {
    extent = getParameterByName('ext').split(',').map(Number)
  } else if (options.extent) {
    extent = options.extent.map(x => { return parseFloat(x.toFixed(6)) })
  } else if (targetArea.polygonFeature) {
    extent = getLonLatFromExtent(targetArea.polygonFeature.getGeometry().getExtent())
  } else {
    extent = getLonLatFromExtent(maps.extent)
  }

  // Set map viewport
  if (!getParameterByName('ext') && options.centre) {
    map.getView().setCenter(transform(options.centre, 'EPSG:4326', 'EPSG:3857'))
    map.getView().setZoom(options.zoom || 6)
  } else {
    setExtentFromLonLat(map, extent)
  }

  // Store reset extent
  state.initialExtent = window.history.state.initialExtent || getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))

  // Set layers from querystring
  if (getParameterByName('lyr')) {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    setLayerVisibility(lyrs)
    const checkboxes = document.querySelectorAll('.defra-map-key input[type=checkbox]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = lyrs.includes(checkbox.id)
    })
  }

  // Set smart key visibility
  if (options.hasSmartKey) {
    const keyItems = document.querySelectorAll('.defra-map-key__section--layers .defra-map-key__item')
    keyItems.forEach((keyItem) => {
      keyItem.style.display = 'none'
    })
  }

  //
  // Event listeners
  //

  // Set selected feature and vector tile states when features have loaded
  dataLayers.forEach((layer) => {
    const change = layer.getSource().on('change', (e) => {
      if (e.target.getState() === 'ready') {
        // Remove ready event when layer is ready
        unByKey(change)
        if (layer.get('ref') === 'warnings') {
          // Add optional target area
          if (targetArea.pointFeature) {
            if (!warnings.getSource().getFeatureById(targetArea.pointFeature.getId())) {
              // Add point feature
              warnings.getSource().addFeature(targetArea.pointFeature)
              // Add polygon if destination VectorSource (not required if VectorTileSource)
              if (targetArea.polygonFeature && targetAreaPolygons.getSource() instanceof VectorSource) {
                targetAreaPolygons.getSource().addFeature(targetArea.polygonFeature)
              }
            }
          }
        }
        // Set feature visibility after all features have loaded
        const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
        setFeatureVisibility(lyrs, layer)
        // Store reference to warnings source for use in vector tiles style function
        if (layer.get('ref') === 'warnings') {
          maps.warningsSource = warnings.getSource()
          map.addLayer(targetAreaPolygons)
        }
        // Attempt to set selected feature when layer is ready
        setSelectedFeature(state.selectedFeatureId)
        // Show overlays
        showOverlays()
      }
    })
  })

  // Pan or zoom map (fires on map load aswell)
  let timer = null
  map.addEventListener('moveend', (e) => {
    // Toggle key symbols depending on resolution
    toggleKeySymbol()
    // Set polygon layer opacity
    setOpacityTargetAreaPolygons()
    // Timer used to stop 100 url replaces in 30 seconds limit
    clearTimeout(timer)
    timer = setTimeout(() => {
      // Show overlays for visible features
      showOverlays()
      // Update url (history state) to reflect new extent
      const ext = getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))
      replaceHistory('ext', ext.join(','))
      // Show reset button if extent has changed
      if (isNewExtent(ext)) {
        resetButton.removeAttribute('disabled', '')
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

  // Handle all key presses
  containerElement.addEventListener('keyup', (e) => {
    // Show overlays when tab, enter or space is press
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
      showOverlays()
    }
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && state.selectedFeatureId !== '') {
      setSelectedFeature('')
    }
    // Listen for number keys
    if (!isNaN(e.key) && e.key >= 1 && e.key <= state.visibleFeatures.length && state.visibleFeatures.length <= 9) {
      setSelectedFeature(state.visibleFeatures[e.key - 1].id)
    }
  })

  // Hide overlays (excludes checkbox click)
  containerElement.addEventListener('click', (e) => {
    hideOverlays()
  })

  // Hide overlays on checkbox pointerup
  keyElement.addEventListener('pointerup', (e) => {
    if (e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {
      hideOverlays()
    }
  })

  // Toggle layers/features if key item changed
  keyElement.addEventListener('click', (e) => {
    if (e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {
      e.stopPropagation()
      const checkbox = e.target
      let lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      checkbox.checked ? lyrs.push(checkbox.id) : lyrs.splice(lyrs.indexOf(checkbox.id), 1)
      dataLayers.forEach((layer) => {
        setFeatureVisibility(lyrs, layer)
      })
      setLayerVisibility(lyrs)
      lyrs = lyrs.join(',')
      replaceHistory('lyr', lyrs)
      targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
      showOverlays()
    }
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    setSelectedFeature('')
  })

  // Reset location button
  resetButton.addEventListener('click', (e) => {
    setExtentFromLonLat(map, state.initialExtent)
    resetButton.setAttribute('disabled', '')
    containerElement.focus()
  })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = (mapId, options = {}) => {
  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = document.title
    let url = window.location
    window.history.replaceState(data, title, url)
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
    let url = window.location
    url = addOrUpdateParameter(url, 'v', mapId)
    // Add any querystring parameters from constructor
    if (options.layers) { url = addOrUpdateParameter(url, 'lyr', options.layers) }
    if (options.extent) { url = addOrUpdateParameter(url, 'ext', options.extent) }
    if (options.selectedId) { url = addOrUpdateParameter(url, 'sid', options.selectedId) }
    window.history.pushState(data, title, url)
    options.isBack = true
    return new LiveMap(mapId, options)
  })

  // Recreate map on popstate
  window.addEventListener('popstate', (e) => {
    if (e.state.v === mapId) {
      options.isBack = window.history.state.isBack
      return new LiveMap(e.state.v, options)
    }
  })

  // Recreate map on refresh or direct
  if (window.flood.utils.getParameterByName('v') === mapId) {
    options.isBack = window.history.state.isBack
    return new LiveMap(mapId, options)
  }
}
