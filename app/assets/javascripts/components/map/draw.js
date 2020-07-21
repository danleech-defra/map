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
    isDraw: false,
    isModify: false,
    isEnableModifyCondition: false, // Temporarily overide modify condition
    vertexIndexes: [],
    vertexOffset: []
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
    const colour = feature.get('isSelected') ? 'rgb(255,221,0)' : 'rgb(177,180,182)'
    let icon = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="10" style="fill:${colour};"/%3E%3Ccircle cx="16" cy="16" r="4"/%3E%3C/svg%3E%0A`
    if (feature.get('type') === 'point') {
      icon = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3Ccircle cx="16" cy="16" r="11" style="fill:none;stroke:${colour};stroke-width:6px;"/%3E%3C/svg%3E`
    }
    return new Style({
      image: new Icon({
        opacity: 1,
        size: [32, 32],
        scale: 1,
        src: icon
      }),
      zIndex: 4
    })
  }
  const modifyStyle = (feature) => {
    const colour = feature.get('isSelected') ? 'rgb(255,221,0)' : 'rgb(177,180,182)'
    let icon = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="10" style="fill:${colour};"/%3E%3Ccircle cx="16" cy="16" r="4"/%3E%3C/svg%3E%0A`
    if (feature.get('type') === 'point') {
      icon = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3Ccircle cx="16" cy="16" r="11" style="fill:none;stroke:${colour};stroke-width:6px;"/%3E%3C/svg%3E`
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
      image: maps.interfaceType !== 'touch' ? image : null,
      zIndex: 3
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

  // The featur polygon
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
    updateWhileInteracting: true,
    zIndex: 1
  })
  const pointLayer = new VectorLayer({
    source: pointSource,
    style: pointStyle,
    updateWhileInteracting: true,
    visible: false,
    zIndex: 4
  })
  const keyboardLayer = new VectorLayer({
    source: keyboardSource,
    style: keyboardStyle,
    updateWhileInteracting: true,
    visible: false,
    zIndex: 5
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
      return state.isEnableModifyCondition
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
    // layers: [vectorLayer, pointLayer, keyboardLayer],
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
  startDrawingButton.className = 'govuk-button govuk-button--secondary'
  startDrawingButton.appendChild(document.createTextNode('Start drawing'))
  const startDrawing = new Control({
    element: startDrawingButton,
    target: toolBar
  })
  map.addControl(startDrawing)

  // Place node button
  const confirmPointButton = document.createElement('button')
  confirmPointButton.className = 'defra-map-button defra-map-button__confirm defra-map-button--hidden'
  confirmPointButton.appendChild(document.createTextNode('Confirm point'))
  const confirmPoint = new Control({
    element: confirmPointButton,
    target: buttons
  })
  map.addControl(confirmPoint)

  // Finish shape button
  const finishShapeButton = document.createElement('button')
  finishShapeButton.className = 'defra-map-button defra-map-button__finish defra-map-button--hidden'
  finishShapeButton.appendChild(document.createTextNode('Finish shape'))
  const finishShape = new Control({
    element: finishShapeButton,
    target: buttons
  })
  map.addControl(finishShape)

  // Delete drawing button
  const deleteDrawingButton = document.createElement('button')
  deleteDrawingButton.className = 'defra-map-button defra-map-button__confirm defra-map-button--hidden'
  deleteDrawingButton.appendChild(document.createTextNode('Delete drawing'))
  const deleteDrawing = new Control({
    element: deleteDrawingButton,
    target: buttons
  })
  map.addControl(deleteDrawing)

  // Add point button
  const addPointButton = document.createElement('button')
  addPointButton.className = 'defra-map-button defra-map-button__addPoint defra-map-button--hidden'
  addPointButton.appendChild(document.createTextNode('Add'))
  const addPoint = new Control({
    element: addPointButton,
    target: buttons
  })
  map.addControl(addPoint)

  // Delete point button
  const deletePointButton = document.createElement('button')
  deletePointButton.className = 'defra-map-button defra-map-button__deletePoint defra-map-button--hidden'
  deletePointButton.appendChild(document.createTextNode('Delete'))
  const deletePoint = new Control({
    element: deletePointButton,
    target: buttons
  })
  map.addControl(deletePoint)

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

  const setVertexType = (vertexFeature) => {
    if (!vertexFeature) {
      return
    }
    const coordinate = vertexFeature.getGeometry().getCoordinates()
    const polygonFeature = vectorSource.getFeatures()[0]
    const coordinates = polygonFeature.getGeometry().getCoordinates()[0]
    const index = coordinates.findIndex((item) => JSON.stringify(item) === JSON.stringify(coordinate))
    const type = index >= 0 ? 'point' : 'line'
    vertexFeature.set('type', type)
  }

  const updateSelectedIndexAndOffset = (vertexFeature) => {
    if (!vertexFeature) {
      state.vertexIndexes = []
      state.vertexOffset = []
      return
    }
    const centre = map.getView().getCenter()
    const coordinate = vertexFeature.getGeometry().getCoordinates()
    const polygonFeature = vectorSource.getFeatures()[0]
    const coordinates = polygonFeature.getGeometry().getCoordinates()[0]
    const index = coordinates.findIndex((item) => JSON.stringify(item) === JSON.stringify(coordinate))
    // If first or last selected add both to vertexIndexes
    if (index === 0 || index === coordinates.length - 1) {
      state.vertexIndexes = [0, (coordinates.length - 1)]
    } else {
      state.vertexIndexes = [index]
    }
    // If we have an existing vertex update vertexOffset
    if (index >= 0) {
      state.vertexOffset = [coordinates[index][0] - centre[0], coordinates[index][1] - centre[1]]
    }
  }

  const updatePolygon = () => {
    const centre = map.getView().getCenter()
    const polygonFeature = vectorSource.getFeatures()[0]
    let coordinates = polygonFeature.getGeometry().getCoordinates()[0]
    const newCoordinate = [centre[0] + state.vertexOffset[0], centre[1] + state.vertexOffset[1]]
    state.vertexIndexes.forEach((index) => { coordinates[index] = newCoordinate })
    polygonFeature.getGeometry().setCoordinates([coordinates])
    pointFeature.getGeometry().setCoordinates(newCoordinate)
  }

  const updateKeyboardCursor = (cooridnate) => {
    keyboardSource.getFeatures()[0].getGeometry().setCoordinates(cooridnate)
    keyboardLayer.setVisible(true)
  }

  const simulateClick = (coordinate) => {
    state.isEnableModifyCondition = true
    const pixel = map.getPixelFromCoordinate(coordinate)
    const pixelX = pixel[0] + viewport.getBoundingClientRect().left
    const pixelY = pixel[1] + viewport.getBoundingClientRect().top
    const mouseEvent = new window.MouseEvent('click', { view: window, clientX: pixelX, clientY: pixelY })
    const event = new MapBrowserPointerEvent('click', map, mouseEvent)
    modifyInteraction.handleDownEvent(event)
    state.isEnableModifyCondition = false
  }

  const toggleEditButtons = () => {
    const vertexFeature = modifyInteraction.vertexFeature_
    if (vertexFeature) {
      if (vertexFeature.get('type') === 'point') {
        addPointButton.classList.add('defra-map-button--hidden')
        if (maps.interfaceType === 'keyboard') {
          // enable move state
        }
        if (maps.interfaceType === 'keyboard' || maps.interfaceType === 'touch') {
          deletePointButton.classList.remove('defra-map-button--hidden')
        }
      } else {
        // disable move state
        deletePointButton.classList.add('defra-map-button--hidden')
        if (maps.interfaceType === 'keyboard' || maps.interfaceType === 'touch') {
          addPointButton.classList.remove('defra-map-button--hidden')
        }
      }
    } else {
      // disable move state
      deletePointButton.classList.add('defra-map-button--hidden')
      addPointButton.classList.add('defra-map-button--hidden')
      if (state.isMovePoint && maps.interfaceType === 'keyboard') {
        // enable
      }
    }
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
    const centre = map.getView().getCenter()
    map.addInteraction(drawInteraction)
    map.addInteraction(snapInteraction)
    map.removeInteraction(doubleClickZoomInteraction)
    updateSketchPoint(centre)
    if (maps.interfaceType === 'touch' || maps.interfaceType === 'keyboard') {
      confirmPointButton.classList.remove('defra-map-button--hidden')
    }
  })

  deleteDrawingButton.addEventListener('click', () => {
    // Reset state and source
    pointLayer.setVisible(false)
    map.removeInteraction(drawInteraction)
    map.removeInteraction(modifyInteraction)
    map.removeInteraction(snapInteraction)
    vectorSource.removeFeature(polygon)
    state.isDraw = false
    state.isModify = false
    state.vertexIndexes = []
    state.vertexOffset = []
    deleteDrawingButton.classList.add('defra-map-button--hidden')
    confirmPointButton.classList.add('defra-map-button--hidden')
    finishShapeButton.classList.add('defra-map-button--hidden')
    keyboardLayer.setVisible(false)
  })

  drawInteraction.addEventListener('drawstart', (e) => {
    state.isDraw = true
  })

  drawInteraction.addEventListener('drawend', (e) => {
    state.isDraw = false
    polygon = e.feature
    map.removeInteraction(drawInteraction)
    setTimeout(() => {
      map.addInteraction(doubleClickZoomInteraction)
    }, 100)
    map.addInteraction(modifyInteraction)
    modifyInteraction.overlay_.setZIndex(3) // Force zIndex for overlay layer
    state.isModify = true
    deleteDrawingButton.classList.remove('defra-map-button--hidden')
  })

  vectorSource.addEventListener('addfeature', (e) => {
    // Generate output
  })

  confirmPointButton.addEventListener('click', () => {
    const centre = map.getView().getCenter()
    if (!state.isDraw) {
      const pixel = map.getPixelFromCoordinate(centre)
      const pixelX = pixel[0] + viewport.getBoundingClientRect().left
      const pixelY = pixel[1] + viewport.getBoundingClientRect().top
      const mouseEvent = new window.MouseEvent('click', { view: window, clientX: pixelX, clientY: pixelY })
      const event = new MapBrowserPointerEvent('click', map, mouseEvent)
      drawInteraction.startDrawing_(event) // Private method
      state.isDraw = true
      updateSketchPoint(centre)
    } else {
      drawInteraction.appendCoordinates([centre])
      updateSketchFeatures(centre)
      // Enable finish shape button if sketfeature has minimum points
      if (maps.interfaceType === 'touch' || maps.interfaceType === 'keyboard') {
        const sketchFeature = drawInteraction.sketchFeature_ // Private method
        let fCoordinates = sketchFeature.getGeometry().getCoordinates()[0]
        if (fCoordinates.length >= 3) {
          finishShapeButton.classList.remove('defra-map-button--hidden')
        }
      }
    }
  })

  finishShapeButton.addEventListener('click', () => {
    drawInteraction.finishDrawing()
    // Reset
    pointLayer.setVisible(false)
    // Toggel button visibility
    deleteDrawingButton.classList.remove('defra-map-button--hidden')
    confirmPointButton.classList.add('defra-map-button--hidden')
    finishShapeButton.classList.add('defra-map-button--hidden')
  })

  drawInteraction.addEventListener('drawabort', (e) => {
    // Reset state and source
    pointLayer.setVisible(false)
  })

  modifyInteraction.addEventListener('modifystart', () => {
  })

  modifyInteraction.addEventListener('modifyend', () => {
    // Hide point layer if node has been deleted
    if (!modifyInteraction.vertexFeature_) {
      pointLayer.setVisible(false)
    }
  })

  // Get vertex to modify and add a temporary current point to the point layer
  map.on('click', (e) => {
    if (maps.interfaceType === 'touch' && state.isModify) {
      state.isEnableModifyCondition = true
      modifyInteraction.handleDownEvent(e)
      state.isEnableModifyCondition = false
      const vertexFeature = modifyInteraction.vertexFeature_
      updateSelectedIndexAndOffset(vertexFeature)
      if (vertexFeature) {
        setVertexType(vertexFeature)
        // Place point on top of vertex
        vertexFeature.set('isSelected', true)
        // Position and style point feature
        pointFeature.getGeometry().setCoordinates(vertexFeature.getGeometry().getCoordinates())
        pointFeature.set('type', vertexFeature.get('type'))
        pointFeature.set('isSelected', true)
        pointLayer.setVisible(true)
      } else {
        // Set selected state
        pointFeature.set('isSelected', false)
        pointLayer.setVisible(false)
      }
      // Show edit/add buttons depending on feature type and interface
      // toggleEditButtons()
    }
  })

  // Mouse pointer down
  const pointerDown = (e) => {
    if (maps.interfaceType === 'mouse' && state.isModify) {
      const vertexFeature = modifyInteraction.vertexFeature_
      if (vertexFeature) {
        setVertexType(vertexFeature)
        vertexFeature.set('isSelected', true)
        pointLayer.setVisible(false)
        state.isEnableModifyCondition = vertexFeature.get('isSelected') && vertexFeature.get('type') === 'point'
      } else {
        // Set selected state
        pointFeature.set('isSelected', false)
        pointLayer.setVisible(false)
        state.isEnableModifyCondition = false
      }
    }
  }
  map.on('pointerdown', pointerDown)

  // Map pan and zoom
  const pointerMove = (e) => {
    // Display appropriate modify icon
    if (maps.interfaceType === 'mouse') {
      keyboardLayer.setVisible(false)
      if (state.isModify) {
        const vertexFeature = modifyInteraction.vertexFeature_
        if (vertexFeature) {
          setVertexType(vertexFeature)
          vertexFeature.set('isSelected', vertexFeature.get('isSelected') && vertexFeature.get('type') === 'point')
        }
      }
    } else if (maps.interfaceType === 'touch') {
      keyboardLayer.setVisible(false)
      const centre = map.getView().getCenter()
      if (drawInteraction) {
        updateSketchPoint(centre)
      }
      if (state.isDraw) {
        updateSketchFeatures(centre)
      }
      if (state.isModify) {
        updatePolygon()
        pointLayer.setVisible(pointFeature.get('type') === 'point')
      }
    } else if (maps.interfaceType === 'keyboard') {
      const centre = map.getView().getCenter()
      if (drawInteraction) {
        updateSketchPoint(centre)
      }
      if (state.isDraw) {
        updateSketchFeatures(centre)
      }
      if (state.isModify) {
        // Keyboard cursor
        updateKeyboardCursor(centre)
        // Simulate click
        simulateClick(centre)
        // Show point layer
        const vertexFeature = modifyInteraction.vertexFeature_
        if (vertexFeature) {
          vertexFeature.set('isSelected', false)
          setVertexType(vertexFeature)
        }
        if (pointFeature.get('isSelected') && pointFeature.get('type') === 'point') {
          updatePolygon()
        }
        keyboardLayer.setVisible(!(pointFeature.get('isSelected') && pointFeature.get('type') === 'point'))
      }
    }
  }
  map.on('moveend', pointerMove)

  // Mouse pointer up
  const pointerUp = (e) => {
    if (maps.interfaceType === 'mouse' && state.isModify) {
      const vertexFeature = modifyInteraction.vertexFeature_
      if (vertexFeature) {
        pointFeature.getGeometry().setCoordinates(vertexFeature.getGeometry().getCoordinates())
        pointFeature.set('type', vertexFeature.get('type'))
        pointFeature.set('isSelected', true)
        pointLayer.setVisible(true)
      }
    }
  }
  map.on('pointerup', pointerUp)

  // Pointer move
  map.on('pointermove', pointerMove)

  // Keydown
  const keydown = (e) => {
    // Set sketchPoint to centre on any keydown
    if ((e.getModifierState('CapsLock') || e.shiftKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      let centre = map.getView().getCenter()
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
    if ((e.key === 'Enter' || e.key === ' ') && state.isModify) {
      const vertexFeature = modifyInteraction.vertexFeature_
      if (vertexFeature) {
        vertexFeature.set('isSelected', !vertexFeature.get('isSelected'))
        pointFeature.getGeometry().setCoordinates(vertexFeature.getGeometry().getCoordinates())
        // Toggle select if over a vertex
        pointFeature.set('type', vertexFeature.get('type'))
        pointFeature.set('isSelected', vertexFeature.get('isSelected'))
        pointLayer.setVisible(pointFeature.get('isSelected'))
        updateSelectedIndexAndOffset(vertexFeature)
        keyboardLayer.setVisible(!pointFeature.get('isSelected'))
      } else {
        // Deselect if alrerady selected
        pointFeature.set('isSelected', false)
        pointLayer.setVisible(false)
        keyboardLayer.setVisible(true)
      }
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
    window.addEventListener('touchmove', (e) => {
      maps.interfaceType = 'touch'
    })
    window.addEventListener('pointermove', (e) => {
      maps.interfaceType = 'mouse'
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
