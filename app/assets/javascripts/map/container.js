// Constrain keyboard tabbing to dialog (ie exclude address bar)

(function (window, flood) {
  const ol = window.ol
  const maps = flood.maps
  const addOrUpdateParameter = flood.utils.addOrUpdateParameter
  const getParameterByName = flood.utils.getParameterByName

  function MapContainer (containerId, options) {
    const defaults = {
      minIconResolution: 200,
      keyTemplate: ''
    }
    options = Object.assign({}, defaults, options)

    // Prorotype kit only - remove in production
    options.keyTemplate = `public/javascripts/map/templates/${options.keyTemplate}`

    // Prefix title and hide non-map elements
    var bodyElements = document.querySelectorAll(`body > :not([id="map"]):not(script)`)
    document.title = `Map view: ${document.title}`
    bodyElements.forEach(function (node) {
      node.classList.add('defra-map-hidden')
    })

    // Create container element
    var containerElement = document.getElementById(containerId)
    var mapElement = document.createElement('div')
    mapElement.className = 'defra-map'
    mapElement.setAttribute('role', 'dialog')
    mapElement.setAttribute('open', true)
    mapElement.setAttribute('aria-modal', true)
    mapElement.setAttribute('aria-label', 'Map view')
    containerElement.append(mapElement)

    // Set states
    var isKeyOpen, isInfoOpen, isTablet

    // Remove default controls
    var controls = ol.control.defaults({
      zoom: false,
      rotate: false,
      keyboardPan: false,
      attribution: false
    })

    // Render map
    var map = new ol.Map({
      target: mapElement,
      layers: options.layers,
      view: options.view,
      controls: controls,
      keyboardEventTarget: document,
      interactions: options.interactions
    })

    // Get reference to viewport
    var viewport = document.getElementsByClassName('ol-viewport')[0]
    viewport.className = `defra-map__viewport ${viewport.className}`
    viewport.id = 'viewport'
    viewport.tabIndex = 0

    // Get a reference to keyboardPan interaction
    var keyboardPan
    map.getInteractions().forEach(interaction => {
      if (interaction instanceof ol.interaction.KeyboardPan) {
        keyboardPan = interaction
      }
    })

    // Get return focus id
    var returnFocusId = getParameterByName('rtn') || options.queryParams.rtn

    // Create information container
    var infoElement = document.createElement('div')
    infoElement.id = 'info'
    infoElement.className = 'defra-map-info'
    infoElement.setAttribute('role', 'dialog')
    infoElement.setAttribute('open', false)
    infoElement.setAttribute('aria-labelledby', 'infoLabel')
    var closeInfoButton = document.createElement('button')
    closeInfoButton.className = 'defra-map-info__close'
    closeInfoButton.innerHTML = 'Close'
    closeInfoButton.addEventListener('click', function (e) {
      this.closeInfo()
    }.bind(this))
    var infoContainer = document.createElement('div')
    infoContainer.className = 'defra-map-info__container'
    infoElement.append(closeInfoButton)
    infoElement.append(infoContainer)
    mapElement.append(infoElement)

    // Create zoom controls
    var zoom = new ol.control.Zoom({
      className: 'defra-map__zoom',
      target: mapElement
    })
    map.addControl(zoom)

    // Add a new history entry
    if (!(getParameterByName('v') === containerId)) {
      // Advance history if button pressed
      var data = { v: containerId, hasHistory: true }
      var title = document.title
      var url = window.location.pathname + window.location.search
      url = addOrUpdateParameter(url, 'v', containerId)
      if (options.queryParams) {
        // Add any querystring parameters that may have been passed in
        Object.keys(options.queryParams).forEach(function (key, index) {
          url = addOrUpdateParameter(url, key, options.queryParams[key])
        })
      }
      window.history.pushState(data, title, url)
    }

    // Create key buttons
    var openKeyButton = document.createElement('button')
    openKeyButton.className = 'defra-map__open-key'
    openKeyButton.innerHTML = 'Open key'
    var closeKeyButton = document.createElement('button')
    closeKeyButton.className = 'defra-map-key__close'
    closeKeyButton.innerHTML = 'Close key'
    closeKeyButton.addEventListener('click', function (e) {
      this.closeKey()
    }.bind(this))
    openKeyButton.addEventListener('click', function (e) {
      this.openKey()
    }.bind(this))
    mapElement.prepend(openKeyButton)

    // Create exit map button
    var hasHistory = window.history.state ? window.history.state.hasHistory || false : false
    var exitMapButton = document.createElement('button')
    exitMapButton.className = hasHistory ? 'defra-map__back' : 'defra-map__exit'
    exitMapButton.appendChild(document.createTextNode('Exit map'))
    exitMapButton.addEventListener('click', function (e) {
      this.exitMap()
    }.bind(this))
    mapElement.prepend(exitMapButton)
    exitMapButton.focus()

    // Create key elements
    var keyElement = document.createElement('div')
    keyElement.id = 'key'
    keyElement.className = 'defra-map-key'
    keyElement.setAttribute('role', 'dialog')
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-labelledby', 'mapKeyLabel')
    var keyTitle = document.createElement('span')
    keyTitle.id = 'mapKeyLabel'
    keyTitle.className = 'defra-map-key__title'
    keyTitle.innerHTML = 'Key'
    keyElement.append(keyTitle)
    keyElement.append(closeKeyButton)
    var keyContainer = document.createElement('div')
    keyContainer.className = 'defra-map-key__container'
    keyContainer.innerHTML = window.nunjucks.render(options.keyTemplate)
    keyElement.append(keyContainer)
    mapElement.append(keyElement)

    // Get list of focusable elements from the key
    var allFocusElements = keyElement.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')

    //
    // Events
    //

    // Radio group focus/blur
    var radios = mapElement.querySelectorAll('input[type="radio"]')
    radios.forEach(function (radio) {
      radio.addEventListener('focus', (e) => {
        keyboardPan.setActive(false)
      })
      radio.addEventListener('blur', (e) => {
        keyboardPan.setActive(true)
      })
    })

    // Mobile key
    var mqListener = function (tablet) {
      isTablet = tablet.matches
      isKeyOpen = (mapElement.classList.contains('defra-map--key-open') && isTablet) || !isTablet
      keyElement.setAttribute('open', isKeyOpen)
      keyElement.setAttribute('aria-modal', isTablet)
      viewport.tabIndex = isTablet && isKeyOpen ? -1 : 0
    }
    var mq = window.matchMedia('(max-width: 48.0625em)') // Need to ensure this is tied to GOVUK Frontend
    mqListener(mq)
    mq.addListener(mqListener)

    // Browser history change
    var popstate = function (e) {
      window.removeEventListener('popstate', popstate)
      // Remove all map elements from the DOM
      containerElement.removeChild(containerElement.firstChild)
      // Remove title prefix and reinstate non-map elements
      document.title = document.title.replace('Map view: ', '')
      bodyElements.forEach(function (node) {
        node.classList.remove('defra-map-hidden')
      })
      // Return focus
      if (returnFocusId) {
        var returnFocusElement = document.getElementById(returnFocusId)
        returnFocusElement.focus()
      }
    }
    window.addEventListener('popstate', popstate)

    // Map click
    map.on('click', function (e) {
      document.activeElement.blur()
      // Hide key
      if (isTablet && isKeyOpen) {
        this.closeKey()
      }
    }.bind(this))

    // Keyboard inputs
    mapElement.addEventListener('keyup', function (e) {
      // Escape key behaviour
      if (e.keyCode === 27) {
        if (isInfoOpen) {
          this.closeInfo()
          document.getElementById('viewport').focus()
        } else if (isTablet && isKeyOpen) {
          this.closeKey()
        } else {
          this.exitMap()
        }
      }
      // Enter or space bar
      if ((e.keyCode === 13 || e.keyCode === 32) && e.target === closeInfoButton) {
        document.getElementById('viewport').focus()
      }
      // Exclude address bar on tab key
      if (e.keyCode === 9 && isTablet && isKeyOpen) {
        // Get list of visible, focusable elements
        var visibleFucosElements = []
        for (var i = 0; i < allFocusElements.length; i++) {
          if (allFocusElements[i].offsetParent !== null) {
            visibleFucosElements.push(allFocusElements[i])
          }
        }
        // Tab
        // Shift Tab
      }
    }.bind(this))

    //
    // Public methods
    //

    this.exitMap = function () {
      if (hasHistory) {
        window.history.back()
      } else {
        var url = window.location.pathname
        window.location.href = url
      }
    }

    this.openKey = function () {
      isKeyOpen = true
      mapElement.classList.add('defra-map--key-open')
      viewport.tabIndex = -1
      keyElement.setAttribute('open', true)
      keyElement.setAttribute('aria-modal', true)
      closeKeyButton.focus()
      this.closeInfo()
    }

    this.closeKey = function () {
      isKeyOpen = !isTablet
      mapElement.classList.remove('defra-map--key-open')
      viewport.tabIndex = 0
      keyElement.setAttribute('open', isKeyOpen)
      keyElement.setAttribute('aria-modal', isTablet)
      openKeyButton.focus()
    }

    this.showInfo = function (id) {
      isInfoOpen = true
      infoElement.classList.add('defra-map-info--open')
      infoElement.setAttribute('open', true)
      closeInfoButton.focus()
      infoContainer.innerHTML = id
    }

    this.closeInfo = function (id) {
      isInfoOpen = false
      infoElement.classList.remove('defra-map-info--open')
      infoElement.setAttribute('open', false)
      infoContainer.innerHTML = ''
    }

    //
    // Public properties
    //

    this.map = map
    this.mapElement = mapElement
    this.closeInfoButton = closeInfoButton
    this.hasHistory = hasHistory
  }

  maps.MapContainer = MapContainer
})(window, window.flood)
