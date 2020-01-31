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
    containerElement.append(mapElement)

    // Set states
    var isKeyOpen, isMobile

    // Remove default controls
    var controls = ol.control.defaults({
      zoom: false,
      rotate: false,
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
    var returnFocusId = getParameterByName('r') || options.queryParams.rtn

    // Create information container
    var infoElement = document.createElement('div')
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
    var exitMapButton = document.createElement('button')
    exitMapButton.className = 'defra-map__exit'
    exitMapButton.appendChild(document.createTextNode('Exit map'))
    exitMapButton.addEventListener('click', function (e) {
      window.history.back()
    })
    mapElement.prepend(exitMapButton)
    exitMapButton.focus()

    // Create key elements
    var keyElement = document.createElement('div')
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

    // Add a new history entry
    if (!(getParameterByName('v') === containerId)) {
      // Advance history if button pressed
      var state = { v: containerId }
      var title = document.title
      var url = window.location.pathname + window.location.search
      url = addOrUpdateParameter(url, 'v', containerId)
      if (options.queryParams) {
        // Add any querystring parameters that may have been passed in
        Object.keys(options.queryParams).forEach(function (key, index) {
          url = addOrUpdateParameter(url, key, options.queryParams[key])
        })
      }
      window.history.pushState(state, title, url)
    }

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
    var mqListener = function (mobile) {
      isMobile = mobile.matches
      isKeyOpen = (mapElement.classList.contains('defra-map--key-open') && isMobile) || !isMobile
      keyElement.setAttribute('open', isKeyOpen)
      keyElement.setAttribute('aria-modal', isMobile)
      viewport.tabIndex = isMobile && isKeyOpen ? -1 : 0
    }
    var mq = window.matchMedia('(max-width: 40.0525em)') // Need to ensure this is tied to GOVUK Frontend
    mqListener(mq)
    mq.addListener(mqListener)

    // Browser history change
    var popstate = function (e) {
      // Reenable radio group cursor keys
      keyboardPan.setActive(false)
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
      window.removeEventListener('popstate', popstate)
    }
    window.addEventListener('popstate', popstate)

    // Map click
    map.on('click', function (e) {
      document.activeElement.blur()
      // Hide key
      if (isMobile && isKeyOpen) {
        this.closeKey()
      }
    }.bind(this))

    // Key presses
    mapElement.addEventListener('keyup', function (e) {
      // Close key on escape
      if (e.keyCode === 27 && isMobile && isKeyOpen) {
        this.closeKey()
      }
      // Exclude address bar on tab key
      if (e.keyCode === 9 && isMobile && isKeyOpen) {
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
      isKeyOpen = !isMobile
      mapElement.classList.remove('defra-map--key-open')
      viewport.tabIndex = 0
      keyElement.setAttribute('open', isKeyOpen)
      keyElement.setAttribute('aria-modal', isMobile)
      openKeyButton.focus()
    }

    this.showInfo = function (id) {
      infoElement.classList.add('defra-map-info--open')
      infoElement.setAttribute('open', true)
      closeInfoButton.focus()
      infoContainer.innerHTML = id
    }

    this.closeInfo = function (id) {
      infoElement.classList.remove('defra-map-info--open')
      infoElement.setAttribute('open', false)
      infoContainer.innerHTML = ''
    }

    //
    // Public properties
    //

    this.map = map
    this.element = mapElement
  }

  maps.MapContainer = MapContainer
})(window, window.flood)
