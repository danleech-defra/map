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

window.flood.maps.MapContainer = function MapContainer (btnId, containerId, options) {
  const defaults = {
    minIconResolution: window.flood.maps.minResolution,
    keyTemplate: ''
  }
  options = Object.assign({}, defaults, options)

  // Prorotype kit only - remove in production
  options.keyTemplate = `public/templates/${options.keyTemplate}`

  // Create container element
  const containerElement = document.getElementById(containerId)
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-label', 'Map view')

  // Set states
  let isKeyOpen, isInfoOpen, isTooltipOpen, isMobile, isTablet

  // Remove default controls
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    keyboardPan: false,
    attribution: false
  })

  // Render map
  const map = new Map({
    target: containerElement,
    layers: options.layers,
    view: options.view,
    controls: controls,
    keyboardEventTarget: document,
    interactions: options.interactions
  })

  // Get reference to viewport
  const viewport = document.getElementsByClassName('ol-viewport')[0]
  viewport.id = 'viewport'
  viewport.tabIndex = 0
  viewport.setAttribute('role', 'region')
  viewport.className = `defra-map-viewport ${viewport.className}`

  // Get a reference to keyboardPan interaction
  let keyboardPan
  map.getInteractions().forEach(interaction => {
    if (interaction instanceof KeyboardPan) {
      keyboardPan = interaction
    }
  })

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

  // Create open key button
  const openKeyButton = document.createElement('button')
  openKeyButton.className = 'defra-map__open-key'
  openKeyButton.innerHTML = 'Open key'
  viewport.insertBefore(openKeyButton, viewport.firstChild)

  // Create exit map button
  const hasHistory = window.history.state ? window.history.state.hasHistory || false : false
  const exitMapButton = document.createElement('button')
  exitMapButton.className = hasHistory ? 'defra-map__back' : 'defra-map__exit'
  exitMapButton.appendChild(document.createTextNode('Exit map'))
  viewport.insertBefore(exitMapButton, viewport.firstChild)

  // Create viewport keyboard access tooltip
  const tooltipElement = document.createElement('div')
  tooltipElement.className = 'defra-map-tooltip'
  tooltipElement.id = 'tooltip'
  tooltipElement.setAttribute('role', 'tooltip')
  tooltipElement.hidden = true
  tooltipElement.innerHTML = 'Zoom in to select features using number keys'
  viewport.appendChild(tooltipElement)

  // Create zoom controls
  const zoom = new Zoom({
    className: 'defra-map-zoom',
    target: viewport
  })
  map.addControl(zoom)

  // Create feature information panel
  const infoElement = document.createElement('div')
  infoElement.className = 'defra-map-info'
  infoElement.id = 'info'
  infoElement.setAttribute('role', 'dialog')
  infoElement.setAttribute('open', false)
  infoElement.setAttribute('aria-modal', false)
  infoElement.setAttribute('aria-label', 'Feature information')
  infoElement.tabIndex = 0
  const closeInfoButton = document.createElement('button')
  closeInfoButton.className = 'defra-map-info__close'
  closeInfoButton.innerHTML = 'Close'
  const infoContainer = document.createElement('div')
  infoContainer.className = 'defra-map-info__container'
  infoElement.appendChild(closeInfoButton)
  infoElement.appendChild(infoContainer)
  containerElement.appendChild(infoElement)

  // Create key
  const keyElement = document.createElement('div')
  keyElement.className = 'defra-map-key'
  keyElement.id = 'key'
  keyElement.setAttribute('aria-labelledby', 'mapKeyLabel')
  keyElement.tabIndex = 0
  const keyTitle = document.createElement('span')
  keyTitle.id = 'mapKeyLabel'
  keyTitle.className = 'defra-map-key__title'
  keyTitle.innerHTML = 'Key'
  keyElement.appendChild(keyTitle)
  const closeKeyButton = document.createElement('button')
  closeKeyButton.className = 'defra-map-key__close'
  closeKeyButton.innerHTML = 'Close key'
  keyElement.appendChild(closeKeyButton)
  const keyContainer = document.createElement('div')
  keyContainer.className = 'defra-map-key__container'
  keyContainer.innerHTML = window.nunjucks.render(options.keyTemplate)
  keyElement.appendChild(keyContainer)
  containerElement.appendChild(keyElement)

  // Set initial focus
  viewport.focus()

  //
  // Events
  //

  // Radio group focus/blur
  const radios = containerElement.querySelectorAll('input[type="radio"]')
  radios.forEach(function (radio) {
    radio.addEventListener('focus', (e) => {
      keyboardPan.setActive(false)
    })
    radio.addEventListener('blur', (e) => {
      keyboardPan.setActive(true)
    })
  })

  // Mobile behavior
  const mobileMediaQuery = window.matchMedia('(max-width: 40.0525em)')
  const zoomButtons = document.querySelectorAll('.defra-map-zoom button')
  const mobileListener = function (mobileMediaQuery) {
    isMobile = mobileMediaQuery.matches
    zoomButtons.forEach(function (button) {
      button.hidden = isMobile
    })
  }
  mobileListener(mobileMediaQuery)
  mobileMediaQuery.addListener(mobileListener)

  // Tablet (upto portrait) behavior
  const tabletMediaQuery = window.matchMedia('(max-width: 48.0625em)')
  const tabletListener = function (tabletMediaQuery) {
    isTablet = tabletMediaQuery.matches
    isKeyOpen = (containerElement.classList.contains('defra-map--key-open') && isTablet) || !isTablet
    keyElement.setAttribute('role', isTablet ? 'dialog' : 'region')
    closeKeyButton.hidden = !isTablet
    openKeyButton.hidden = !isTablet
    if (isTablet) {
      keyElement.setAttribute('open', isKeyOpen)
      keyElement.setAttribute('aria-modal', true)
    } else {
      keyElement.removeAttribute('open')
      keyElement.removeAttribute('aria-modal')
    }
    viewport.tabIndex = isTablet && isKeyOpen ? -1 : 0
  }
  tabletListener(tabletMediaQuery)
  tabletMediaQuery.addListener(tabletListener)

  // Map click
  map.on('click', function (e) {
    // Hide key
    if (isTablet && isKeyOpen) {
      this.closeKey()
    }
    // Close info panel
    if (isInfoOpen) {
      this.closeInfo()
    }
  }.bind(this))

  // Move focus back to containerElement on mouse down
  containerElement.addEventListener('pointerdown', function (e) {
    document.activeElement.blur()
  })

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
  containerElement.addEventListener('keyup', function (e) {
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

  // Constrain tab focus within dialog
  containerElement.addEventListener('keydown', function (e) {
    const isTabPressed = e.which === 9
    if (!isTabPressed) {
      return
    }
    const tabring = document.activeElement.closest('[role="dialog"]')
    const specificity = tabring.classList.contains('defra-map') ? '.defra-map [role="region"] ' : '#' + tabring.id + ' '
    const selectors = [
      'a[href]:not([disabled]):not([hidden])',
      'button:not([disabled]):not([hidden])',
      'textarea:not([disabled]):not([hidden])',
      'input[type="text"]:not([disabled]):not([hidden])',
      'input[type="radio"]:not([disabled]):not([hidden])',
      'input[type="checkbox"]:not([disabled]):not([hidden])',
      'select:not([disabled]):not([hidden])',
      ''
    ]
    const focusableEls = document.querySelectorAll(selectors.map(i => specificity + i).join(','))
    const firstFocusableEl = focusableEls[0]
    const lastFocusableEl = focusableEls[focusableEls.length - 1]
    if (e.shiftKey) /* shift + tab */ {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus()
        e.preventDefault()
      }
    } else /* tab */ {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus()
        e.preventDefault()
      }
    }
  })

  // Move tab focus between regions
  containerElement.addEventListener('keydown', function (e) {
    const isRegionKeyPressed = e.which === 117
    if (!isRegionKeyPressed) {
      return
    }
    if (e.shiftKey) /* shift + F6 */ {
      console.log('Previous region')
    } else /* F6 */ {
      console.log('Next region')
    }
  })

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
    containerElement.classList.add('defra-map--key-open')
    viewport.tabIndex = -1
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    this.closeInfo()
    closeKeyButton.focus()
  }

  this.closeKey = function () {
    isKeyOpen = !isTablet
    containerElement.classList.remove('defra-map--key-open')
    viewport.tabIndex = 0
    keyElement.setAttribute('open', isKeyOpen)
    keyElement.setAttribute('aria-modal', isTablet)
    openKeyButton.focus()
  }

  this.showInfo = function (id) {
    isInfoOpen = true
    infoElement.classList.add('defra-map-info--open')
    infoElement.setAttribute('open', true)
    infoElement.focus()
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
  this.containerElement = containerElement
  this.closeInfoButton = closeInfoButton
  this.viewport = viewport
  this.hasHistory = hasHistory
}
