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
  window.flood.maps.createLiveMap({
    containerId: 'map',
    targetArea: targetArea,
    center: [0, 1], // Optional center will be converted to extent in querystring
    zoom: 14 // Optional zoom will be converted to extent in querystring
  })
}

// Create LiveMap if button press
const btnContainer = document.getElementById('btn')
if (btnContainer) {
  const button = document.createElement('button')
  button.innerText = 'View map'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.id = btnContainer.id
  button.addEventListener('click', function (e) {
    window.flood.maps.createLiveMap({
      containerId: 'map',
      queryParams: { // Properties persist in the querystring only set these on button click
        rtn: this.id, // Exit map return focus
        lyr: 'ts,tw,ta,tr', // Default layers to display
        ext: [-1.326567, 53.871946, -0.953128, 54.149476], // Optional initial zoom to extent
        sid: 'ta.122WAF946' // Optional intial selected feature
      },
      targetArea: targetArea,
      center: [0, 1], // Optional initial center will be converted to extent in querystring
      zoom: 14 // Optional initial zoom will be converted to extent in querystring
    })
  })
  btnContainer.parentNode.replaceChild(button, btnContainer)
}

// Create LiveMap if history changes
window.addEventListener('popstate', function (e) {
  if (e && e.state) {
    window.flood.maps.createLiveMap({
      containerId: 'map',
      targetArea: targetArea,
      center: [0, 1], // Optional center will be converted to extent in querystring
      zoom: 14 // Optional zoom will be converted to extent in querystring
    })
  }
})
