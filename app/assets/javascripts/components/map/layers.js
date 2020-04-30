'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer, Stamen } from 'ol/layer'
import { OSM, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source'
import { GeoJSON, MVT } from 'ol/format'

window.flood.maps.layers = {

  road: () => {
    return new TileLayer({
      ref: 'road',
      source: new OSM(),
      visible: true,
      zIndex: 0
    })
  },

  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      visible: false,
      zIndex: 0
    })
  },

  /*
  nuts1: () => {
    return new VectorTileLayer({
      ref: 'nuts1',
      source: new VectorTileSource({
        format: new MVT({
          idProperty: 'id'
        }),
        url: 'http://localhost:8080/geoserver/gwc/service/wmts?request=GetTile&service=wmts&version=1.0.0&layer=flood:nuts1&tilematrix=EPSG:900913:{z}&tilematrixset=EPSG:900913&format=application/vnd.mapbox-vector-tile&tilecol={x}&tilerow={y}'
      }),
      renderMode: 'hybrid',
      extent: window.flood.maps.extent,
      style: window.flood.maps.styles.nuts1,
      zIndex: 1
    })
  },
  */

  /*
  targetAreaPolygons: () => {
    return new VectorTileLayer({
      ref: 'targetAreaPolygons',
      source: new VectorTileSource({
        format: new MVT({
          idProperty: 'id'
        }),
        url: 'http://localhost:8080/geoserver/gwc/service/wmts?request=GetTile&service=wmts&version=1.0.0&layer=flood:target_area&tilematrix=EPSG:900913:{z}&tilematrixset=EPSG:900913&format=application/vnd.mapbox-vector-tile&tilecol={x}&tilerow={y}'
      }),
      renderMode: 'hybrid',
      extent: window.flood.maps.extent,
      style: window.flood.maps.styles.targetAreaPolygons,
      maxResolution: window.flood.maps.liveMapSymbolBreakpoint,
      zIndex: 1
    })
  },
  */

  targetAreaPolygons: () => {
    return new VectorLayer({
      ref: 'targetAreaPolygons',
      source: new VectorSource({
        format: new GeoJSON({
          'dataProjection': 'EPSG::3857',
          'featureProjection': 'EPSG::4326'
        }),
        url: '/api/target-area-polygons.geojson'
      }),
      style: window.flood.maps.styles.targetAreaPolygons,
      maxResolution: window.flood.maps.liveMapSymbolBreakpoint,
      zIndex: 1
    })
  },

  warnings: () => {
    return new VectorLayer({
      ref: 'warnings',
      featureCodes: 'ts, tw, ta, tr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/warnings.geojson'
        // url: 'http://localhost:8080/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=flood:ta&srsName=EPSG:3857&outputFormat=application/json'
      }),
      style: window.flood.maps.styles.warnings,
      visible: false,
      zIndex: 4
    })
  },

  stations: () => {
    return new VectorLayer({
      ref: 'stations',
      featureCodes: 'sh, st',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
        // url: 'http://localhost:8080/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=flood:st&srsName=EPSG:3857&outputFormat=application/json'
      }),
      style: window.flood.maps.styles.stations,
      visible: false,
      zIndex: 3
    })
  },

  impacts: () => {
    return new VectorLayer({
      ref: 'impacts',
      featureCodes: 'hi',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/impacts.geojson'
      }),
      style: window.flood.maps.styles.impacts,
      visible: false,
      zIndex: 5
    })
  },

  rainfall: () => {
    return new VectorLayer({
      ref: 'rainfall',
      featureCodes: 'rw, rd',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/rainfall.geojson'
      }),
      style: window.flood.maps.styles.rainfall,
      visible: false,
      zIndex: 2
    })
  },

  selected: () => {
    return new VectorLayer({
      ref: 'selected',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857'
      }),
      zIndex: 10
    })
  }
}
