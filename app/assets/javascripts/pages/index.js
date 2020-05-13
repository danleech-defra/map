'use strict'
// import '../components/nunjucks'
import '../core'
import keyboardFocus from 'keyboard-focus'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import './model' // Temporary geometry

// Detects whether active element received keyboard event
keyboardFocus(document)

// Create a map
window.flood.maps.createLiveMap('map1', { // Button Id (Required)
  // btnText: 'View map' // Overide map button text
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4', // Overide map button styling
  layers: 'ts,tw,ta,ti', // Default layers to display (tr removed)
  // centre: [-1.54857, 53.80128], // Optional initial center will be converted to extent in querystring
  // zoom: 10 // Optional initial zoom level
  extent: [-1.326567, 53.871946, -0.953128, 54.149476], // LonLat array for initial extent
  selectedId: 'ta.122WAF946' // Optional intial selected feature
  /*
  targetArea: {
    id: 'ta.011FWFNC3A',
    name: 'River Eden at Carlisle, Rickerby Park, Swifts and Stoneyholme Golf Courses',
    centre: [-2.90990, 54.90160], // LonLat for centroid,
    polygon: window.flood.model.geometry.coordinates // MultiPolygon coordinates array for boundary
  }
  */
})

// Create a second map
window.flood.maps.createLiveMap('map2', {
  btnText: 'View another map',
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4',
  centre: [-2.90990, 54.90160],
  zoom: 14
})
