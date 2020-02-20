'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Overlay } from 'ol'
import { getCenter } from 'ol/extent'
import { transformExtent } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { defaults as defaultInteractions } from 'ol/interaction'

const maps = window.flood.maps
const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const MapContainer = maps.MapContainer

function LiveMap (containerId, queryParams) {
  // View
  const view = new View({
    zoom: 6,
    minZoom: 6,
    maxZoom: 18,
    center: maps.center,
    extent: maps.extent
  })

  // Layers
  const road = maps.layers.road()
  const satellite = maps.layers.satellite()
  const vectorTiles = maps.layers.vectorTiles()
  const warnings = maps.layers.warnings()
  const stations = maps.layers.stations()
  const rainfall = maps.layers.rainfall()
  const impacts = maps.layers.impacts()
  const selected = maps.layers.selected()

  const defaultLayers = [
    road,
    satellite,
    selected
  ]

  const dataLayers = [
    vectorTiles,
    rainfall,
    stations,
    warnings,
    impacts
  ]

  const layers = defaultLayers.concat(dataLayers)

  // Set selected feature id from querystring
  let selectedFeatureId = getParameterByName('sid') || ''

  // Interactions with reference to keyboardPan
  const interactions = defaultInteractions()

  // Store features that are visible in the viewport
  let visibleFeatures = []

  // MapContainer options
  const options = {
    maxBigZoom: 200,
    view: view,
    layers: layers,
    queryParams: queryParams,
    interactions: interactions,
    keyTemplate: 'key-live.html'
  }

  // Create MapContainer
  const container = new MapContainer(containerId, options)
  const closeInfoButton = container.closeInfoButton
  const viewport = container.viewport
  const map = container.map
  const mapElement = container.mapElement

  // Set layers, extent and key items from querystring
  if (getParameterByName('ext')) {
    setExtent()
  }
  if (getParameterByName('lyr')) {
    toggleLayerVisibility()
    setCheckboxes()
  }

  // Detect keyboard interaction on features
  let isKeyboardInteraction

  // Set map extent from querystring
  function setExtent (padding = [0, 0, 0, 0]) {
    const ext = getParameterByName('ext')
    let extent = ext.split(',').map(Number)
    extent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
    map.getView().fit(extent, { constrainResolution: false, padding: padding })
  }

  // Show or hide layers
  function toggleLayerVisibility () {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    dataLayers.forEach(function (layer) {
      const isVisble = lyrs.some(lyr => layer.get('featureCodes').includes(lyr))
      layer.setVisible(isVisble)
    })
  }

  // Show or hide warning types
  function toggleWarningTypes () {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    warnings.getSource().forEachFeature(function (warning) {
      const state = warning.get('state')
      const isActive = (
        (state === 11 && lyrs.includes('ts')) ||
        (state === 12 && lyrs.includes('tw')) ||
        (state === 13 && lyrs.includes('ta')) ||
        (state === 14 && lyrs.includes('tr'))
      )
      const vectorTile = vectorTiles.getSource().getFeatureById(warning.getId())
      warning.set('isActive', isActive)
      if (vectorTile) {
        vectorTile.set('isActive', isActive)
      }
    })
  }

  // Set vector tile state from associated warning feature
  function setVectorTileStates () {
    vectorTiles.getSource().forEachFeature(function (feature) {
      const warning = warnings.getSource().getFeatureById(feature.getId())
      if (warning) {
        feature.set('state', warning.get('state'))
      }
    })
  }

  // Toggle features selected state
  function toggleFeatureSelected (id, state) {
    dataLayers.forEach(function (layer) {
      const feature = layer.getSource().getFeatureById(id)
      if (feature) {
        feature.set('isSelected', state)
      }
    })
  }

  // Add a feature to the selected layer
  function cloneFeature (id) {
    dataLayers.forEach(function (layer) {
      const feature = layer.getSource().getFeatureById(id)
      if (feature) {
        selected.getSource().addFeature(feature)
      }
    })
  }

  // Set selected feature (includes opening and closing info panel)
  function setSelectedFeature (id) {
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
  function setCheckboxes () {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const checkboxes = document.querySelectorAll('.defra-map-key input[type=checkbox]')
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = lyrs.includes(checkbox.id)
    })
  }

  // Toggle key symbols based on resolution
  function toggleKeySymbol (resolution) {
    forEach(mapElement.querySelectorAll('.defra-map-key *[data-style]'), function (symbol) {
      const style = symbol.getAttribute('data-style')
      const offsetStyle = symbol.getAttribute('data-style-offset')
      const isBigZoom = resolution <= options.maxBigZoom
      symbol.style = isBigZoom ? offsetStyle : style
    })
  }

  // Function update url and replace history state
  function replaceHistory (queryParam, value) {
    const data = { v: containerId, hasHistory: container.hasHistory }
    const url = addOrUpdateParameter(window.location.pathname + window.location.search, queryParam, value)
    const title = document.title
    window.history.replaceState(data, title, url)
  }

  // Get visible features
  function getVisibleFeatures () {
    let visibleFeatures = []
    const featureCodes = { ts: [11], tw: [12], ta: [13], tr: [14], st: [21, 22, 23, 24], hi: [31], rf: [41] }
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const resolution = map.getView().getResolution()
    const extent = map.getView().calculateExtent(map.getSize())
    const isBigZoom = resolution <= options.maxBigZoom
    let layers = [rainfall, stations, impacts, isBigZoom ? vectorTiles : warnings]
    layers = layers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    let activeStates = []
    lyrs.forEach(function (lyr) { activeStates = activeStates.concat(featureCodes[lyr]) })
    layers.forEach(function (layer) {
      // We know which layer and which feature states to count
      if (visibleFeatures.length > 9) return true
      layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
        if (activeStates.includes(feature.get('state'))) {
          visibleFeatures.push({
            id: feature.getId(),
            state: feature.get('state'),
            isBigZoom: isBigZoom,
            centre: getCenter(feature.getGeometry().getExtent())
          })
        }
      })
    })
    return visibleFeatures
  }

  // Show overlays
  function showOverlays () {
    visibleFeatures = getVisibleFeatures()
    if (visibleFeatures.length <= 9) {
      container.hideTooltip()
      visibleFeatures.forEach(function (feature, i) {
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
    } else {
      container.showTooltip()
    }
  }

  // Hide overlays
  function hideOverlays () {
    map.getOverlays().clear()
  }

  //
  // Events
  //

  // Set selected feature and vector tile states when features have loaded
  dataLayers.forEach(function (layer) {
    const change = layer.getSource().on('change', function (e) {
      layer.set('isReady', false)
      if (this.getState() === 'ready') {
        layer.set('isReady', true)
        // Remove ready event when layer is ready
        unByKey(change)
        // Vector tiles are ready to be styled
        if (vectorTiles.get('isReady') && warnings.get('isReady')) {
          setVectorTileStates()
        }
        // Warning types can be set
        if (['vectorTiles', 'warnings'].includes(layer.get('ref'))) {
          toggleWarningTypes()
        }
        // Attempt to set selected feature when layer is ready
        setSelectedFeature(selectedFeatureId)
      }
    })
  })

  // Pan or zoom map (fires on map load aswell)
  let t1 = null
  map.addEventListener('moveend', function (e) {
    const resolution = map.getView().getResolution()
    // Toggle key symbols depending on resolution
    toggleKeySymbol(resolution)
    // Update url (history state) to reflect new extent
    const extent = map.getView().calculateExtent(map.getSize())
    let ext = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
    ext = ext.map(function (x) { return Number(x.toFixed(6)) })
    ext = ext.join(',')
    // Timer used to stop 100 url replaces in 30 seconds limit
    clearTimeout(t1)
    t1 = setTimeout(function () {
      // Show overlays for visible features
      hideOverlays()
      if (isKeyboardInteraction) {
        showOverlays()
      }
      // Is map view
      if (getParameterByName('v')) {
        replaceHistory('ext', ext)
      }
    }, 350)
  })

  // Show cursor when hovering over features
  map.addEventListener('pointermove', function (e) {
    // Detect vector feature at mouse coords
    const hit = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
      return true
    })
    map.getTarget().style.cursor = hit ? 'pointer' : ''
  })

  // Select feature if map is clicked
  map.addEventListener('click', function (e) {
    // Get mouse coordinates and check for feature
    const feature = map.forEachFeatureAtPixel(e.pixel, function (feature) { return feature })
    setSelectedFeature(feature ? feature.getId() : '')
  })

  // Toggle layers/features if key item changed
  const key = document.querySelector('.defra-map-key')
  key.addEventListener('change', function (e) {
    if (e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {
      const checkbox = e.target
      let lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      checkbox.checked ? lyrs.push(checkbox.id) : lyrs.splice(lyrs.indexOf(checkbox.id), 1)
      lyrs = lyrs.join(',')
      replaceHistory('lyr', lyrs)
      toggleLayerVisibility()
      toggleWarningTypes()
      hideOverlays()
      if (isKeyboardInteraction) {
        showOverlays()
      }
    }
  })

  // Show overlays or tooltip when viewport gets focus
  viewport.addEventListener('focus', function () {
    hideOverlays()
    if (this.classList.contains('focus-visible')) {
      isKeyboardInteraction = true
      showOverlays()
    }
  })

  // Hide tooltip on vierwport blur
  viewport.addEventListener('blur', function () {
    container.hideTooltip()
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', function (e) {
    setSelectedFeature()
  })

  // Clear selected feature when pressing escape
  mapElement.addEventListener('keyup', function (e) {
    if (e.keyCode === 27 && selectedFeatureId !== '') {
      setSelectedFeature()
    }
  })

  // Listen for number keys
  mapElement.addEventListener('keyup', function (e) {
    if (visibleFeatures.length <= 9) {
      let index = -1
      if ((e.keyCode - 48) >= 1 && (e.keyCode - 48) <= visibleFeatures.length) {
        index = e.keyCode - 49
      } else if ((e.keyCode - 96) >= 1 && (e.keyCode - 96) <= visibleFeatures.length) {
        index = e.keyCode - 97
      }
      if (index >= 0) {
        setSelectedFeature(visibleFeatures[index].id)
      }
    }
  })

  // Hide overlays when any part of the map is clicked
  map.addEventListener('click', function (e) {
    isKeyboardInteraction = false
    hideOverlays()
  })

  //
  // Public methods
  //

  this.addTargetArea = function (id, cooridinates, selected = true) {
    console.log('Add target area1')
  }

  //
  // Public properties
  //

  this.container = container
  this.map = map
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = function (containerId, queryParams = {}) {
  return new LiveMap(containerId, queryParams)
}
