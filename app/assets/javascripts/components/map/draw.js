'use strict'
import 'elm-pep' // polyfill to add pointer events to older browsers such as iOS12
import { Map, View, MapBrowserEvent, Feature } from 'ol'
import { defaults as defaultControls, Control } from 'ol/control'
import { transform } from 'ol/proj'
import { Point, MultiPoint, LineString } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { defaults as defaultInteractions, Modify, Snap, Draw, DoubleClickZoom } from 'ol/interaction'
import { Style, Icon, Fill, Stroke } from 'ol/style'
import { mouseOnly } from 'ol/events/condition'

const { forEach } = window.flood.utils
const maps = window.flood.maps

function DrawMap (placeholderId, options) {
  // Create DOM elements
  const placeholder = document.getElementById(placeholderId)
  placeholder.className = 'defra-map-draw'
  const toolBarContainer = document.createElement('div')
  toolBarContainer.id = 'tool-bar'
  toolBarContainer.className = 'defra-map-draw__tool-bar'
  const mapContainer = document.createElement('div')
  mapContainer.id = 'map-container'
  mapContainer.className = 'defra-map-draw__container'
  mapContainer.setAttribute('role', 'application')
  const mapInnerContainer = document.createElement('div')
  mapInnerContainer.id = 'map-inner-container'
  mapInnerContainer.className = 'defra-map-draw__inner-container'
  mapInnerContainer.tabIndex = 0
  const buttons = document.createElement('div')
  buttons.className = 'defra-map-draw-buttons'
  const buttonsContainer = document.createElement('div')
  buttonsContainer.className = 'defra-map-draw-buttons__container'
  const buttonGroupEditPoint = document.createElement('div')
  buttonGroupEditPoint.className = 'defra-map-draw-buttons__group'
  const buttonGroupEditShape = document.createElement('div')
  buttonGroupEditShape.className = 'defra-map-draw-buttons__group'
  const buttonGroupReset = document.createElement('div')
  buttonGroupReset.className = 'defra-map-draw-buttons__group'
  placeholder.appendChild(toolBarContainer)
  mapContainer.appendChild(mapInnerContainer)
  buttonsContainer.appendChild(buttonGroupEditPoint)
  buttonsContainer.appendChild(buttonGroupEditShape)
  buttonsContainer.appendChild(buttonGroupReset)
  buttons.appendChild(buttonsContainer)
  mapContainer.appendChild(buttons)
  placeholder.appendChild(mapContainer)

  // State object
  const state = {
    isStarted: false,
    isDraw: false,
    isModify: false,
    isEnableModify: false, // Control modify condition
    isEnableDelete: false, // Control delete condition
    isEnableInsert: false, // Control insert condition
    isKeyboardButtonClick: false, // Manage duplicate between click and keyup events
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

  //
  // Styles
  //

  // Keyboard crosshair cursor
  const keyboardCursorStyle = new Style({
    image: new Icon({
      opacity: 1,
      size: [52, 52],
      scale: 1,
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"%3E%3Cg%3E%3Cpath d="M6.201,0.544L0.544,6.201L16.101,16.101L6.201,0.544Z" style="fill:rgb(11,12,12);"/%3E%3Cpath d="M51.456,45.799L45.799,51.456L35.899,35.899L51.456,45.799Z" style="fill:rgb(11,12,12);"/%3E%3Cpath d="M0.544,45.799L6.201,51.456L16.101,35.899L0.544,45.799Z" style="fill:rgb(11,12,12);"/%3E%3Cpath d="M45.799,0.544L51.456,6.201L35.899,16.101L45.799,0.544Z" style="fill:rgb(11,12,12);"/%3E%3C/g%3E%3C/svg%3E'
    })
  })

  // Styles for drawing a new shape
  const drawStyles = (feature) => {
    const styles = []
    const coordinates = feature.getGeometry().getCoordinates()
    const image = {
      small: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="4" style="fill:%230b0c0c"/%3E%3C/svg%3E',
      large: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3C/svg%3E'
    }
    const src = feature.getGeometry().getType() === 'Point' ? image.large : image.small
    styles.push(new Style({
      // Return the coordinates of the first ring of the polygon
      geometry: (feature) => {
        if (feature.getGeometry().getType() === 'Polygon') {
          let coordinates = feature.getGeometry().getCoordinates()[0]
          // We dont want a point for the vertex that havsn't been placed
          if (coordinates.length > 2) {
            coordinates.splice(coordinates.length - 2, 2)
          }
          return new MultiPoint(coordinates)
        } else if (feature.getGeometry().getType() === 'Point') {
          return feature.getGeometry()
        }
      },
      image: new Icon({
        opacity: 1,
        size: [32, 32],
        scale: 1,
        src: src
      }),
      zIndex: 1
    }))
    styles.push(new Style({
      // Return the coordinates of the first ring of the polygon
      geometry: (feature) => {
        if (feature.getGeometry().getType() === 'Polygon') {
          let coordinates = feature.getGeometry().getCoordinates()[0]
          // We dont want a point for the vertex that havsn't been placed
          if (coordinates.length > 2) {
            coordinates.splice(coordinates.length - 2, 2)
          }
          return new MultiPoint(coordinates)
        } else if (feature.getGeometry().getType() === 'Point') {
          return feature.getGeometry()
        }
      },
      image: new Icon({
        opacity: 1,
        size: [32, 32],
        scale: 1,
        src: src
      }),
      zIndex: 2
    }))
    if (feature.getGeometry().getType() === 'LineString') {
      styles.push(new Style({
        geometry: new LineString(coordinates.slice(-2)),
        // fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
        stroke: new Stroke({ color: '#b1b4b6', width: 3, lineCap: 'butt', lineDash: [3, 2] }),
        zIndex: 2
      }))
      if (coordinates.length > 2) {
        styles.push(new Style({
          geometry: new LineString(coordinates.slice(0, -1)),
          // fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
          stroke: new Stroke({ color: '#0b0c0c', width: 3 }),
          zIndex: 2
        }))
      }
    }
    return styles
  }

  // Style for overlayig a point
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

  // Styles feature when in edit mode
  const editShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#0b0c0c', width: 3 })
  })
  const editPointStyle = new Style({
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

  // Style for modifying a point
  const modifyStyle = (feature) => {
    const type = feature.get('type')
    const colour = feature.get('isSelected') ? 'rgb(255,221,0)' : 'rgb(177,180,182)'
    let icon = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="10" style="fill:${colour};"/%3E%3Ccircle cx="16" cy="16" r="4"/%3E%3C/svg%3E%0A`
    if (type === 'point') {
      icon = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="7" style="fill:white;fill-opacity:0.01;stroke:black;stroke-width:2px;"/%3E%3Ccircle cx="16" cy="16" r="11" style="fill:none;stroke:${colour};stroke-width:6px;"/%3E%3C/svg%3E`
    }
    const image = new Icon({
      opacity: 1,
      size: [32, 32],
      scale: 1,
      src: icon
    })
    const options = type !== '' ? {
      // fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
      // stroke: new Stroke({ color: '#0b0c0c', width: 3 }),
      image: maps.interfaceType !== 'touch' ? image : null,
      zIndex: 3
    } : {}
    return new Style(options)
  }

  // Style shape preview
  const doneShapeStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({ color: '#0b0c0c', width: 3 })
  })

  // The feature polygon
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
    style: [doneShapeStyle],
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
    style: keyboardCursorStyle,
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
    condition: () => { return state.isEnableModify },
    deleteCondition: () => { return state.isEnableDelete },
    insertVertexCondition: () => { return state.isEnableInsert }
  })
  const drawInteraction = new Draw({
    source: vectorSource,
    type: 'Polygon',
    style: drawStyles,
    condition: mouseOnly
  })
  const snapInteraction = new Snap({
    source: vectorSource
  })
  const doubleClickZoomInteraction = new DoubleClickZoom()

  // Render map
  const map = new Map({
    target: mapInnerContainer,
    layers: [road, vectorLayer, pointLayer, keyboardLayer],
    view: view,
    controls: controls,
    interactions: interactions,
    keyboardEventTarget: document
  })

  // Viewport
  const viewport = document.querySelector('.ol-viewport')
  viewport.classList.add('defra-map-draw__viewport')

  // Tool bar container
  const toolBar = document.getElementById('tool-bar')

  // Start drawing button
  const startDrawingButton = document.createElement('button')
  startDrawingButton.id = 'start-drawing'
  startDrawingButton.className = 'defra-map-draw__button-start'
  startDrawingButton.appendChild(document.createTextNode('Start drawing'))
  const startDrawing = new Control({
    element: startDrawingButton,
    target: toolBar
  })
  map.addControl(startDrawing)

  // Insert point button
  const newPointButton = document.createElement('button')
  newPointButton.className = 'defra-map-draw__button defra-map-draw__button--new'
  newPointButton.setAttribute('disabled', 'disabled')
  newPointButton.appendChild(document.createTextNode('Insert'))
  newPointButton.setAttribute('data-mode', 'insert')
  const newPoint = new Control({
    element: newPointButton,
    target: buttonGroupEditPoint
  })
  map.addControl(newPoint)

  // Add point button
  const deletePointButton = document.createElement('button')
  deletePointButton.className = 'defra-map-draw__button defra-map-draw__button--delete'
  deletePointButton.setAttribute('disabled', 'disabled')
  deletePointButton.appendChild(document.createTextNode('Remove'))
  const deletePoint = new Control({
    element: deletePointButton,
    target: buttonGroupEditPoint
  })
  map.addControl(deletePoint)

  // Finish shape button
  const editShapeButton = document.createElement('button')
  editShapeButton.className = 'defra-map-draw__button defra-map-draw__button--edit'
  editShapeButton.setAttribute('disabled', 'disabled')
  editShapeButton.appendChild(document.createTextNode('Edit'))
  const editShape = new Control({
    element: editShapeButton,
    target: buttonGroupEditShape
  })
  map.addControl(editShape)

  // Finish shape button
  const doneShapeButton = document.createElement('button')
  doneShapeButton.className = 'defra-map-draw__button defra-map-draw__button--done'
  doneShapeButton.setAttribute('disabled', 'disabled')
  doneShapeButton.appendChild(document.createTextNode('Done'))
  const doneShape = new Control({
    element: doneShapeButton,
    target: buttonGroupEditShape
  })
  map.addControl(doneShape)

  // Reset and start again
  const resetDrawingButton = document.createElement('button')
  resetDrawingButton.className = 'defra-map-draw__button defra-map-draw__button--reset'
  resetDrawingButton.setAttribute('disabled', 'disabled')
  resetDrawingButton.appendChild(document.createTextNode('Clear all'))
  const resetDrawing = new Control({
    element: resetDrawingButton,
    target: buttonGroupReset
  })
  map.addControl(resetDrawing)

  // Continue button
  const doneButton = document.createElement('button')
  doneButton.className = 'defra-map-draw__button-done'
  doneButton.setAttribute('disabled', 'disabled')
  doneButton.appendChild(document.createTextNode('Save and continue'))
  const done = new Control({
    element: doneButton,
    target: placeholder
  })
  map.addControl(done)

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
    if (!vertexFeature) { return }
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
    const pixel = map.getPixelFromCoordinate(coordinate)
    const pixelX = Math.round(pixel[0] + viewport.getBoundingClientRect().left)
    const pixelY = Math.round(pixel[1] + viewport.getBoundingClientRect().top)
    const mouseEvent = new window.MouseEvent('click', { view: window, clientX: pixelX, clientY: pixelY, bubbles: true })
    const event = new MapBrowserEvent('click', map, mouseEvent)
    return event
  }

  const toggleEditButtons = (vertexFeature) => {
    const isDelete = vertexFeature && vertexFeature.get('type') === 'point' && vertexFeature.get('isSelected')
    const isInsert = vertexFeature && vertexFeature.get('type') !== 'point' && vertexFeature.get('isSelected')
    deletePointButton.disabled = !isDelete
    newPointButton.disabled = !isInsert
  }

  const enableModifyPolygon = () => {
    map.addInteraction(modifyInteraction)
    modifyInteraction.overlay_.setZIndex(3) // Force zIndex for overlay layer
    state.isModify = true
  }

  const addPoint = () => {
    const centre = map.getView().getCenter()
    mapInnerContainer.focus()
    if (!state.isDraw) {
      drawInteraction.startDrawing_(simulateClick(centre)) // Private method
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
          doneShapeButton.removeAttribute('disabled')
        }
      }
    }
  }

  const insertPoint = () => {
    const coordinate = pointFeature.getGeometry().getCoordinates()
    state.isEnableModify = true
    state.isEnableInsert = true
    modifyInteraction.handleDownEvent(simulateClick(coordinate))
    const vertexFeature = modifyInteraction.vertexFeature_
    updateSelectedIndexAndOffset(vertexFeature)
    vertexFeature.set('type', 'point')
    vertexFeature.set('isSelected', true)
    pointFeature.set('type', 'point')
    pointFeature.set('isSelected', true)
    toggleEditButtons(vertexFeature)
    state.isEnableModify = false
    state.isEnableInsert = false
    state.isKeyboardButtonClick = (maps.interfaceType === 'keyboard')
    mapInnerContainer.focus()
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

  drawInteraction.addEventListener('drawstart', (e) => {
    state.isStarted = true
    state.isDraw = true
  })

  drawInteraction.addEventListener('drawend', (e) => {
    state.isDraw = false
    polygon = e.feature
    map.removeInteraction(drawInteraction)
    setTimeout(() => {
      map.addInteraction(doubleClickZoomInteraction)
    }, 100)
    doneShapeButton.disabled = false
    resetDrawingButton.disabled = false
    doneButton.disabled = false
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

  vectorSource.addEventListener('addfeature', (e) => {
    // Generate output
  })

  startDrawingButton.addEventListener('click', () => {
    // Reset state and source
    const centre = map.getView().getCenter()
    map.addInteraction(drawInteraction)
    map.addInteraction(snapInteraction)
    map.removeInteraction(doubleClickZoomInteraction)
    vectorLayer.setStyle([editShapeStyle, editPointStyle])
    updateSketchPoint(centre)
    startDrawingButton.disabled = true
    newPointButton.setAttribute('data-mode', maps.interfaceType === 'mouse' ? 'insert' : 'add')
    newPointButton.disabled = maps.interfaceType === 'mouse'
    mapInnerContainer.focus()
  })

  doneShapeButton.addEventListener('click', (e) => {
    drawInteraction.finishDrawing()
    map.removeInteraction(modifyInteraction)
    map.removeInteraction(snapInteraction)
    state.isDraw = false
    state.isModify = false
    state.isStarted = false
    // Reset
    pointLayer.setVisible(false)
    keyboardLayer.setVisible(false)
    // Toggle button visibility
    doneShapeButton.disabled = true
    editShapeButton.disabled = false
    newPointButton.disabled = true
    deletePointButton.disabled = true
    resetDrawingButton.disabled = true
    vectorLayer.setStyle(doneShapeStyle)
    mapInnerContainer.focus()
  })

  editShapeButton.addEventListener('click', (e) => {
    state.isStarted = true
    enableModifyPolygon()
    editShapeButton.disabled = true
    doneShapeButton.disabled = false
    resetDrawingButton.disabled = false
    newPointButton.setAttribute('data-mode', 'insert')
    keyboardLayer.setVisible(maps.interfaceType === 'keyboard')
    vectorLayer.setStyle([editShapeStyle, editPointStyle])
    mapInnerContainer.focus()
  })

  newPointButton.addEventListener('click', (e) => {
    newPointButton.getAttribute('data-mode') === 'insert' ? insertPoint() : addPoint()
  })

  deletePointButton.addEventListener('click', (e) => {
    modifyInteraction.removePoint()
    // Reset current vertext
    state.vertexIndexes = []
    state.vertexOffset = []
    mapInnerContainer.focus()
    deletePointButton.disabled = true
    deletePointButton.blur()
  })

  resetDrawingButton.addEventListener('click', () => {
    // Reset state and source
    pointLayer.setVisible(false)
    map.removeInteraction(drawInteraction)
    map.removeInteraction(modifyInteraction)
    map.removeInteraction(snapInteraction)
    vectorSource.removeFeature(polygon)
    state.isStarted = false
    state.isDraw = false
    state.isModify = false
    state.vertexIndexes = []
    state.vertexOffset = []
    doneShapeButton.disabled = true
    editShapeButton.disabled = true
    // addPointButton.disabled = true
    newPointButton.disabled = true
    deletePointButton.disabled = true
    resetDrawingButton.disabled = true
    doneButton.disabled = true
    keyboardLayer.setVisible(false)
    startDrawingButton.removeAttribute('disabled')
    startDrawingButton.focus()
  })

  // Get vertex to modify and add a temporary point to the point layer
  map.on('click', (e) => {
    if (state.isModify) {
      state.isEnableModify = true
      modifyInteraction.handleDownEvent(e)
      const vertexFeature = modifyInteraction.vertexFeature_
      state.isEnableModify = false
      updateSelectedIndexAndOffset(vertexFeature)
      if (vertexFeature) {
        setVertexType(vertexFeature)
        // Place point on top of vertex
        vertexFeature.set('isSelected', maps.interfaceType === 'keyboard' ? !vertexFeature.get('isSelected') : true)
        // Position and style point feature
        pointFeature.getGeometry().setCoordinates(vertexFeature.getGeometry().getCoordinates())
        pointFeature.set('type', vertexFeature.get('type'))
        pointFeature.set('isSelected', vertexFeature.get('isSelected'))
        pointLayer.setVisible(pointFeature.get('isSelected'))
        keyboardLayer.setVisible(maps.interfaceType === 'keyboard' ? !pointFeature.get('isSelected') : false)
      } else {
        // Set selected state
        pointFeature.set('isSelected', false)
        pointLayer.setVisible(false)
        keyboardLayer.setVisible(!!maps.interfaceType === 'keyboard')
      }
      // Show edit point button
      toggleEditButtons(vertexFeature)
    } else if (maps.interfaceType !== 'keyboard' && state.isStarted && !state.isDraw) {
      enableModifyPolygon()
    }
  })

  // Set vertex display type on pointerdown
  const pointerDown = (e) => {
    if (state.isModify && e.target === map) {
      const vertexFeature = modifyInteraction.vertexFeature_
      if (vertexFeature) {
        setVertexType(vertexFeature)
        if (vertexFeature.get('type') === 'point') {
          vertexFeature.set('isSelected', true)
          pointLayer.setVisible(false)
          state.isEnableModify = true
        }
      }
    }
  }
  map.on('pointerdown', pointerDown)

  // Clear line vertexes display on pointerdrag
  const pointerDrag = (e) => {
    if (state.isModify) {
      const vertexFeature = modifyInteraction.vertexFeature_
      if (vertexFeature && vertexFeature.get('type') === 'line') {
        vertexFeature.set('type', '')
      }
    }
  }
  map.on('pointerdrag', pointerDrag)

  // Map pan and zoom (all interfaces)
  const pointerMove = (e) => {
    if (maps.interfaceType === 'mouse') {
      // if (!state.isEnableModify) {
      //   map.addInteraction(modifyInteraction)
      //   state.isEnableModify = true
      // }
      if (state.isModify) {
        const vertexFeature = modifyInteraction.vertexFeature_
        if (vertexFeature) {
          setVertexType(vertexFeature)
          vertexFeature.set('isSelected', vertexFeature.get('isSelected') && vertexFeature.get('type') === 'point')
        }
      }
      keyboardLayer.setVisible(false)
    } else if (maps.interfaceType === 'touch') {
      if (!state.isEnableModify) {
        map.addInteraction(modifyInteraction)
        state.isEnableModify = true
      }
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
      pointLayer.setVisible(false)
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
        const vertexFeature = modifyInteraction.vertexFeature_
        const isMovePoint = pointFeature.get('isSelected') && pointFeature.get('type') === 'point'
        keyboardLayer.setVisible(!isMovePoint)
        if (isMovePoint) {
          pointLayer.setVisible(true)
          state.isEnableModify = false
          map.removeInteraction(modifyInteraction)
          updatePolygon()
        } else {
          state.isEnableModify = true
          map.addInteraction(modifyInteraction)
          modifyInteraction.handleDownEvent(simulateClick(centre))
          state.isEnableModify = false
          if (vertexFeature) {
            vertexFeature.set('isSelected', false)
            setVertexType(vertexFeature)
          }
        }
        toggleEditButtons(vertexFeature)
      }
    }
  }
  map.on('moveend', pointerMove)
  map.on('pointermove', pointerMove)

  // Centre map on cursors keys keydown
  const keydown = (e) => {
    if (e.target === mapInnerContainer) {
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
  }
  window.addEventListener('keydown', keydown)

  // Dispatch click event on map
  const keyup = (e) => {
    if (!state.isKeyboardButtonClick && e.target === mapInnerContainer && (e.key === 'Enter' || e.key === ' ')) {
      const centre = map.getView().getCenter()
      map.dispatchEvent(simulateClick(centre))
    }
    state.isKeyboardButtonClick = false
  }
  window.addEventListener('keyup', keyup)
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createDrawMap = (placeholderId, options = {}) => {
  // Detect interface type
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
    maps.eventKey = e.key
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
  return new DrawMap(placeholderId, options)
}
