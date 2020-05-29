'use strict'
// This file represents the 5 day outlook used on the national page.
// It uses the MapContainer
// TODO: needs refactoring into layers and styles
// ALSO need to fix the functionality, I don't think the tickets have been developed as of 31/01/2020
import { Map, View } from 'ol'
import { defaults as defaultControls, Zoom, Control } from 'ol/control'
import { transform, transformExtent } from 'ol/proj'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { defaults as defaultInteractions } from 'ol/interaction'
import { GeoJSON } from 'ol/format'
import { Style, Fill } from 'ol/style'
import { unByKey } from 'ol/Observable'

const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const maps = window.flood.maps
const { setExtentFromLonLat, getLonLatFromExtent } = window.flood.maps

function AreaMap (containerId, options) {
  // View
  const view = new View({
    zoom: 6,
    minZoom: 6,
    maxZoom: 30,
    center: maps.center,
    extent: maps.extentLarge
  })

  // Layers
  const road = maps.layers.road()

  // Configure default interactions
  const interactions = defaultInteractions({
    pinchRotate: false
  })

  // Remove default controls
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    attribution: false
  })

  const containerElement = document.getElementById(containerId)
  containerElement.className = 'defra-area-map'

  // Render map
  const map = new Map({
    target: containerElement,
    layers: [road],
    view: view,
    controls: controls,
    interactions: interactions
  })

  //
  // Private methods
  //

  //
  // Setup
  //

  map.getView().setCenter(transform(options.centre, 'EPSG:4326', 'EPSG:3857'))
  map.getView().setZoom(options.zoom || 6)

  // Show layers
  road.setVisible(true)

  //
  // Events
  //
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createAreaMap = (containerId, options = {}) => {
  // Detect keyboard interaction
  if (!maps.interface) {
    window.addEventListener('keydown', (e) => {
      maps.interface = 'keyboard'
    })
    window.addEventListener('pointerdown', (e) => {
      maps.isKeyboard = false
    })
    window.addEventListener('focusin', (e) => {
      if (maps.isKeyboard) {
        e.target.setAttribute('keyboard-focus', '')
      }
    })
    window.addEventListener('focusout', (e) => {
      forEach(document.querySelectorAll('[keyboard-focus]'), (element) => {
        element.removeAttribute('keyboard-focus')
      })
    })
  }
  return new AreaMap(containerId, options)
}
