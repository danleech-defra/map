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

const { addOrUpdateParameter } = window.flood.utils

window.flood.maps.MapContainer = function MapContainer (mapId, options) {
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

  // Hide all non-map elements and prefix title
  const bodyElements = document.querySelectorAll(`body > :not(.defra-map):not(script)`)
  document.title = `Map view: ${document.title}`
  bodyElements.forEach((element) => {
    element.classList.add('defra-map-hidden')
  })

  // Create the map container element
  const containerElement = document.createElement('div')
  containerElement.id = mapId
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-label', 'Map view')
  containerElement.tabIndex = 0
  document.body.appendChild(containerElement)

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
  exitMapButtonElement.className = 'defra-map__' + (options.isBack ? 'back' : 'exit')
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

  // Create reset control
  const resetButtonElement = document.createElement('button')
  resetButtonElement.className = 'defra-map-reset'
  resetButtonElement.innerHTML = 'Reset location'
  resetButtonElement.title = 'Reset location'
  const resetButton = new Control({
    element: resetButtonElement
  })
  map.addControl(resetButton)

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

  // Start focus (will be removed if not keyboard)
  containerElement.focus()

  //
  // Private methods
  //

  const exitMap = () => {
    // Tidy up any document or window listeners
    window.addEventListener('keydown', keydown)
    if (options.isBack) {
      // Browser back
      window.history.back()
    } else {
      // Remove url parameters
      let search = window.location.search
      options.queryParamKeys.forEach(paramKey => {
        search = addOrUpdateParameter(search, paramKey, '')
      })
      // Reset history
      const data = { v: '', isBack: false }
      const url = window.location.pathname + search
      const title = document.title.replace('Map view: ', '')
      window.history.replaceState(data, title, url)
      // Reset document
      removeContainer()
    }
  }

  const removeContainer = () => {
    if (containerElement) { // Safari fires popstate on page load
      const title = document.title.replace('Map view: ', '')
      // Reinstate document properties and non-map elements
      document.title = title
      bodyElements.forEach((element) => {
        element.classList.remove('defra-map-hidden')
      })
      // Remove map and return focus
      containerElement.parentNode.removeChild(containerElement)
      document.getElementById(mapId + '-btn').focus()
    }
  }

  const openKey = () => {
    isKeyOpen = true
    containerElement.classList.add('defra-map--key-open')
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    closeInfo()
    if (container.isKeyboard) {
      containerElement.tabIndex = -1
      keyElement.focus()
    }
  }

  const closeKey = () => {
    isKeyOpen = !isTablet
    containerElement.classList.remove('defra-map--key-open')
    keyElement.setAttribute('open', isKeyOpen)
    keyElement.setAttribute('aria-modal', isTablet)
    if (container.isKeyboard) {
      containerElement.tabIndex = 0
      openKeyButton.element.focus()
    }
  }

  const closeInfo = () => {
    isInfoOpen = false
    infoElement.classList.remove('defra-map-info--open')
    infoElement.setAttribute('open', false)
    infoContainer.innerHTML = ''
    if (container.isKeyboard) {
      containerElement.focus()
    }
  }

  const hideTooltip = () => {
    isTooltipOpen = false
    tooltipElement.hidden = true
  }

  //
  // Public properties
  //

  this.map = map
  this.containerElement = containerElement
  this.viewport = viewport
  this.keyElement = keyElement
  this.resetButton = resetButtonElement
  this.closeInfoButton = closeInfoButton
  this.isKeyboard = !!containerElement.hasAttribute('keyboard-focus')

  //
  // Public methods
  //

  this.showInfo = (id) => {
    isInfoOpen = true
    infoElement.classList.add('defra-map-info--open')
    infoElement.setAttribute('open', true)
    infoContainer.innerHTML = id
    if (container.isKeyboard) {
      infoElement.focus()
    }
  }

  this.showTooltip = () => {
    isTooltipOpen = true
    tooltipElement.hidden = false
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
    // Remove tabindex if keyboard and key is open
    if (container.isKeyboard) {
      containerElement.tabIndex = isTablet && isKeyOpen ? -1 : 0
    }
  }
  tabletMediaQuery.addListener(tabletListener)
  tabletListener(tabletMediaQuery)

  // Map click
  map.on('click', (e) => {
    // Hide key
    if (isTablet && isKeyOpen) {
      closeKey()
    }
    // Close info panel
    if (isInfoOpen) {
      closeInfo()
    }
    // Touch interfaces
    containerElement.focus()
  })

  // Exit map click
  exitMapButton.element.addEventListener('click', (e) => {
    exitMap()
  })

  // Open key click
  openKeyButton.element.addEventListener('click', (e) => {
    openKey()
  })

  // Close key click
  closeKeyButton.addEventListener('click', (e) => {
    closeKey()
  })

  // Close info click
  closeInfoButton.addEventListener('click', (e) => {
    closeInfo()
  })

  // Disable pinch and double tap zoom
  infoElement.addEventListener('touchmove', (e) => {
    e.preventDefault()
  }, { passive: false })

  // Mouse or touch interaction
  containerElement.addEventListener('pointerdown', (e) => {
    container.isKeyboard = false
    infoElement.blur()
    keyElement.blur()
    containerElement.removeAttribute('tabindex') // Performance issue in Safari
  })

  // First tab press after mouse or touch interaction
  const keydown = (e) => {
    if (!container.isKeyboard) {
      // previously mouse or touch interaction
      container.isKeyboard = true
      // tabindex is added with appropriate value
      tabletListener(tabletMediaQuery)
      // reset focus to container on first tab press
      if (e.key === 'Tab' && (document.activeElement === document.body || document.activeElement === containerElement)) {
        e.preventDefault()
        containerElement.focus()
        containerElement.setAttribute('keyboard-focus', '')
      }
    }
  }
  window.addEventListener('keydown', keydown)

  // Constrain tab focus within dialog
  containerElement.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') {
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
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus()
        e.preventDefault()
      }
    }
  })

  // All keypress (keyup) events
  containerElement.addEventListener('keyup', (e) => {
    // Escape key behavior
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (isTooltipOpen) {
        hideTooltip()
      } else if (isInfoOpen) {
        closeInfo()
      } else if (isTablet && isKeyOpen) {
        closeKey()
      } else {
        exitMap()
      }
    }
    // Move tab ring between regions
    if (e.key === 'F6') {
      if (e.shiftKey) /* shift + F6 */ {
        console.log('Previous region')
      } else /* F6 */ {
        console.log('Next region')
      }
    }
  })

  // Remove map on popsate change
  const popstate = (e) => {
    removeContainer()
    window.removeEventListener('popstate', popstate)
  }
  window.addEventListener('popstate', popstate)
}
