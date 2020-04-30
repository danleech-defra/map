'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke } from 'ol/style'

window.flood.maps.styles = {
  // Primarily vector tiles
  nuts1: (feature) => {
    // Generate style
    return new Style({
      fill: new Fill({
        color: '#f3f2f1'
      }),
      stroke: new Stroke({
        color: '#f3f2f1',
        width: 0
      })
    })
  },

  // Primarily vector tiles
  targetAreaPolygons: (feature) => {
    // Use corresposnding warning feature propeties for styling
    const warningsSource = window.flood.maps.warningsSource
    const warning = warningsSource.getFeatureById(feature.getId())
    if (!warning || !warning.get('isVisible')) {
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
        strokeColour = isSelected ? '#FFDD00' : '#D4351C'
        fillColour = pattern('severe', isSelected)
        zIndex = 5
        break
      case 12: // Warning
        strokeColour = isSelected ? '#FFDD00' : '#D4351C'
        fillColour = pattern('warning', isSelected)
        zIndex = 4
        break
      case 13: // Alert
        strokeColour = isSelected ? '#FFDD00' : '#F47738'
        fillColour = pattern('alert', isSelected)
        zIndex = isGroundwater ? 1 : 2
        break
      case 14: // Removed
        strokeColour = isSelected ? '#FFDD00' : '#626A6E'
        fillColour = pattern('removed', isSelected)
        zIndex = 3
        break
    }

    // Generate style
    return new Style({
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
  },

  // Warning centroids
  warnings: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return
    }
    // Hide warning symbols when polygon is shown
    if (resolution < window.flood.maps.liveMapSymbolBreakpoint) {
      return
    }
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    let style
    switch (state) {
      case 11: // Severe warning
        style = isSelected ? styleCache.severeSelected : styleCache.severe
        break
      case 12: // Warning
        style = isSelected ? styleCache.warningSelected : styleCache.warning
        break
      case 13: // Alert
        style = isSelected ? styleCache.alertSelected : styleCache.alert
        break
      case 14: // Removed
        style = isSelected ? styleCache.targetAreaSelected : styleCache.targetArea
        break
    }
    return style
  },

  // Station centroids
  stations: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return
    }
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const isBigSymbol = resolution <= window.flood.maps.liveMapSymbolBreakpoint
    let style
    if (state === 21) {
      style = isSelected ? (isBigSymbol ? styleCache.levelHighBigSelected : styleCache.levelHighSelected) : (isBigSymbol ? styleCache.levelHighBig : styleCache.levelHigh)
    } else {
      style = isSelected ? (isBigSymbol ? styleCache.levelBigSelected : styleCache.levelSelected) : (isBigSymbol ? styleCache.levelBig : styleCache.level)
    }
    return style
  },

  // Impact centroids
  impacts: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return
    }
    const isSelected = feature.get('isSelected')
    return isSelected ? styleCache.impactSelected : styleCache.impact
  },

  // Rainfall centroids
  rainfall: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return
    }
    const isSelected = feature.get('isSelected')
    const isBigSymbol = resolution <= window.flood.maps.liveMapSymbolBreakpoint
    return isSelected ? (isBigSymbol ? styleCache.rainfallBigSelected : styleCache.rainfallSelected) : (isBigSymbol ? styleCache.rainfallBig : styleCache.rainfall)
  }
}

const pattern = (style, isSelected) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'severe':
      ctx.fillStyle = isSelected ? '#FFDD00' : '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'warning':
      ctx.fillStyle = isSelected ? '#FFDD00' : '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'alert':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = isSelected ? '#FFDD00' : '#F47738'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'removed':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = isSelected ? '#FFDD00' : '#626A6E'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

// More effecient to creat styles once
// Create unique styles
const createStyle = (options) => {
  const defaults = {
    size: [100, 100],
    anchor: [0.5, 0.5],
    offset: [0, 0],
    scale: 0.5,
    zIndex: 1
  }
  options = Object.assign({}, defaults, options)
  return new Style({
    image: new Icon({
      src: '/public/images/map-symbols-2x.png',
      size: options.size,
      anchor: options.anchor,
      offset: options.offset,
      scale: options.scale
    }),
    zIndex: options.zIndex
  })
}
// Style cache
const styleCache = {
  severe: createStyle({ offset: [0, 0], zIndex: 10 }),
  severeSelected: createStyle({ offset: [100, 0], zIndex: 10 }),
  warning: createStyle({ offset: [0, 100], zIndex: 9 }),
  warningSelected: createStyle({ offset: [100, 100], zIndex: 9 }),
  alert: createStyle({ offset: [0, 200], zIndex: 8 }),
  alertSelected: createStyle({ offset: [100, 200], zIndex: 8 }),
  targetArea: createStyle({ offset: [0, 300], zIndex: 7 }),
  targetAreaSelected: createStyle({ offset: [100, 300], zIndex: 7 }),
  impact: createStyle({ offset: [0, 400], zIndex: 6 }),
  impactSelected: createStyle({ offset: [100, 400], zIndex: 6 }),
  levelHighBig: createStyle({ offset: [0, 500], zIndex: 5 }),
  levelHighBigSelected: createStyle({ offset: [100, 500], zIndex: 5 }),
  levelBig: createStyle({ offset: [0, 600], zIndex: 4 }),
  levelBigSelected: createStyle({ offset: [100, 600], zIndex: 4 }),
  rainfallBig: createStyle({ offset: [0, 700], zIndex: 3 }),
  rainfallBigSelected: createStyle({ offset: [100, 700], zIndex: 3 }),
  levelHigh: createStyle({ offset: [0, 800], zIndex: 5 }),
  levelHighSelected: createStyle({ offset: [100, 800], zIndex: 5 }),
  level: createStyle({ offset: [0, 900], zIndex: 4 }),
  levelSelected: createStyle({ offset: [100, 900], zIndex: 4 }),
  rainfall: createStyle({ offset: [0, 1000], zIndex: 3 }),
  rainfallSelected: createStyle({ offset: [100, 1000], zIndex: 3 })
}
