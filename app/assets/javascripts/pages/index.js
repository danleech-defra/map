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

// Add target area to map each time it is opened
/*
window.addEventListener('mapinit', (e) => {
  if (window.flood.activeMap.mapId === 'map1') {
    window.flood.activeMap.setTargetArea()
  }
})
*/

// Detects whether active element received keyboard event
keyboardFocus(document)

// Create a map
window.flood.maps.createLiveMap('map1', { // Button Id (Required)
  // btnText: 'View map' // Overide map button text
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4', // Overide map button styling
  queryParams: { // Properties persist in the querystring
    lyr: 'ts,tw,ta', // Default layers to display (tr removed)
    ext: [-1.326567, 53.871946, -0.953128, 54.149476] // Optional initial zoom to extent
    // sid: 'ta.122WAF946' // Optional intial selected feature
  },
  targetArea: {
    id: 'ta.011FWFNC3A',
    name: 'River Eden at Carlisle, Rickerby Park, Swifts and Stoneyholme Golf Courses',
    centre: [-2.909899, 54.901598], // LonLat for centroid
    polygon: window.flood.model.geometry // GeoJson geometery object for Polygon or MultiPolygon
  }
  // center: [-1.548567, 53.801277], // Optional initial center will be converted to extent in querystring
  // zoom: 12 // Optional initial zoom will be converted to extent in querystring
})

// Create a second map
window.flood.maps.createLiveMap('map2', {
  btnText: 'View another map',
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4'
})
