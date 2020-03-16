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
  id: 'ta.122WAF946',
  coordinates: [-1.155721, 53.989436],
  name: 'Upper River Ouse'
}

// Create LiveMap if querystring is present
if (window.flood.utils.getParameterByName('v') === 'map') {
  window.flood.maps.createLiveMap(
    'map', {
      center: [-1.548567, 53.801277], // Optional center will be converted to extent in querystring
      zoom: 12, // Optional zoom will be converted to extent in querystring
      targetArea: targetArea // Optional add a target area
    }
  )
}

// Create LiveMap if button press
const btnContainer = document.getElementById('btn')
if (btnContainer) {
  const button = document.createElement('button')
  button.innerText = 'View map'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.id = btnContainer.id
  button.addEventListener('click', function (e) {
    window.flood.maps.createLiveMap(
      'map', {
        queryParams: { // Properties persist in the querystring only set these on button click
          rtn: this.id, // Exit map return focus
          lyr: 'ts,tw,ta', // Default layers to display (tr removed)
          ext: [-1.326567, 53.871946, -0.953128, 54.149476], // Optional initial zoom to extent
          sid: 'ta.122WAF946' // Optional intial selected feature
        },
        center: [-1.548567, 53.801277], // Optional initial center will be converted to extent in querystring
        zoom: 12, // Optional initial zoom will be converted to extent in querystring
        targetArea: targetArea // Optional add a target area
      }
    )
  })
  btnContainer.parentNode.replaceChild(button, btnContainer)
}

// Create LiveMap if history changes
window.addEventListener('popstate', function (e) {
  if (e && e.state) {
    window.flood.maps.createLiveMap(
      'map', {
        center: [-1.548567, 53.801277], // Optional center will be converted to extent in querystring
        zoom: 12, // Optional zoom will be converted to extent in querystring
        targetArea: targetArea // Optional add a target area
      }
    )
  }
})
