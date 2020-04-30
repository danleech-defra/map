'use strict'
// This file represents the map container.
// It is responsible for initialising the map
// using the ol.view, layers and other options passed.
// It also controls the zoom, full screen controls, responsiveness etc.
// No implementation details specific to a map should be in here.
// This is a generic container that could be reused for LTFRI maps, FMfP etc.
// ***To include a key, include an element with `.map-key__container` in the main inner element.
// To include a key pass its template name as an option

import { defaults as defaultControls, Zoom, Control } from 'ol/control'
import { Map } from 'ol'

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

  // Private states
  let isKeyOpen, isInfoOpen, isTooltipOpen, isMobile, isTablet

  // Public states
  this.isKeyboardEvent = true

  // Manage focus
  containerElement.tabIndex = 0
  containerElement.focus()

  // Remove default controls
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    attribution: false
  })

  // Render map
  const map = new Map({
    target: containerElement,
    layers: options.layers,
    view: options.view,
    controls: controls,
    interactions: options.interactions
  })

  // Get reference to viewport
  const viewport = containerElement.getElementsByClassName('ol-viewport')[0]
  viewport.id = 'viewport'
  viewport.setAttribute('role', 'region')
  viewport.className = `defra-map-viewport ${viewport.className}`

  // Create exit map button
  const exitMapButtonElement = document.createElement('button')
  exitMapButtonElement.className = options.exitButtonClass || 'defra-map__exit'
  exitMapButtonElement.appendChild(document.createTextNode('Exit map'))
  const exitMapButton = new Control({
    element: exitMapButtonElement
  })
  map.addControl(exitMapButton)

  // Create open key button
  const openKeyButtonElement = document.createElement('button')
  openKeyButtonElement.className = 'defra-map__open-key'
  openKeyButtonElement.innerHTML = 'Open key'
  const openKeyButton = new Control({
    element: openKeyButtonElement
  })
  map.addControl(openKeyButton)

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
    className: 'defra-map-zoom'
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

  // Addresses Ol specifics around focus element and Safari performance issue with tabindex
  if (!containerElement.hasAttribute('keyboard-focus')) {
    containerElement.removeAttribute('tabindex')
    this.isKeyboardEvent = false
  }

  //
  // Public properties
  //

  this.map = map
  this.viewport = viewport
  this.closeInfoButton = closeInfoButton

  //
  // Public methods
  //

  this.exitMap = () => {
    // Remove any document event listeners
    document.removeEventListener('keydown', keyboardInteraction)
    // Exit map could do different things?
    // Dispatch event for tasks downstream
    dispatchEvent(containerElement, 'mapremove')
  }

  this.openKey = () => {
    isKeyOpen = true
    containerElement.classList.add('defra-map--key-open')
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    container.closeInfo()
    if (container.isKeyboardEvent) {
      containerElement.tabIndex = -1
      keyElement.focus()
    }
  }

  this.closeKey = () => {
    isKeyOpen = !isTablet
    containerElement.classList.remove('defra-map--key-open')
    keyElement.setAttribute('open', isKeyOpen)
    keyElement.setAttribute('aria-modal', isTablet)
    if (container.isKeyboardEvent) {
      containerElement.tabIndex = 0
      openKeyButton.element.focus()
    }
  }

  this.showInfo = (id) => {
    isInfoOpen = true
    infoElement.classList.add('defra-map-info--open')
    infoElement.setAttribute('open', true)
    infoContainer.innerHTML = id
    if (container.isKeyboardEvent) {
      infoElement.focus()
    }
  }

  this.closeInfo = (id) => {
    isInfoOpen = false
    infoElement.classList.remove('defra-map-info--open')
    infoElement.setAttribute('open', false)
    infoContainer.innerHTML = ''
    if (container.isKeyboardEvent) {
      containerElement.focus()
    }
  }

  this.showTooltip = () => {
    isTooltipOpen = true
    tooltipElement.hidden = false
  }

  this.hideTooltip = () => {
    isTooltipOpen = false
    tooltipElement.hidden = true
  }

  //
  // Events
  //

  // Get a reference to this
  const container = this

  // Mobile behavior
  const mobileMediaQuery = window.matchMedia('(max-width: 40.0525em)')
  const zoomButtons = document.querySelectorAll('.defra-map-zoom button')
  const mobileListener = (mobileMediaQuery) => {
    isMobile = mobileMediaQuery.matches
    zoomButtons.forEach((button) => {
      button.hidden = isMobile
    })
  }
  mobileMediaQuery.addListener(mobileListener)
  mobileListener(mobileMediaQuery)

  // Tablet (upto portrait) behavior
  const tabletMediaQuery = window.matchMedia('(max-width: 48.0625em)')
  const tabletListener = (tabletMediaQuery) => {
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
    // Detect keyboard events
    if (container.isKeyboardEvent) {
      containerElement.tabIndex = isTablet && isKeyOpen ? -1 : 0
    }
  }
  tabletMediaQuery.addListener(tabletListener)
  tabletListener(tabletMediaQuery)

  // Map click
  map.on('click', (e) => {
    console.log('Map click')
    // Hide key
    if (isTablet && isKeyOpen) {
      container.closeKey()
    }
    // Close info panel
    if (isInfoOpen) {
      container.closeInfo()
    }
    // Touch interfaces
    containerElement.focus()
  })

  // Exit map click
  exitMapButton.element.addEventListener('click', (e) => {
    container.exitMap()
  })

  // Open key click
  openKeyButton.element.addEventListener('click', (e) => {
    container.openKey()
  })

  // Close key click
  closeKeyButton.addEventListener('click', (e) => {
    container.closeKey()
  })

  // Close info click
  closeInfoButton.addEventListener('click', (e) => {
    container.closeInfo()
  })

  // Mouse or touch interaction
  containerElement.addEventListener('pointerdown', (e) => {
    container.isKeyboardEvent = false
    keyElement.blur()
    infoElement.blur()
    containerElement.removeAttribute('tabindex')
    containerElement.removeAttribute('keyboard-focus')
    containerElement.blur() // Fix: IOS performance issue
  })

  // Keyboard interaction
  const keyboardInteraction = (e) => {
    if (!container.isKeyboardEvent) {
      container.isKeyboardEvent = true
      // Tabindex is added with appropriate value
      tabletListener(tabletMediaQuery)
      // Reset focus to container on first tab press
      if (e.keyCode === 9) {
        if (!containerElement.hasAttribute('keyboard-focus') && (document.activeElement === document.body || document.activeElement === containerElement)) {
          e.preventDefault()
          containerElement.focus()
          containerElement.setAttribute('keyboard-focus', '')
        }
      }
    }
  }
  document.addEventListener('keydown', keyboardInteraction)

  // Escape key behaviour
  containerElement.addEventListener('keyup', (e) => {
    if (e.keyCode === 27) {
      if (isTooltipOpen) {
        container.hideTooltip()
      } else if (isInfoOpen) {
        container.closeInfo()
      } else if (isTablet && isKeyOpen) {
        container.closeKey()
      } else {
        container.exitMap()
      }
    }
  })

  // Constrain tab focus within dialog
  containerElement.addEventListener('keydown', (e) => {
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
  containerElement.addEventListener('keyup', (e) => {
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

  // Disable pinch and double tap zoom
  infoElement.addEventListener('touchmove', (e) => {
    e.preventDefault()
  }, { passive: false })
}
