'use strict'
// import '../components/nunjucks'
import '../core'
import 'focus-visible'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Create LiveMap if querystring is present
if (window.flood.utils.getParameterByName('v') === 'map') {
  window.flood.maps.createLiveMap('map')
}
// Create LiveMap if button press
const btnContainer = document.getElementById('btn')
if (btnContainer) {
  const button = document.createElement('button')
  button.innerText = 'View map'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.id = btnContainer.id
  button.addEventListener('click', function (e) {
    window.flood.maps.createLiveMap('map', { rtn: this.id, lyr: 'st' })
  })
  btnContainer.parentNode.replaceChild(button, btnContainer)
}
// Create LiveMap if history changes
window.addEventListener('popstate', function (e) {
  if (e && e.state) {
    window.flood.maps.createLiveMap('map')
  }
})
