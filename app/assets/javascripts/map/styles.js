(function (window, maps) {
  var ol = window.ol
  var styles = {}

  // Used for hatch fills
  function pattern (style, isSelected) {
    // var pixelRatio = window.devicePixelRatio
    var canvas = document.createElement('canvas')
    var context = canvas.getContext('2d')
    switch (style) {
      case 'cross-hatch':
        canvas.width = 10
        canvas.height = 10
        isSelected ? context.fillStyle = '#B6000C' : context.fillStyle = '#E3000F'
        context.fillRect(0, 0, 10, 10)
        context.beginPath()
        context.lineCap = 'square'
        isSelected ? context.strokeStyle = '#C1666C' : context.strokeStyle = '#F17F87'
        context.lineWidth = 1
        context.moveTo(0, 0)
        context.lineTo(10, 10)
        context.stroke()
        context.moveTo(0, 10)
        context.lineTo(10, 0)
        context.stroke()
        break
      case 'vertical-hatch':
        canvas.width = 7
        canvas.height = 7
        isSelected ? context.fillStyle = '#C1666C' : context.fillStyle = '#F17F87'
        context.fillRect(0, 0, 7, 7)
        context.beginPath()
        context.lineCap = 'square'
        isSelected ? context.strokeStyle = '#B6000C' : context.strokeStyle = '#E3000F'
        context.lineWidth = 6
        context.moveTo(3, 0)
        context.lineTo(3, 10)
        context.stroke()
        break
      case 'diagonal-hatch':
        canvas.width = 10
        canvas.height = 10
        isSelected ? context.fillStyle = '#DEAF72' : context.fillStyle = '#F8C37F'
        context.fillRect(0, 0, 10, 10)
        context.beginPath()
        context.lineCap = 'square'
        isSelected ? context.strokeStyle = '#D87900' : context.strokeStyle = '#F18700'
        context.lineWidth = 6
        context.moveTo(0, 5)
        context.lineTo(5, 0)
        context.stroke()
        context.moveTo(5, 10)
        context.lineTo(10, 5)
        context.stroke()
        break
      case 'horizontal-hatch':
        canvas.width = 7
        canvas.height = 7
        isSelected ? context.fillStyle = '#929597' : context.fillStyle = '#B7BBBD'
        context.fillRect(0, 0, 7, 7)
        context.beginPath()
        context.lineCap = 'square'
        isSelected ? context.strokeStyle = '#595F62' : context.strokeStyle = '#6F777B'
        context.lineWidth = 6
        context.moveTo(0, 3)
        context.lineTo(10, 3)
        context.stroke()
        break
    }
    context.restore()
    return context.createPattern(canvas, 'repeat')
  }

  // Primarily vector tiles
  function polygons (feature, resolution) {
    if (!feature.get('isActive')) {
      return new ol.style.Style({})
    }
    var state = feature.get('state')
    var isSelected = feature.get('isSelected')

    // Defaults
    var strokeColour = 'transparent'
    var fillColour = 'transparent'
    var zIndex = 1
    var opacity = 1

    if (resolution <= 200) {
      switch (state) {
        case 11:
          strokeColour = isSelected ? '#b6000c' : '#e3000f'
          fillColour = pattern('cross-hatch', isSelected)
          zIndex = 5
          break
        case 12:
          strokeColour = isSelected ? '#b6000c' : '#e3000f'
          fillColour = pattern('vertical-hatch', isSelected)
          zIndex = 4
          break
        case 13:
          strokeColour = isSelected ? '#d87900' : '#f18700'
          fillColour = pattern('diagonal-hatch', isSelected)
          zIndex = 3
          break
        case 14:
          strokeColour = isSelected ? '#595f62' : '#6f777b'
          fillColour = pattern('horizontal-hatch', isSelected)
          zIndex = 2
          break
      }
    }

    // Generate style
    var style = new ol.style.Style({
      fill: new ol.style.Fill({
        color: fillColour
      }),
      stroke: new ol.style.Stroke({
        color: strokeColour,
        width: 1,
        miterLimit: 2,
        lineJoin: 'round',
        lineDash: [0, 0]
      }),
      opacity: opacity,
      zIndex: zIndex
    })

    return style
  }

  // All centroid features
  function points (feature, resolution) {
    if (feature.get('state') <= 20 && !feature.get('isActive')) {
      return new ol.style.Style({})
    }

    var state = feature.get('state')
    var isSelected = feature.get('isSelected')

    // Defaults
    var source = '/public/images/icon-map-features-2x.png'
    var anchor = [0.5, 0.75]
    var size = [86, 86]
    var scale = 0.5
    var offset = [0, 0]
    var zIndex = 1

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

    if (resolution > 200 && state > 20) { // Don't offset wanting symbols
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    if (isSelected) {
      offset[0] += 100
      zIndex = 10000
    }

    var style = new ol.style.Style({
      image: new ol.style.Icon({
        src: source,
        size: size,
        anchor: anchor,
        scale: scale,
        offset: offset
      }),
      zIndex: zIndex
    })

    // Hide warning symbols when polygon is shown
    if (resolution < 200 && state <= 20) {
      return new ol.style.Style({})
    }

    return style
  }

  // styles.polygons = polygons
  styles.points = points
  styles.polygons = polygons

  maps.styles = styles
})(window, window.flood.maps)
