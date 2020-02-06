(function (window, maps) {
  var ol = window.ol
  var layers = {}

  function road () {
    return new ol.layer.Tile({
      ref: 'road',
      /*
      source: new ol.source.BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'RoadOnDemand'
      }),
      */
      source: new ol.source.OSM(),
      visible: true,
      zIndex: 0
    })
  }

  function satellite () {
    return new ol.layer.Tile({
      ref: 'satellite',
      source: new ol.source.BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  }

  function vectorTiles () {
    return new ol.layer.Vector({
      ref: 'vectorTiles',
      featureCodes: 'ts, tw, ta, tr',
      maxResolution: 200,
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/vector-tiles.geojson'
      }),
      style: maps.styles.polygons,
      visible: false,
      zIndex: 1
    })
  }

  function rainfall () {
    return new ol.layer.Vector({
      ref: 'rainfall',
      featureCodes: 'rf',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/rainfall.geojson'
      }),
      style: maps.styles.points,
      visible: false,
      zIndex: 2
    })
  }

  function stations () {
    return new ol.layer.Vector({
      ref: 'stations',
      featureCodes: 'st',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
      }),
      style: maps.styles.points,
      visible: false,
      zIndex: 3
    })
  }

  function warnings () {
    return new ol.layer.Vector({
      ref: 'warnings',
      featureCodes: 'ts, tw, ta, tr',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/warnings.geojson'
      }),
      style: maps.styles.points,
      visible: false,
      zIndex: 4
    })
  }

  function impacts () {
    return new ol.layer.Vector({
      ref: 'impacts',
      featureCodes: 'hi',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/impacts.geojson'
      }),
      style: maps.styles.points,
      visible: false,
      zIndex: 5
    })
  }

  function selected () {
    return new ol.layer.Vector({
      ref: 'selected',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857'
      }),
      style: maps.styles.points,
      zIndex: 10
    })
  }

  layers.road = road
  layers.satellite = satellite
  layers.vectorTiles = vectorTiles
  layers.rainfall = rainfall
  layers.stations = stations
  layers.warnings = warnings
  layers.impacts = impacts
  layers.selected = selected

  maps.layers = layers
})(window, window.flood.maps)
