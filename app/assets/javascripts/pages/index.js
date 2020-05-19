'use strict'
// import '../components/nunjucks'
import '../core'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import './model' // Temporary geometry

// Create a map
window.flood.maps.createLiveMap('map1', { // Button Id (Required)
  // btnText: 'View map' // Overide map button text
  headingText: 'Map showing flood warnings',
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4', // Overide map button styling
  layers: 'mv,sh,st', // 'mv,ts,tw,ta,ti', Default layers to display (tr removed)
  centre: [-2.56037241, 53.39066965], // Optional initial center will be converted to extent in querystring
  zoom: 14, // Optional initial zoom level
  selectedId: 'st.5149'
  // extent: [-1.326567, 53.871946, -0.953128, 54.149476], // LonLat array for initial extent
  /*
  targetArea: {
    id: 'flood.011FWFNC3A',
    name: 'River Eden at Carlisle, Rickerby Park, Swifts and Stoneyholme Golf Courses',
    centre: [-2.90990, 54.90160], // LonLat for centroid,
    polygon: window.flood.model.geometry.coordinates // MultiPolygon coordinates array for boundary
  },
  selectedId: 'flood.011FWFNC3A' // Optional intial selected feature
  targetArea: {
    id: 'flood.122FWF723',
    name: 'River Ouse at Naburn Lock',
    centre: [-1.09613548180462, 53.8939176939008], // LonLat for centroid,
    polygon: window.flood.model.geometry.coordinates // MultiPolygon coordinates array for boundary
  },
  selectedId: 'flood.122FWF723'
  */
})

// Create a second map
window.flood.maps.createLiveMap('map2', {
  btnText: 'View another map',
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4',
  layers: 'sv',
  centre: [-2.90990, 54.90160],
  zoom: 14
})
