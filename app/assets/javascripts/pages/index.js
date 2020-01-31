// Add back button
(function (window, flood) {
  const utils = flood.utils
  const maps = flood.maps
  // Create LiveMap if querystring is present
  if (utils.getParameterByName('v') === 'map') {
    maps.createLiveMap('map')
  }
  // Create LiveMap if button press
  const btnContainer = document.getElementById('btn')
  if (btnContainer) {
    const button = document.createElement('button')
    button.innerText = 'View map'
    button.className = 'defra-button-map govuk-!-margin-bottom-4'
    button.id = btnContainer.id
    button.addEventListener('click', function (e) {
      maps.createLiveMap('map', { rtn: this.id, lyr: 'st' })
    })
    btnContainer.parentNode.replaceChild(button, btnContainer)
  }
  // Create LiveMap if history changes
  window.addEventListener('popstate', function (e) {
    if (e && e.state) {
      maps.createLiveMap('map')
    }
  })
})(window, window.flood)
