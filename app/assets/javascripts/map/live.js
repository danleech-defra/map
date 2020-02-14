(function (window, flood) {
  const ol = window.ol
  const maps = flood.maps
  const addOrUpdateParameter = flood.utils.addOrUpdateParameter
  const getParameterByName = flood.utils.getParameterByName
  const forEach = flood.utils.forEach
  const MapContainer = maps.MapContainer

  function LiveMap (containerId, queryParams) {
    // View
    var view = new ol.View({
      zoom: 6,
      minZoom: 6,
      maxZoom: 18,
      center: maps.center,
      extent: maps.extent
    })

    // Layers
    var road = maps.layers.road()
    var satellite = maps.layers.satellite()
    var vectorTiles = maps.layers.vectorTiles()
    var warnings = maps.layers.warnings()
    var stations = maps.layers.stations()
    var rainfall = maps.layers.rainfall()
    var impacts = maps.layers.impacts()
    var selected = maps.layers.selected()

    var defaultLayers = [
      road,
      satellite,
      selected
    ]

    var dataLayers = [
      vectorTiles,
      rainfall,
      stations,
      warnings,
      impacts
    ]

    var layers = defaultLayers.concat(dataLayers)

    // Set selected feature id from querystring
    var selectedFeatureId = getParameterByName('sid') || ''

    // Interactions with reference to keyboardPan
    var interactions = ol.interaction.defaults()

    // MapContainer options
    var options = {
      maxBigZoom: 200,
      view: view,
      layers: layers,
      queryParams: queryParams,
      interactions: interactions,
      keyTemplate: 'key-live.html'
    }

    // Create MapContainer
    var container = new MapContainer(containerId, options)
    var map = container.map
    var mapElement = container.mapElement

    // Set layers, extent and key items from querystring
    if (getParameterByName('ext')) {
      setExtent()
    }
    if (getParameterByName('lyr')) {
      toggleLayerVisibility()
      setCheckboxes()
    }

    // Store visible features
    var visibleFeatures = []

    // Set map extent from querystring
    function setExtent (padding = [0, 0, 0, 0]) {
      var ext = getParameterByName('ext')
      var extent = ext.split(',').map(Number)
      extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
      map.getView().fit(extent, { constrainResolution: false, padding: padding })
    }

    // Show or hide layers
    function toggleLayerVisibility () {
      var lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      dataLayers.forEach(function (layer) {
        var isVisble = lyrs.some(lyr => layer.get('featureCodes').includes(lyr))
        layer.setVisible(isVisble)
      })
    }

    // Show or hide warning types
    function toggleWarningTypes () {
      var lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      warnings.getSource().forEachFeature(function (warning) {
        var state = warning.get('state')
        var isActive = (
          (state === 11 && lyrs.includes('ts')) ||
          (state === 12 && lyrs.includes('tw')) ||
          (state === 13 && lyrs.includes('ta')) ||
          (state === 14 && lyrs.includes('tr'))
        )
        var vectorTile = vectorTiles.getSource().getFeatureById(warning.getId())
        warning.set('isActive', isActive)
        if (vectorTile) {
          vectorTile.set('isActive', isActive)
        }
      })
    }

    // Set vector tile state from associated warning feature
    function setVectorTileStates () {
      vectorTiles.getSource().forEachFeature(function (feature) {
        var warning = warnings.getSource().getFeatureById(feature.getId())
        if (warning) {
          feature.set('state', warning.get('state'))
        }
      })
    }

    // Toggle features selected state
    function toggleFeatureSelected (id, state) {
      dataLayers.forEach(function (layer) {
        var feature = layer.getSource().getFeatureById(id)
        if (feature) {
          feature.set('isSelected', state)
        }
      })
    }

    // Add a feature to the selected layer
    function cloneFeature (id) {
      dataLayers.forEach(function (layer) {
        var feature = layer.getSource().getFeatureById(id)
        if (feature) {
          selected.getSource().addFeature(feature)
        }
      })
    }

    // Set selected feature
    function setSelectedFeature (id) {
      toggleFeatureSelected(selectedFeatureId, false)
      selected.getSource().clear()
      if (id) {
        selectedFeatureId = id
        toggleFeatureSelected(id, true)
        cloneFeature(id)
        container.showInfo(id)
      } else {
        selectedFeatureId = ''
        container.closeInfo()
      }
      // Update url
      replaceHistory('sid', selectedFeatureId)
    }

    // Set key checkboxes
    function setCheckboxes () {
      var lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      var checkboxes = document.querySelectorAll('.defra-map-key input[type=checkbox]')
      checkboxes.forEach(function (checkbox) {
        checkbox.checked = lyrs.includes(checkbox.id)
      })
    }

    // Toggle key symbols based on resolution
    function toggleKeySymbol (resolution) {
      forEach(mapElement.querySelectorAll('.defra-map-key *[data-style]'), function (symbol) {
        var style = symbol.getAttribute('data-style')
        var offsetStyle = symbol.getAttribute('data-style-offset')
        var isBigZoom = resolution <= options.maxBigZoom
        symbol.style = isBigZoom ? offsetStyle : style
      })
    }

    // Function update url and replace history state
    function replaceHistory (queryParam, value) {
      var data = { v: containerId, hasHistory: container.hasHistory }
      var url = addOrUpdateParameter(window.location.pathname + window.location.search, queryParam, value)
      var title = document.title
      window.history.replaceState(data, title, url)
    }

    // Get visible features
    function getVisibleFeatures () {
      visibleFeatures = []
      var featureCodes = { ts: [11], tw: [12], ta: [13], tr: [14], st: [21, 22, 23, 24], hi: [31], rf: [41] }
      var lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      var resolution = map.getView().getResolution()
      var extent = map.getView().calculateExtent(map.getSize())
      var isBigZoom = resolution <= options.maxBigZoom
      var layers = [rainfall, stations, impacts, isBigZoom ? vectorTiles : warnings]
      layers = layers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
      var activeStates = []
      lyrs.forEach(function (lyr) { activeStates = activeStates.concat(featureCodes[lyr]) })
      layers.forEach(function (layer) {
        // We know which layer and which feature states to count
        if (visibleFeatures.length > 9) return true
        layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
          if (activeStates.includes(feature.get('state'))) {
            visibleFeatures.push({
              id: feature.getId(),
              state: feature.get('state'),
              isBigZoom: isBigZoom,
              centre: ol.extent.getCenter(feature.getGeometry().getExtent())
            })
          }
        })
      })
    }

    // Show overlays
    function showOverlays () {
      visibleFeatures.forEach(function (feature, i) {
        var overlayElement = document.createTextNode(i + 1)
        map.addOverlay(
          new ol.Overlay({
            element: overlayElement,
            position: feature.centre,
            className: `defra-map-overlay defra-map-overlay--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''}`,
            offset: [0, 0]
          })
        )
      })
    }

    // Hide overlays
    function hideOverlays () {
      map.getOverlays().clear()
    }

    //
    // Events
    //

    // Set vector tile states from centroids and set selected feature
    dataLayers.forEach(function (layer) {
      var change = layer.getSource().on('change', function (e) {
        layer.set('isReady', false)
        if (this.getState() === 'ready') {
          layer.set('isReady', true)
          // Remove ready event when layer is ready
          ol.Observable.unByKey(change)
          // Vector tiles are ready to be styled
          if (vectorTiles.get('isReady') && warnings.get('isReady')) {
            setVectorTileStates()
          }
          // Warning types can be set
          if (['vectorTiles', 'warnings'].includes(layer.get('ref'))) {
            toggleWarningTypes()
          }
          // Attempt to set selected feature when layer is ready
          setSelectedFeature(selectedFeatureId)
        }
      })
    })

    // Pan or zoom map (fires on map load aswell)
    var t1 = null
    map.addEventListener('moveend', function (e) {
      var resolution = map.getView().getResolution()
      // Toggle key symbols depending on resolution
      toggleKeySymbol(resolution)
      // Update url (history state) to reflect new extent
      var extent = map.getView().calculateExtent(map.getSize())
      var ext = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
      ext = ext.map(function (x) { return Number(x.toFixed(6)) })
      ext = ext.join(',')
      // Has keyboard focus
      if (visibleFeatures.length) {
        hideOverlays()
        showOverlays(getVisibleFeatures())
      }
      // Timer used to stop 100 url replaces in 30 seconds limit
      clearTimeout(t1)
      t1 = setTimeout(function () {
        // Is map view
        if (getParameterByName('v')) {
          replaceHistory('ext', ext)
        }
      }, 350)
    })

    // Show cursor when hovering over features
    map.addEventListener('pointermove', function (e) {
      // Detect vector feature at mouse coords
      var hit = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        return true
      })
      map.getTarget().style.cursor = hit ? 'pointer' : ''
    })

    // Select feature if map is clicked
    map.addEventListener('click', function (e) {
      // Get mouse coordinates and check for feature
      var feature = map.forEachFeatureAtPixel(e.pixel, function (feature) { return feature })
      setSelectedFeature(feature ? feature.getId() : '')
    })

    // Toggle layers/features if key item changed
    var key = document.querySelector('.defra-map-key')
    key.addEventListener('change', function (e) {
      if (e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {
        var checkbox = e.target
        var lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
        checkbox.checked ? lyrs.push(checkbox.id) : lyrs.splice(lyrs.indexOf(checkbox.id), 1)
        lyrs = lyrs.join(',')
        replaceHistory('lyr', lyrs)
        toggleLayerVisibility()
        toggleWarningTypes()
        getVisibleFeatures()
      }
    })

    // Viewport focus
    document.getElementById('viewport').addEventListener('focus', function () {
      hideOverlays()
      showOverlays(getVisibleFeatures())
    })

    // Clear selectedfeature when info is closed
    container.closeInfoButton.addEventListener('click', function (e) {
      setSelectedFeature()
    })

    // Reinstate focus to viewport when info closed by pressing escape
    mapElement.addEventListener('keyup', function (e) {
      if (e.keyCode === 27 && selectedFeatureId !== '') {
        setSelectedFeature()
      }
    })

    // Listen for number keys
    mapElement.addEventListener('keyup', function (e) {
      var index = -1
      if ((e.keyCode - 48) >= 1 && (e.keyCode - 48) <= visibleFeatures.length) {
        index = e.keyCode - 49
      } else if ((e.keyCode - 96) >= 1 && (e.keyCode - 96) <= visibleFeatures.length) {
        index = e.keyCode - 97
      }
      if (index >= 0) {
        setSelectedFeature(visibleFeatures[index].id)
      }
    })

    // Hide overlays when any part of the map is clicked
    map.addEventListener('click', function (e) {
      hideOverlays()
    })

    // External properties
    this.container = container
    this.map = map
  }

  // Export a helper factory to create this map
  // onto the `maps` object.
  // (This is done mainly to avoid the rule
  // "do not use 'new' for side effects. (no-new)")
  maps.createLiveMap = function (containerId, queryParams = {}) {
    return new LiveMap(containerId, queryParams)
  }
})(window, window.flood)
