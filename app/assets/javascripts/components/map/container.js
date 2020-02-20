'use strict'
// This file represents the map container.
// It is responsible for initialising the map
// using the ol.view, layers and other options passed.
// It also controls the zoom, full screen controls, responsiveness etc.
// No implementation details specific to a map should be in here.
// This is a generic container that could be reused for LTFRI maps, FMfP etc.
// ***To include a key, include an element with `.map-key__container` in the main inner element.
// To include a key pass its template name as an option

import { defaults as defaultControls, Zoom } from 'ol/control'
import { Map } from 'ol'
import { KeyboardPan } from 'ol/interaction'

const { addOrUpdateParameter, getParameterByName } = window.flood.utils

window.flood.maps.MapContainer = function MapContainer (containerId, options) {
  const defaults = {
    minIconResolution: window.flood.maps.minResolution,
    keyTemplate: ''
  }
  options = Object.assign({}, defaults, options)

  // Prorotype kit only - remove in production
  options.keyTemplate = `public/templates/${options.keyTemplate}`

  // Prefix title and hide non-map elements
  const bodyElements = document.querySelectorAll(`body > :not([id="map"]):not(script)`)
  document.title = `Map view: ${document.title}`
  bodyElements.forEach(function (node) {
    node.classList.add('defra-map-hidden')
  })

  // Create container element
  const containerElement = document.getElementById(containerId)
  const mapElement = document.createElement('div')
  mapElement.className = 'defra-map'
  mapElement.setAttribute('role', 'dialog')
  mapElement.setAttribute('open', true)
  mapElement.setAttribute('aria-modal', true)
  mapElement.setAttribute('aria-label', 'Map view')
  containerElement.append(mapElement)

  // Set states
  let isKeyOpen, isInfoOpen, isTooltipOpen, isTablet

  // Determin if user opened map or page refresh
  let isUserInteracton = !(getParameterByName('v') && getParameterByName('v') === 'map')

  // Remove default controls
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    keyboardPan: false,
    attribution: false
  })

  // Render map
  const map = new Map({
    target: mapElement,
    layers: options.layers,
    view: options.view,
    controls: controls,
    keyboardEventTarget: document,
    interactions: options.interactions
  })

  // Get reference to viewport
  const viewport = document.getElementsByClassName('ol-viewport')[0]
  viewport.className = `defra-map__viewport ${viewport.className}`
  viewport.id = 'viewport'
  viewport.tabIndex = 0
  viewport.setAttribute('aria-describedby', 'tooltip')

  // Get a reference to keyboardPan interaction
  let keyboardPan
  map.getInteractions().forEach(interaction => {
    if (interaction instanceof KeyboardPan) {
      keyboardPan = interaction
    }
  })

  // Get return focus id
  const returnFocusId = getParameterByName('rtn') || options.queryParams.rtn

  // Create viewport keyboard access tooltip
  const tooltipElement = document.createElement('div')
  tooltipElement.innerHTML = 'Zoom in to select features using number keys'
  tooltipElement.id = 'tooltip'
  tooltipElement.className = 'defra-map-tooltip'
  tooltipElement.setAttribute('role', 'tooltip')
  tooltipElement.hidden = true
  mapElement.append(tooltipElement)

  // Create feature information panel
  const infoElement = document.createElement('div')
  infoElement.id = 'info'
  infoElement.className = 'defra-map-info'
  infoElement.setAttribute('role', 'dialog')
  infoElement.setAttribute('open', false)
  infoElement.setAttribute('aria-labelledby', 'infoLabel')
  const closeInfoButton = document.createElement('button')
  closeInfoButton.className = 'defra-map-info__close'
  closeInfoButton.innerHTML = 'Close'
  const infoContainer = document.createElement('div')
  infoContainer.className = 'defra-map-info__container'
  infoElement.append(closeInfoButton)
  infoElement.append(infoContainer)
  mapElement.append(infoElement)

  // Create zoom controls
  const zoom = new Zoom({
    className: 'defra-map__zoom',
    target: mapElement
  })
  map.addControl(zoom)

  // Add a new history entry
  if (!(getParameterByName('v') === containerId)) {
    // Advance history if button pressed
    const data = { v: containerId, hasHistory: true }
    const title = document.title
    let url = window.location.pathname + window.location.search
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
  const openKeyButton = document.createElement('button')
  openKeyButton.className = 'defra-map__open-key'
  openKeyButton.innerHTML = 'Open key'
  mapElement.insertBefore(openKeyButton, mapElement.firstChild)
  const closeKeyButton = document.createElement('button')
  closeKeyButton.className = 'defra-map-key__close'
  closeKeyButton.innerHTML = 'Close key'

  // Create exit map button
  const hasHistory = window.history.state ? window.history.state.hasHistory || false : false
  const exitMapButton = document.createElement('button')
  exitMapButton.className = hasHistory ? 'defra-map__back' : 'defra-map__exit'
  exitMapButton.appendChild(document.createTextNode('Exit map'))
  mapElement.insertBefore(exitMapButton, mapElement.firstChild)
  if (isUserInteracton) {
    exitMapButton.focus()
  }

  // Create key
  const keyElement = document.createElement('div')
  keyElement.id = 'key'
  keyElement.className = 'defra-map-key'
  keyElement.setAttribute('role', 'dialog')
  keyElement.setAttribute('open', true)
  keyElement.setAttribute('aria-labelledby', 'mapKeyLabel')
  const keyTitle = document.createElement('span')
  keyTitle.id = 'mapKeyLabel'
  keyTitle.className = 'defra-map-key__title'
  keyTitle.innerHTML = 'Key'
  keyElement.append(keyTitle)
  keyElement.append(closeKeyButton)
  const keyContainer = document.createElement('div')
  keyContainer.className = 'defra-map-key__container'
  keyContainer.innerHTML = window.nunjucks.render(options.keyTemplate)
  keyElement.append(keyContainer)
  mapElement.append(keyElement)

  // Get list of focusable elements from the key
  // const allFocusElements = keyElement.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')

  //
  // Events
  //

  // Radio group focus/blur
  const radios = mapElement.querySelectorAll('input[type="radio"]')
  radios.forEach(function (radio) {
    radio.addEventListener('focus', (e) => {
      keyboardPan.setActive(false)
    })
    radio.addEventListener('blur', (e) => {
      keyboardPan.setActive(true)
    })
  })

  // Mobile key
  const mqListener = function (tablet) {
    isTablet = tablet.matches
    isKeyOpen = (mapElement.classList.contains('defra-map--key-open') && isTablet) || !isTablet
    keyElement.setAttribute('open', isKeyOpen)
    keyElement.setAttribute('aria-modal', isTablet)
    viewport.tabIndex = isTablet && isKeyOpen ? -1 : 0
  }
  const mq = window.matchMedia('(max-width: 48.0625em)') // Need to ensure this is tied to GOVUK Frontend
  mqListener(mq)
  mq.addListener(mqListener)

  // Browser history change
  const popstate = function (e) {
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
      const returnFocusElement = document.getElementById(returnFocusId)
      if (isUserInteracton) {
        returnFocusElement.focus()
      }
    }
  }
  window.addEventListener('popstate', popstate)

  // Map click
  map.on('click', function (e) {
    isUserInteracton = true
    document.activeElement.blur()
    // Hide key
    if (isTablet && isKeyOpen) {
      this.closeKey()
    }
    // Close info panel
    if (isInfoOpen) {
      this.closeInfo()
    }
  }.bind(this))

  // Exit map click
  exitMapButton.addEventListener('click', function (e) {
    this.exitMap()
  }.bind(this))

  // Close key click
  closeKeyButton.addEventListener('click', function (e) {
    this.closeKey()
  }.bind(this))

  // Open key click
  openKeyButton.addEventListener('click', function (e) {
    this.openKey()
  }.bind(this))

  // Close info click
  closeInfoButton.addEventListener('click', function (e) {
    this.closeInfo()
  }.bind(this))

  // Escape key behaviour
  mapElement.addEventListener('keyup', function (e) {
    isUserInteracton = true
    if (e.keyCode === 27) {
      if (isTooltipOpen) {
        this.hideTooltip()
      } else if (isInfoOpen) {
        this.closeInfo()
        viewport.focus()
      } else if (isTablet && isKeyOpen) {
        this.closeKey()
      } else {
        this.exitMap()
      }
    }
  }.bind(this))

  //
  // Public methods
  //

  this.exitMap = function () {
    if (hasHistory) {
      window.history.back()
    } else {
      const url = window.location.pathname
      window.location.href = url
    }
  }

  this.openKey = function () {
    isKeyOpen = true
    mapElement.classList.add('defra-map--key-open')
    viewport.tabIndex = -1
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    this.closeInfo()
    closeKeyButton.focus()
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
    if (isUserInteracton) {
      closeInfoButton.focus()
    }
    infoContainer.innerHTML = id
  }

  this.closeInfo = function (id) {
    isInfoOpen = false
    infoElement.classList.remove('defra-map-info--open')
    infoElement.setAttribute('open', false)
    infoContainer.innerHTML = ''
    viewport.focus()
  }

  this.showTooltip = function () {
    isTooltipOpen = true
    tooltipElement.hidden = false
  }

  this.hideTooltip = function () {
    isTooltipOpen = false
    tooltipElement.hidden = true
  }

  //
  // Public properties
  //

  this.map = map
  this.mapElement = mapElement
  this.closeInfoButton = closeInfoButton
  this.viewport = viewport
  this.hasHistory = hasHistory
  this.isUserInteracton = isUserInteracton
}
