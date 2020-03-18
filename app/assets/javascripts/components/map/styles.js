'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke } from 'ol/style'

window.flood.maps.styles = {
  // Primarily vector tiles
  targetAreaPolygons: (feature, resolution) => {
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
  // All centroid features
  points: (feature, resolution) => {
    if (feature.get('state') <= 20 && !feature.get('isActive')) {
      return new Style({})
    }

    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let anchor = [0.5, 0.75]
    let size = [86, 86]
    let scale = 0.5
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
      case 21: // High
        size = [66, 84]
        zIndex = 6
        offset = [0, 400]
        break
      case 22: // Normal
        size = [66, 84]
        zIndex = 5
        offset = [0, 200]
        break
      case 23: // No data
        size = [66, 84]
        zIndex = 4
        offset = [0, 100]
        break
      case 24: // Error
        size = [66, 84]
        zIndex = 3
        offset = [0, 0]
        break
      case 31: // Rain fall
        size = [66, 84]
        zIndex = 3
        offset = [0, 1500]
        break
      case 41: // Impact
        size = [74, 74]
        zIndex = 2
        offset = [0, 500]
        break
    }

    if (resolution > window.flood.maps.symbolThreshold && state > 20) { // Don't offset warning symbols
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    if (isSelected) {
      offset[0] += 100
      zIndex = 10000
    }

    const style = new Style({
      image: new Icon({
        src: source,
        size: size,
        anchor: anchor,
        scale: scale,
        offset: offset
      }),
      zIndex: zIndex
    })

    // Hide warning symbols when polygon is shown
    if (resolution < window.flood.maps.symbolThreshold && state <= 20) {
      return new Style({})
    }

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
