'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer' // VectorTile as VectorTileLayer for vector tiles
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import { BingMaps, OSM, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source' // VectorTile as VectorTileSource for vector tiles
import { GeoJSON, MVT } from 'ol/format' // MVT for vector tiles

window.flood.maps.layers = {

  road: () => {
    return new TileLayer({
      ref: 'road',
      source: new OSM(),
      /*
      source: new BingMaps({
        key: 'AvRzILjH5stoE_Mt6C08M051nlcQL9vWaWlMrcIjktGcFBgvjTV0TWULhTYL-4-s', // + '&c4w=1&cstl=rd&src=h&st=ar|fc:b5db81_wt|fc:a3ccff_tr|fc:50a964f4;sc:50a964f4_ard|fc:ffffff;sc:ffffff_rd|fc:50fed89d;sc:50eab671;lbc:626a6e_mr|lbc:626a6e_hr|lbc:626a6e_st|fc:ffffff;sc:ffffff_g|lc:dfdfdf_trs|lbc:626a6e',
        imagerySet: 'RoadOnDemand',
        hidpi: true
      }),
      */
      visible: false,
      zIndex: 0
    })
  },

  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      source: new BingMaps({
        key: 'AvRzILjH5stoE_Mt6C08M051nlcQL9vWaWlMrcIjktGcFBgvjTV0TWULhTYL-4-s',
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

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
      zIndex: 1
    })
  },

  /*
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
      visible: false,
      zIndex: 1
    })
  },
  */

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

  /*
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
  */

  // WebGL: Stations layer
  stations: () => {
    return new WebGLPointsLayer({
      ref: 'stations',
      featureCodes: 'sh, st',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
      }),
      style: window.flood.maps.styles.stationsJSON,
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
      featureCodes: 'rf',
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
