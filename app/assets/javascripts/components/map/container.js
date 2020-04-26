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
import { KeyboardPan, DragPan } from 'ol/interaction'

const { dispatchEvent } = window.flood.utils

window.flood.maps.MapContainer = function MapContainer (containerElement, options) {
  // Setup defaults
  const defaults = {
    minIconResolution: window.flood.maps.minResolution,
    keyTemplate: ''
  }
  options = Object.assign({}, defaults, options)

  // Prorotype kit only - remove in production
  options.keyTemplate = `public/templates/${options.keyTemplate}`

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
  viewport.setAttribute('role', 'region')
  viewport.className = `defra-map-viewport ${viewport.className}`

  // Get a reference to KeyboardPan and DragPan interactions
  let keyboardPan
  let dragPan
  map.getInteractions().forEach(interaction => {
    if (interaction instanceof KeyboardPan) {
      keyboardPan = interaction
    }
    if (interaction instanceof DragPan) {
      dragPan = interaction
    }
  })

  // Create open key button
  const openKeyButton = document.createElement('button')
  openKeyButton.className = 'defra-map__open-key'
  openKeyButton.innerHTML = 'Open key'
  viewport.insertBefore(openKeyButton, viewport.firstChild)

  // Create exit map button
  const exitMapButton = document.createElement('button')
  exitMapButton.className = options.exitButtonClass || 'defra-map__exit'
  exitMapButton.appendChild(document.createTextNode('Exit map'))
  viewport.insertBefore(exitMapButton, viewport.firstChild)

  // Create viewport keyboard access tooltip
  const tooltipElement = document.createElement('div')
  tooltipElement.className = 'defra-map-tooltip'
  tooltipElement.id = 'tooltip'
  tooltipElement.setAttribute('role', 'tooltip')
  tooltipElement.hidden = true
  tooltipElement.innerHTML = 'Keyboard access guidelines'
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

  // Move focus to first focusable element within dialog
  containerElement.focus()

  //
  // Public properties
  //

  this.map = map
  this.viewport = viewport
  this.closeInfoButton = closeInfoButton
  this.isMouseOverButton = false

  //
  // Public methods
  //

  this.exitMap = function () {
    // Exit map could do different things?
    // Dispatch event for tasks downstream
    dispatchEvent(containerElement, 'mapremove')
  }

  this.openKey = function () {
    isKeyOpen = true
    containerElement.classList.add('defra-map--key-open')
    containerElement.tabIndex = -1
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    this.closeInfo()
    closeKeyButton.focus()
  }

  this.closeKey = function () {
    isKeyOpen = !isTablet
    containerElement.classList.remove('defra-map--key-open')
    containerElement.tabIndex = 0
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
    containerElement.focus()
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
  // Events
  //

  // Get a reference to this
  const container = this

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

  // Handle event propogation to map from overlayed buttons
  const buttons = viewport.querySelectorAll('.defra-map__back, .defra-map__exit, .defra-map-zoom, .defra-map-reset')
  buttons.forEach(function (button) {
    button.addEventListener('mouseenter', function (e) {
      dragPan.setActive(false)
      container.isMouseOverButton = true
    })
    button.addEventListener('mouseleave', function (e) {
      dragPan.setActive(true)
      container.isMouseOverButton = false
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
    containerElement.tabIndex = isTablet && isKeyOpen ? -1 : 0
  }
  tabletListener(tabletMediaQuery)
  tabletMediaQuery.addListener(tabletListener)

  // Map click
  map.on('click', function (e) {
    // Hide key
    if (isTablet && isKeyOpen) {
      container.closeKey()
    }
    // Close info panel
    if (isInfoOpen) {
      container.closeInfo()
    }
  })

  // Exit map click
  exitMapButton.addEventListener('click', function (e) {
    container.exitMap()
  })

  // Close key click
  closeKeyButton.addEventListener('click', function (e) {
    container.closeKey()
  })

  // Open key click
  openKeyButton.addEventListener('click', function (e) {
    container.openKey()
  })

  // Close info click
  closeInfoButton.addEventListener('click', function (e) {
    container.closeInfo()
  })

  // Escape key behaviour
  containerElement.addEventListener('keyup', function (e) {
    if (e.keyCode === 27) {
      if (isTooltipOpen) {
        container.hideTooltip()
      } else if (isInfoOpen) {
        container.closeInfo()
        containerElement.focus()
      } else if (isTablet && isKeyOpen) {
        container.closeKey()
      } else {
        container.exitMap()
      }
    }
  })

  // Remove focus on container click
  containerElement.addEventListener('pointerdown', function (e) {
    document.activeElement.blur() // Safari perfromacne bug if viewport or parent has focus
  })

  // Constrain tab focus within dialog
  containerElement.addEventListener('keydown', function (e) {
    const isTabPressed = e.which === 9
    if (!isTabPressed) {
      return
    }
    const tabring = document.activeElement.closest('[role="dialog"]')
    const specificity = tabring.classList.contains('defra-map') ? '[role="region"] ' : ''
    const selectors = [
      'a[href]:not([disabled]):not([hidden])',
      'button:not([disabled]):not([hidden])',
      'textarea:not([disabled]):not([hidden])',
      'input[type="text"]:not([disabled]):not([hidden])',
      'input[type="radio"]:not([disabled]):not([hidden])',
      'input[type="checkbox"]:not([disabled]):not([hidden])',
      'select:not([disabled]):not([hidden])'
    ]
    const focusableEls = document.querySelectorAll(`#${tabring.id}, ` + selectors.map(i => `#${tabring.id} ${specificity}` + i).join(','))
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
}
