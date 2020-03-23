'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke } from 'ol/style'

window.flood.maps.styles = {
  // Primarily vector tiles
  nuts1: (feature) => {
    // Generate style
    const style = new Style({
      fill: new Fill({
        color: '#f3f2f1'
      }),
      stroke: new Stroke({
        color: '#f3f2f1',
        width: 0
      })
    })

    return style
  },

  // Primarily vector tiles
  targetAreaPolygons: (feature) => {
    // Use corresposnding warning feature propeties for styling
    const warningsSource = window.flood.maps.warningsSource
    const warning = warningsSource.getFeatureById(feature.getId())
    if (!warning || !warning.get('isActive')) {
      return new Style()
    }

    const state = warning.get('state')
    const isSelected = warning.get('isSelected')
    const isGroundwater = warning.getId().substring(6, 9) === 'FAG'

    // Defaults
    let strokeColour = 'transparent'
    let fillColour = 'transparent'
    let zIndex = 1

    switch (state) {
      case 11: // Severe warning
        strokeColour = isSelected ? '#b6000c' : '#e3000f'
        fillColour = pattern('cross-hatch', isSelected)
        zIndex = 5
        break
      case 12: // Warning
        strokeColour = isSelected ? '#b6000c' : '#e3000f'
        fillColour = pattern('vertical-hatch', isSelected)
        zIndex = 4
        break
      case 13: // Alert
        strokeColour = isSelected ? '#d87900' : isGroundwater ? '#F5A540' : '#F18700'
        fillColour = pattern('diagonal-hatch', isSelected, isGroundwater)
        zIndex = isGroundwater ? 2 : 3
        break
      case 14: // Removed
        strokeColour = isSelected ? '#595f62' : '#6f777b'
        fillColour = pattern('horizontal-hatch', isSelected)
        zIndex = 1
        break
    }

    // Generate style
    const style = new Style({
      fill: new Fill({
        color: fillColour
      }),
      stroke: new Stroke({
        color: strokeColour,
        width: 1,
        miterLimit: 2,
        lineJoin: 'round',
        lineDash: [0, 0]
      }),
      zIndex: zIndex
    })

    return style
  },

  // Warning centroids
  warnings: (feature, resolution) => {
    // If warning type is hidden in the key
    if (!feature.get('isActive')) {
      return new Style({})
    }
    // Hide warning symbols when polygon is shown
    if (resolution < window.flood.maps.symbolThreshold) {
      return new Style({})
    }

    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let offset = [0, 0]
    let zIndex = 1

    switch (state) {
      case 11: // Severe warning
        zIndex = 10
        offset = [0, 900]
        break
      case 12: // Warning
        zIndex = 9
        offset = [0, 1000]
        break
      case 13: // Alert
        zIndex = 8
        offset = [0, 1100]
        break
      case 14: // Removed
        zIndex = 7
        offset = [0, 1200]
        break
    }

    // Use selected symbol
    if (isSelected) {
      offset[0] += 100
    }

    const style = new Style({
      image: new Icon({
        src: source,
        size: [86, 86],
        anchor: [0.5, 0.75],
        scale: 0.5,
        offset: offset
      }),
      zIndex: zIndex
    })

    return style
  },

  // Station centroids
  stations: (feature, resolution) => {
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let anchor = [0.5, 0.75]
    let offset = [0, 0]
    let zIndex = 1

    switch (state) {
      case 21: // High
        zIndex = 6
        offset = [0, 400]
        break
      case 22: // Normal
        zIndex = 5
        offset = [0, 200]
        break
      case 24: // Error
        zIndex = 3
        offset = [0, 0]
        break
      default: // No data
        zIndex = 4
        offset = [0, 100]
    }

    // Use large symbols
    if (resolution > window.flood.maps.symbolThreshold) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    // Use selected symbol
    if (isSelected) {
      offset[0] += 100
    }

    const style = new Style({
      image: new Icon({
        src: source,
        size: [66, 84],
        anchor: anchor,
        scale: 0.5,
        offset: offset
      }),
      zIndex: zIndex
    })

    return style
  },

  // Impact centroids
  impacts: (feature, resolution) => {
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let anchor = [0.5, 0.75]
    let offset = [0, 500]

    // Use large symbols
    if (resolution > window.flood.maps.symbolThreshold) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    // Use selected symbol
    if (isSelected) {
      offset[0] += 100
    }

    const style = new Style({
      image: new Icon({
        src: source,
        size: [74, 74],
        anchor: anchor,
        scale: 0.5,
        offset: [0, 0]
      })
    })

    return style
  },

  // Rainfall centroids
  rainfall: (feature, resolution) => {
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let anchor = [0.5, 0.75]
    let offset = [0, 1500]

    // Use large symbols
    if (resolution > window.flood.maps.symbolThreshold) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    // Use selected symbol
    if (isSelected) {
      offset[0] += 100
    }

    const style = new Style({
      image: new Icon({
        src: source,
        size: [66, 84],
        anchor: anchor,
        scale: 0.5,
        offset: [0, 0]
      })
    })

    return style
  }
}

const pattern = (style, isSelected, isLighten = false) => {
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  switch (style) {
    case 'cross-hatch':
      canvas.width = 10 * dpr
      canvas.height = 10 * dpr
      context.scale(dpr, dpr)
      context.fillStyle = isSelected ? '#B6000C' : '#E3000F'
      context.fillRect(0, 0, 10, 10)
      context.beginPath()
      context.lineCap = 'square'
      context.strokeStyle = isSelected ? '#C1666C' : '#F17F87'
      context.lineWidth = 1
      context.moveTo(0, 0)
      context.lineTo(10, 10)
      context.stroke()
      context.moveTo(0, 10)
      context.lineTo(10, 0)
      context.stroke()
      break
    case 'vertical-hatch':
      canvas.width = 7 * dpr
      canvas.height = 7 * dpr
      context.scale(dpr, dpr)
      context.fillStyle = isSelected ? '#C1666C' : '#F17F87'
      context.fillRect(0, 0, 7, 7)
      context.beginPath()
      context.lineCap = 'square'
      context.strokeStyle = isSelected ? '#B6000C' : '#E3000F'
      context.lineWidth = 6
      context.moveTo(3, 0)
      context.lineTo(3, 10)
      context.stroke()
      break
    case 'diagonal-hatch':
      canvas.width = 10 * dpr
      canvas.height = 10 * dpr
      context.scale(dpr, dpr)
      context.fillStyle = isSelected ? '#DEAF72' : '#F8C37F'
      context.fillRect(0, 0, 10, 10)
      context.beginPath()
      context.lineCap = 'square'
      context.strokeStyle = isSelected ? '#D87900' : isLighten ? '#F5A540' : '#F18700' // 75% lighter
      context.lineWidth = 6
      context.moveTo(0, 5)
      context.lineTo(5, 0)
      context.stroke()
      context.moveTo(5, 10)
      context.lineTo(10, 5)
      context.stroke()
      break
    case 'horizontal-hatch':
      canvas.width = 7 * dpr
      canvas.height = 7 * dpr
      context.scale(dpr, dpr)
      context.fillStyle = isSelected ? '#929597' : '#B7BBBD'
      context.fillRect(0, 0, 7, 7)
      context.beginPath()
      context.lineCap = 'square'
      context.strokeStyle = isSelected ? '#595F62' : '#6F777B'
      context.lineWidth = 6
      context.moveTo(0, 3)
      context.lineTo(10, 3)
      context.stroke()
      break
  }
  context.restore()
  return context.createPattern(canvas, 'repeat')
}
