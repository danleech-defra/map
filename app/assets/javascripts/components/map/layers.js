'use strict'
/*
Initialises the window.flood.maps layers
*/
import Feature from 'ol/Feature'
import { Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer'
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

  vectorTiles: () => {
    return new VectorTileLayer({
      ref: 'vectorTiles',
      featureCodes: 'ts, tw, ta, tr',
      maxResolution: window.flood.maps.symbolThreshold,
      source: new VectorTileSource({
        // cacheSize: 128,
        format: new MVT({
          featureClass: Feature,
          idProperty: 'id'
        }),
        url: 'http://localhost:8080/geoserver/gwc/service/wmts?request=GetTile&service=wmts&version=1.0.0&layer=flood:target_area&tilematrix=EPSG:900913:{z}&tilematrixset=EPSG:900913&format=application/vnd.mapbox-vector-tile&tilecol={x}&tilerow={y}',
        overlaps: false
      }),
      style: window.flood.maps.styles.polygons,
      visible: true,
      zIndex: 1
    })
  },

  rainfall: () => {
    return new VectorLayer({
      ref: 'rainfall',
      featureCodes: 'rf',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/rainfall.geojson'
      }),
      style: window.flood.maps.styles.points,
      visible: false,
      zIndex: 2
    })
  },

  stations: () => {
    return new VectorLayer({
      ref: 'stations',
      featureCodes: 'st',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
      }),
      style: window.flood.maps.styles.points,
      visible: false,
      zIndex: 3
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
      }),
      style: window.flood.maps.styles.points,
      visible: false,
      zIndex: 4
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
      style: window.flood.maps.styles.points,
      visible: false,
      zIndex: 5
    })
  },

  selected: () => {
    return new VectorLayer({
      ref: 'selected',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857'
      }),
      style: window.flood.maps.styles.points,
      zIndex: 10
    })
  }
}
