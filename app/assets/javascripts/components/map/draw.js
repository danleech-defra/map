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
  const drawShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#626a6e', width: 3 }),
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 0.5,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" style="fill:none;stroke:#626a6e;stroke-width:4px;"/%3E%3C/svg%3E'
    }),
    zIndex: 2
  })
  const drawPointStyle = new Style({
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 0.5,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" style="fill:none;stroke:#4c2c92;stroke-width:4px;"/%3E%3C/svg%3E'
    }),
    // Return the coordinates of the first ring of the polygon
    geometry: function (feature) {
      if (feature.getGeometry().getType() === 'Polygon') {
        var coordinates = feature.getGeometry().getCoordinates()[0]
        return new MultiPoint(coordinates)
      } else {
        return null
      }
    },
    zIndex: 1
  })
  const modifyShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#1d70b8', width: 3 }),
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 0.5,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" style="fill:none;stroke:#1d70b8;stroke-width:4px;"/%3E%3C/svg%3E'
    })
  })
  const completedShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#4c2c92', width: 3 })
  })
  const completedPointStyle = new Style({
    image: new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 0.5,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" style="fill:none;stroke:#4c2c92;stroke-width:4px;"/%3E%3C/svg%3E'
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

  // Source
  const vectorSource = new VectorSource()

  // Layers
  const road = maps.layers.road()
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: [completedShapeStyle, completedPointStyle],
    updateWhileInteracting: true
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
    style: modifyShapeStyle,
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
    layers: [road, vectorLayer],
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

  const modifyFeature = (event) => {
    const feature = vectorLayer.getSource().getFeatures()[0]
    const coordinates = feature.getGeometry().getCoordinates()[0]
    const centre = map.getView().getCenter()
    const coordinate = [centre[0] + state.modifyOffset[0], centre[1] + state.modifyOffset[1]]
    state.modifyIndexes.forEach((index) => { coordinates[index] = coordinate })
    feature.getGeometry().setCoordinates([coordinates])
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
    map.addInteraction(drawInteraction)
    map.addInteraction(snapInteraction)
    map.removeInteraction(doubleClickZoomInteraction)
    const centre = map.getView().getCenter()
    updateSketchPoint(centre)
  })

  deleteDrawingButton.addEventListener('click', () => {
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
    if (state.drawStarted) {
      drawInteraction.finishDrawing()
    }
  })

  drawInteraction.addEventListener('drawabort', (e) => {
  })

  modifyInteraction.addEventListener('modifystart', () => {
    console.log('modifystart')
  })

  modifyInteraction.addEventListener('modifyend', () => {
    console.log('modifyend')
    state.vertex = null
  })

  // Get vertex to modify
  map.on('click', (e) => {
    if (state.modifyStarted) {
      state.isOverideModifyCondition = true
      modifyInteraction.handleDownEvent(e)
      state.isOverideModifyCondition = false
      if (modifyInteraction.vertexFeature_) {
        const centre = map.getView().getCenter()
        const coordinate = modifyInteraction.vertexFeature_.getGeometry().getCoordinates()
        const feature = vectorLayer.getSource().getFeatures()[0]
        const coordinates = feature.getGeometry().getCoordinates()[0]
        const index = coordinates.findIndex((item) => JSON.stringify(item) === JSON.stringify(coordinate))
        state.modifyIndexes = [index]
        state.modifyOffset = [coordinates[index][0] - centre[0], coordinates[index][1] - centre[1]]
        if (index === 0) {
          state.modifyIndexes.push(coordinates.length - 1)
        } else if (index === coordinates.length - 1) {
          state.modifyIndexes.push(0)
        }
      } else {
        state.modifyIndexes = []
        state.modifyOffset = []
      }
      console.log(state.modifyIndexes)
    }
    /*
    if (state.isTouch) {
      e.preventDefault()
      state.isTouch = false
    }
    */
  })

  // Map pan and zoom
  const pointerMove = (e) => {
    if (maps.interfaceType === 'touch') {
      const centre = map.getView().getCenter()
      if (drawInteraction) {
        updateSketchPoint(centre)
      }
      if (state.drawStarted) {
        updateSketchFeatures(centre)
      }
      if (state.modifyStarted) {
        modifyFeature(e)
      }
    }
  }
  map.on('moveend', pointerMove)

  // Pointer move
  map.on('pointermove', pointerMove)

  // Keydown
  const keydown = (e) => {
    // Set sketchPoint to centre on any keydown
    const centre = map.getView().getCenter()
    if (drawInteraction) {
      updateSketchPoint(centre)
    }
    if (state.drawStarted) {
      updateSketchFeatures(centre)
    }
    if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const resolution = map.getView().getResolution()
      const distance = 10
      let centre = map.getView().getCenter()
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
    window.addEventListener('touchstart', (e) => {
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
