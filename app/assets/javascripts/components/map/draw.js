'use strict'
import { Map, View, MapBrowserPointerEvent, Feature } from 'ol'
import { defaults as defaultControls, Control } from 'ol/control'
import { transform } from 'ol/proj'
import { Point, MultiPoint } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { defaults as defaultInteractions, Modify, Snap, Draw, DoubleClickZoom } from 'ol/interaction'
import { Style, Icon, Fill, Stroke } from 'ol/style'
import { mouseOnly } from 'ol/events/condition'

const { forEach } = window.flood.utils
const maps = window.flood.maps

function DrawMap (containerId, options) {
  const state = {
    drawStarted: false,
    modifyStarted: false,
    isOverideModifyCondition: false, // Temporarily overide modify condition
    modifyIndexes: [],
    modifyOffset: []
  }

  // View
  const view = new View({
    zoom: 8,
    minZoom: 6,
    maxZoom: 30,
    center: maps.center,
    extent: maps.extentLarge
  })

  // Controls
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    attribution: false
  })

  // Styles
  const keyboardStyle = new Style({
    image: new Icon({
      opacity: 1,
      size: [52, 52],
      scale: 1,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"%3E%3Cg%3E%3Cpath d="M6.201,0.544L0.544,6.201L16.101,16.101L6.201,0.544Z" style="fill:rgb(11,12,12);"/%3E%3Cpath d="M51.456,45.799L45.799,51.456L35.899,35.899L51.456,45.799Z" style="fill:rgb(11,12,12);"/%3E%3Cpath d="M0.544,45.799L6.201,51.456L16.101,35.899L0.544,45.799Z" style="fill:rgb(11,12,12);"/%3E%3Cpath d="M45.799,0.544L51.456,6.201L35.899,16.101L45.799,0.544Z" style="fill:rgb(11,12,12);"/%3E%3C/g%3E%3C/svg%3E'
    })
  })
  const drawShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#0b0c0c', width: 3 }),
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 1,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3C/svg%3E'
    }),
    zIndex: 2
  })
  const drawPointStyle = new Style({
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 1,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="4" style="fill:%230b0c0c"/%3E%3C/svg%3E'
    }),
    // Return the coordinates of the first ring of the polygon
    geometry: function (feature) {
      if (feature.getGeometry().getType() === 'Polygon') {
        let coordinates = feature.getGeometry().getCoordinates()[0]
        // We dont want a point for the vertex that havsn't been placed
        if (coordinates.length > 2) {
          coordinates.splice(coordinates.length - 2, 2)
        }
        return new MultiPoint(coordinates)
      } else {
        return null
      }
    },
    zIndex: 1
  })
  const pointStyle = (feature) => {
    console.log('pointStyle: ' + feature.get('type'))
    let icon = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="4" style="fill:%230b0c0c"/%3E%3C/svg%3E'
    if (feature.get('type') === 'point') {
      icon = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3Ccircle cx="16" cy="16" r="11" style="fill:none;stroke:rgb(255,221,0);stroke-width:6px;"/%3E%3C/svg%3E'
    }
    return new Style({
      image: new Icon({
        opacity: 1,
        size: [32, 32],
        scale: 1,
        src: icon
      })
    })
  }
  const modifyStyle = (feature) => {
    console.log('modifyStyle: ' + feature.get('type'))
    let icon = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="4" style="fill:%230b0c0c"/%3E%3C/svg%3E'
    if (feature.get('type') === 'point') {
      icon = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3Ccircle cx="16" cy="16" r="11" style="fill:none;stroke:rgb(255,221,0);stroke-width:6px;"/%3E%3C/svg%3E'
    }
    const image = new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 1,
      src: icon
    })
    return new Style({
      fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
      stroke: new Stroke({ color: '#0b0c0c', width: 3 }),
      image: image
    })
  }
  const completedShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#0b0c0c', width: 3 }),
  })
  const completedPointStyle = new Style({
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 1,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3C/svg%3E'
    }),
    // Return the coordinates of the first ring of the polygon
    geometry: function (feature) {
      if (feature.getGeometry().getType() === 'Polygon') {
        var coordinates = feature.getGeometry().getCoordinates()[0]
        return new MultiPoint(coordinates)
      } else {
        return null
      }
    }
  })

  // Polygon
  let polygon

  // Features
  const pointFeature = new Feature(new Point([0, 0]))

  // Source
  const vectorSource = new VectorSource()
  const pointSource = new VectorSource({
    features: [pointFeature]
  })
  const keyboardSource = new VectorSource({
    features: [new Feature(new Point([0, 0]))]
  })

  // Layers
  const road = maps.layers.road()
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: [completedShapeStyle, completedPointStyle],
    updateWhileInteracting: true
  })
  const pointLayer = new VectorLayer({
    source: pointSource,
    style: pointStyle,
    updateWhileInteracting: true,
    visible: false
  })
  const keyboardLayer = new VectorLayer({
    source: keyboardSource,
    style: keyboardStyle,
    updateWhileInteracting: true,
    visible: false
  })

  // Interactions
  const interactions = defaultInteractions({
    altShiftDragRotate: false,
    pinchRotate: false,
    doubleClickZoom: false,
    keyboardPan: true,
    keyboardZoom: true
  })
  const modifyInteraction = new Modify({
    source: vectorSource,
    style: modifyStyle,
    condition: () => {
      return state.isOverideModifyCondition || maps.interfaceType === 'mouse'
    },
    insertVertexCondition: mouseOnly
  })
  const drawInteraction = new Draw({
    source: vectorSource,
    type: 'Polygon',
    style: [drawShapeStyle, drawPointStyle],
    condition: mouseOnly
  })
  const snapInteraction = new Snap({
    source: vectorSource
  })
  const doubleClickZoomInteraction = new DoubleClickZoom()

  const containerElement = document.getElementById(containerId)
  containerElement.className = 'defra-draw-map'

  // Render map
  const map = new Map({
    target: containerElement,
    layers: [road, vectorLayer, pointLayer, keyboardLayer],
    view: view,
    controls: controls,
    interactions: interactions,
    keyboardEventTarget: document
  })

  // Viewport
  const viewport = document.querySelector('.ol-viewport')

  // Tool bar container
  const toolBar = document.getElementById('tool-bar')

  // Buttons container
  const buttons = document.getElementById('buttons')

  // Start drawing button
  const startDrawingButton = document.createElement('button')
  startDrawingButton.className = 'defra-map__start-drawing'
  startDrawingButton.appendChild(document.createTextNode('Start drawing'))
  const startDrawing = new Control({
    element: startDrawingButton,
    target: toolBar
  })
  map.addControl(startDrawing)

  // Delete drawing button
  const deleteDrawingButton = document.createElement('button')
  deleteDrawingButton.className = 'defra-map__start-drawing'
  deleteDrawingButton.appendChild(document.createTextNode('Delete drawing'))
  const deleteDrawing = new Control({
    element: deleteDrawingButton,
    target: toolBar
  })
  map.addControl(deleteDrawing)

  // Place node button
  const confirmPointButton = document.createElement('button')
  confirmPointButton.className = 'defra-map__confirm-point'
  confirmPointButton.appendChild(document.createTextNode('Confirm point'))
  const confirmPoint = new Control({
    element: confirmPointButton,
    target: buttons
  })
  map.addControl(confirmPoint)

  // Finish shape button
  const finishShapeButton = document.createElement('button')
  finishShapeButton.className = 'defra-map__finish-point'
  finishShapeButton.appendChild(document.createTextNode('Finish shape'))
  const finishShape = new Control({
    element: finishShapeButton,
    target: buttons
  })
  map.addControl(finishShape)

  //
  // Private methods
  //

  const updateSketchPoint = (coordinate) => {
    if (maps.interfaceType === 'touch' || maps.interfaceType === 'keyboard') {
      if (drawInteraction.sketchPoint_) {
        // Update the current sketchPoint
        drawInteraction.sketchPoint_.getGeometry().setCoordinates(coordinate)
      } else {
        // Create a new sketchPoint
        drawInteraction.sketchPoint_ = new Feature(new Point(coordinate))
        drawInteraction.overlay_.getSource().addFeature(drawInteraction.sketchPoint_)
      }
    }
  }

  const updateSketchFeatures = (coordinate) => {
    // Update the sketch feature by drawing a line to the coordinate
    const sketchFeature = drawInteraction.sketchFeature_ // Private method
    const sketchLine = drawInteraction.sketchLine_ // Private method
    let fCoordinates = sketchFeature.getGeometry().getCoordinates()[0]
    if (fCoordinates.length >= 3) {
      // Polygon: Update second to last coordinate
      fCoordinates[fCoordinates.length - 2][0] = coordinate[0]
      fCoordinates[fCoordinates.length - 2][1] = coordinate[1]
      // CLear sketch line
      sketchLine.getGeometry().setCoordinates([])
    } else {
      // Polygon: Insert coordinate before last
      fCoordinates.splice(1, 0, [coordinate[0], coordinate[1]])
    }
    sketchFeature.getGeometry().setCoordinates([fCoordinates])
  }

  const updateVectorFeature = () => {
    const feature = vectorSource.getFeatures()[0]
    let coordinates = feature.getGeometry().getCoordinates()[0]
    const centre = map.getView().getCenter()
    const coordinate = [centre[0] + state.modifyOffset[0], centre[1] + state.modifyOffset[1]]
    state.modifyIndexes.forEach((index) => { coordinates[index] = coordinate })
    feature.getGeometry().setCoordinates([coordinates])
    pointFeature.getGeometry().setCoordinates(coordinate)
  }

  const updateKeyboardCursor = (cooridnate) => {
    keyboardSource.getFeatures()[0].getGeometry().setCoordinates(cooridnate)
    keyboardLayer.setVisible(true)
  }

  //
  // Setup
  //

  map.getView().setCenter(transform(options.centre, 'EPSG:4326', 'EPSG:3857'))
  map.getView().setZoom(options.zoom || 6)

  // Show layers
  road.setVisible(true)

  // Interactions
  map.addInteraction(doubleClickZoomInteraction)

  //
  // Events
  //

  startDrawingButton.addEventListener('click', () => {
    // Reset state and source
    pointLayer.setVisible(false)
    map.addInteraction(drawInteraction)
    map.addInteraction(snapInteraction)
    map.removeInteraction(doubleClickZoomInteraction)
    const centre = map.getView().getCenter()
    updateSketchPoint(centre)
  })

  deleteDrawingButton.addEventListener('click', () => {
    // Reset state and source
    pointLayer.setVisible(false)
    map.removeInteraction(drawInteraction)
    map.removeInteraction(modifyInteraction)
    map.removeInteraction(snapInteraction)
    vectorSource.removeFeature(polygon)
  })

  drawInteraction.addEventListener('drawstart', (e) => {
    state.drawStarted = true
  })

  drawInteraction.addEventListener('drawend', (e) => {
    state.drawStarted = false
    polygon = e.feature
    map.removeInteraction(drawInteraction)
    setTimeout(() => {
      map.addInteraction(doubleClickZoomInteraction)
    }, 100)
    map.addInteraction(modifyInteraction)
    state.modifyStarted = true
  })

  vectorSource.addEventListener('addfeature', (e) => {
    // Generate output
  })

  confirmPointButton.addEventListener('click', () => {
    const centre = map.getView().getCenter()
    if (!state.drawStarted) {
      const pixel = map.getPixelFromCoordinate(centre)
      const pixelX = pixel[0] + viewport.getBoundingClientRect().left
      const pixelY = pixel[1] + viewport.getBoundingClientRect().top
      const mouseEvent = new window.MouseEvent('click', { view: window, clientX: pixelX, clientY: pixelY })
      const event = new MapBrowserPointerEvent('click', map, mouseEvent)
      drawInteraction.startDrawing_(event) // Private method
      state.drawStarted = true
      updateSketchPoint(centre)
    } else {
      drawInteraction.appendCoordinates([centre])
      updateSketchFeatures(centre)
    }
  })

  finishShapeButton.addEventListener('click', () => {
    // Reset state and source
    pointLayer.setVisible(false)
    drawInteraction.finishDrawing()
  })

  drawInteraction.addEventListener('drawabort', (e) => {
    // Reset state and source
    pointLayer.setVisible(false)
  })

  modifyInteraction.addEventListener('modifystart', () => {
  })

  modifyInteraction.addEventListener('modifyend', () => {
  })

  // Get vertex to modify and add a temporary current point to the point layer
  map.on('click', (e) => {
    // Reset state
    pointLayer.setVisible(false)
    state.modifyIndexes = []
    state.modifyOffset = []
    if (state.modifyStarted) {
      state.isOverideModifyCondition = true
      modifyInteraction.handleDownEvent(e)
      state.isOverideModifyCondition = false
      if (modifyInteraction.vertexFeature_) {
        const centre = map.getView().getCenter()
        const coordinate = modifyInteraction.vertexFeature_.getGeometry().getCoordinates()
        const feature = vectorSource.getFeatures()[0]
        const coordinates = feature.getGeometry().getCoordinates()[0]
        const index = coordinates.findIndex((item) => JSON.stringify(item) === JSON.stringify(coordinate))
        state.modifyIndexes = [index]
        // If first or last selected add both to indexes
        if (index === 0 || index === coordinates.length - 1) {
          state.modifyIndexes = [0, (coordinates.length - 1)]
        }
        // If we have an existing vertex update offset
        if (index >= 0) {
          state.modifyOffset = [coordinates[index][0] - centre[0], coordinates[index][1] - centre[1]]
        }
        // Set vertex type
        modifyInteraction.vertexFeature_.set('type', index >= 0 ? 'point' : 'line')
        pointFeature.set('type', index >= 0 ? 'point' : 'line')
        // Move temporary feature
        pointFeature.getGeometry().setCoordinates(coordinate)
        pointLayer.setVisible(true)
      }
    }
  })

  // Map pan and zoom
  const pointerMove = (e) => {
    // Show keyboard cursor
    keyboardLayer.setVisible(maps.interfaceType === 'keyboard' && state.modifyStarted)
    // Display appropriate modify icon
    if (maps.interfaceType === 'mouse') {
      if (state.modifyStarted) {
        // Move temporary feature
        if (modifyInteraction.vertexFeature_) {
          pointLayer.setVisible(false)
        }
      }
    } else if (maps.interfaceType === 'touch') {
      const centre = map.getView().getCenter()
      if (drawInteraction) {
        updateSketchPoint(centre)
      }
      if (state.drawStarted) {
        updateSketchFeatures(centre)
      }
      if (state.modifyStarted) {
        updateVectorFeature()
      }
    } else if (maps.interfaceType === 'keyboard') {
      if (state.modifyStarted) {
        pointLayer.setVisible(true)
        // Keyboard cursor
        const centre = map.getView().getCenter()
        updateKeyboardCursor(centre)
        // Select vertex
        const pixel = map.getPixelFromCoordinate(centre)
        const pixelX = pixel[0] + viewport.getBoundingClientRect().left
        const pixelY = pixel[1] + viewport.getBoundingClientRect().top
        const mouseEvent = new window.MouseEvent('click', { view: window, clientX: pixelX, clientY: pixelY })
        const event = new MapBrowserPointerEvent('click', map, mouseEvent)
        state.isOverideModifyCondition = true
        modifyInteraction.handleDownEvent(event)
        state.isOverideModifyCondition = false
      }
    }
    // All interface tpyes
    if (state.modifyStarted) {
      let coordinate
      if (modifyInteraction.vertexFeature_) {
        // Determin
        coordinate = modifyInteraction.vertexFeature_.getGeometry().getCoordinates()
        const coordinates = vectorSource.getFeatures()[0].getGeometry().getCoordinates()[0]
        const isPoint = coordinates.findIndex((item) => JSON.stringify(item) === JSON.stringify(coordinate)) >= 0
        modifyInteraction.vertexFeature_.set('type', isPoint ? 'point' : 'line')
        pointFeature.set('type', isPoint ? 'point' : 'line')
      }
    }
  }
  map.on('moveend', pointerMove)

  // Pointer move
  map.on('pointermove', pointerMove)

  // Keydown
  const keydown = (e) => {
    // Set sketchPoint to centre on any keydown
    let centre = map.getView().getCenter()
    if (drawInteraction) {
      updateSketchPoint(centre)
    }
    if (state.drawStarted) {
      updateSketchFeatures(centre)
    }
    if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const resolution = map.getView().getResolution()
      const distance = 10
      switch (e.key) {
        case 'ArrowLeft':
          centre = [centre[0] - distance * resolution, centre[1] + 0 * resolution]
          break
        case 'ArrowRight':
          centre = [centre[0] + distance * resolution, centre[1] + 0 * resolution]
          break
        case 'ArrowUp':
          centre = [centre[0] + 0 * resolution, centre[1] + distance * resolution]
          break
        case 'ArrowDown':
          centre = [centre[0] + 0 * resolution, centre[1] - distance * resolution]
          break
      }
      map.getView().setCenter(centre)
    }
  }
  window.addEventListener('keydown', keydown)

  // Keyup
  const keyup = (e) => {
    const centre = map.getView().getCenter()
    // Set sketchPoint to centre on any keyup
    if (drawInteraction) {
      updateSketchPoint(centre)
    }
    if (state.drawStarted) {
      updateSketchFeatures(centre)
    }
  }
  window.addEventListener('keyup', keyup)
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createDrawMap = (containerId, options = {}) => {
  // Detect keyboard interaction
  if (!maps.interfaceType) {
    window.addEventListener('pointerdown', (e) => {
      maps.interfaceType = 'mouse'
    })
    window.addEventListener('mousemove', (e) => {
      maps.interfaceType = 'mouse'
    })
    window.addEventListener('touchstart', (e) => {
      console.log('touchstart')
      maps.interfaceType = 'touch'
    })
    window.addEventListener('keydown', (e) => {
      maps.interfaceType = 'keyboard'
    })
    window.addEventListener('focusin', (e) => {
      if (maps.interfaceType === 'keyboard') {
        e.target.setAttribute('keyboard-focus', '')
      }
    })
    window.addEventListener('focusout', (e) => {
      forEach(document.querySelectorAll('[keyboard-focus]'), (element) => {
        element.removeAttribute('keyboard-focus')
      })
    })
  }
  return new DrawMap(containerId, options)
}
