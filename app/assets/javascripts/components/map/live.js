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
const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const MapContainer = maps.MapContainer

function LiveMap (containerId, options) {
  // options
  const queryParams = options.queryParams
  const targetArea = options.targetArea
  const smartKey = false

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
  const nuts1 = maps.layers.nuts1()
  const targetAreaPolygons = maps.layers.targetAreaPolygons()
  const warnings = maps.layers.warnings()
  const stations = maps.layers.stations()
  const rainfall = maps.layers.rainfall()
  const impacts = maps.layers.impacts()
  const selected = maps.layers.selected()

  const defaultLayers = [
    // road,
    satellite,
    nuts1,
    selected
  ]

  const dataLayers = [
    rainfall,
    stations,
    warnings,
    impacts
  ]

  const layers = defaultLayers.concat(dataLayers)

  // Interactions with reference to keyboardPan
  const interactions = defaultInteractions()

  // Store features that are visible in the viewport
  let visibleFeatures = []

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: maps.symbolThreshold,
    view: view,
    layers: layers,
    queryParams: queryParams,
    interactions: interactions,
    keyTemplate: 'key-live.html'
  }

  // Create MapContainer
  const container = new MapContainer(containerId, containerOptions)
  const closeInfoButton = container.closeInfoButton
  const viewport = container.viewport
  const map = container.map
  const mapElement = container.mapElement

  // Set selected feature id from querystring
  let selectedFeatureId = getParameterByName('sid') || ''

  // Set layers, extent and key items from querystring
  if (getParameterByName('ext')) {
    setExtent()
  }
  if (getParameterByName('lyr')) {
    toggleLayerVisibility()
    setCheckboxes()
  }

  // Set smart key visibility
  if (smartKey) {
    const keyItems = document.querySelectorAll('.defra-map-key__section--layers .defra-map-key__item')
    keyItems.forEach(function (keyItem) {
      keyItem.style.display = 'none'
    })
  }

  // Detect keyboard interaction on features
  let isKeyboardInteraction

  //
  // Private methods
  //

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
      const isVisible = lyrs.some(lyr => layer.get('featureCodes').includes(lyr))
      layer.setVisible(isVisible)
    })
  }

  // Add a target area feature
  function addTargetArea () {
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
  function toggleFeatureVisibility () {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    dataLayers.forEach(function (layer) {
      layer.getSource().forEachFeature(function (feature) {
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
  function toggleFeatureSelected (id, state) {
    dataLayers.forEach(function (layer) {
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
  function cloneFeature (id) {
    dataLayers.forEach(function (layer) {
      const feature = layer.getSource().getFeatureById(id)
      if (feature) {
        selected.getSource().addFeature(feature)
        selected.setStyle(layer.getStyle())
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
    forEach(mapElement.querySelectorAll('.defra-map-key__symbol'), function (symbol) {
      const isBigZoom = resolution <= containerOptions.maxBigZoom
      if (isBigZoom) {
        symbol.classList.add('defra-map-key__symbol--big')
      } else {
        symbol.classList.remove('defra-map-key__symbol--big')
      }
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
    const visibleFeatures = []
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const resolution = map.getView().getResolution()
    const extent = map.getView().calculateExtent(map.getSize())
    const isBigZoom = resolution <= containerOptions.maxBigZoom
    const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    layers.forEach(function (layer) {
      if (visibleFeatures.length > 9) return true
      layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
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
  function showOverlays () {
    hideOverlays()
    visibleFeatures = getVisibleFeatures()
    if (visibleFeatures.length <= 9) {
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
    }
  }

  // Hide overlays
  function hideOverlays () {
    map.getOverlays().clear()
  }

  // Restyle polygons
  function restyleTargetAreaPolygons () {
    // Triggers layer to be restyled
    targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
  }

  // Set target area polygon opacity
  function setOpacityTargetAreaPolygons () {
    if (targetAreaPolygons.getVisible()) {
      const resolution = Math.floor(map.getView().getResolution())
      // Opacity graduates between 1 and 0.4 with resolution
      const opacity = Math.min(Math.max((resolution + 40) / 100, 0.4), 1)
      targetAreaPolygons.setOpacity(opacity)
    }
  }

  // Pan map
  function panToFeature (feature) {
    let extent = map.getView().calculateExtent(map.getSize())
    extent = buffer(extent, -1000)
    if (!containsExtent(extent, feature.getGeometry().getExtent())) {
      map.getView().setCenter(feature.getGeometry().getCoordinates())
    }
  }

  //
  // Events
  //

  // Set selected feature and vector tile states when features have loaded
  dataLayers.forEach(function (layer) {
    const change = layer.getSource().on('change', function (e) {
      if (this.getState() === 'ready') {
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
        if (isKeyboardInteraction) {
          showOverlays()
        }
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
    // Set polygon layer opacity
    setOpacityTargetAreaPolygons()
    // Timer used to stop 100 url replaces in 30 seconds limit
    clearTimeout(t1)
    t1 = setTimeout(function () {
      // Show overlays for visible features
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
      if (!defaultLayers.includes(layer)) {
        return true
      }
    })
    map.getTarget().style.cursor = hit ? 'pointer' : ''
  })

  // Select feature if map is clicked
  map.addEventListener('click', function (e) {
    // Get mouse coordinates and check for feature
    const feature = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
      if (!defaultLayers.includes(layer)) {
        return feature
      }
    })
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
      toggleFeatureVisibility()
      restyleTargetAreaPolygons()
      if (isKeyboardInteraction) {
        showOverlays()
      }
    }
  })

  // Show overlays or tooltip when viewport gets focus
  viewport.addEventListener('focus', function () {
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
  // Public properties
  //

  this.container = container
  this.map = map
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = function (containerId, options) {
  return new LiveMap(containerId, options)
}
