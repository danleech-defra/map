'use strict'
// import '../components/nunjucks'
import '../core'
import 'focus-visible'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Create inactive target area as it is not in the warnings geojson
const targetArea = {
  id: 'ta.011FWFNC3A',
  name: 'River Eden at Carlisle, Rickerby Park, Swifts and Stoneyholme Golf Courses',
  coordinates: [-2.909899, 54.901598]
  // polygon: [] Required if not using vector tiles
}

window.flood.maps.createLiveMap('btn', 'map', { // Button container / Map container (Required)
  // btnText: 'View map' // Overide map button text
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4', // Overide map button styling
  queryParams: { // Properties persist in the querystring
    lyr: 'ts,tw,ta' // Default layers to display (tr removed)
    // ext: [-1.326567, 53.871946, -0.953128, 54.149476], // Optional initial zoom to extent
    // sid: 'ta.122WAF946' // Optional intial selected feature
  }
  // center: [-1.548567, 53.801277], // Optional initial center will be converted to extent in querystring
  // zoom: 12, // Optional initial zoom will be converted to extent in querystring
  // targetArea: targetArea // Optional add a target area
})
