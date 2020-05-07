'use strict'
/*
  Intialises the window.flood.maps object with extent and center
*/
import { transform, transformExtent } from 'ol/proj'

window.flood.maps = {

  // Extent of England and Wales
  extent: transformExtent([
    -5.75447130203247,
    49.9302711486816,
    1.79968345165253,
    55.8409309387207
  ], 'EPSG:4326', 'EPSG:3857'),

  // A large extent that allows restricting but full map view
  extentLarge: transformExtent([
    -13.930664,
    47.428087,
    8.920898,
    59.040555
  ], 'EPSG:4326', 'EPSG:3857'),

  // Centre of England and Wales (approx)
  centre: transform([
    -1.4758,
    52.9219
  ], 'EPSG:4326', 'EPSG:3857'),

  // Set a map extent from a array of lonLat's
  setExtentFromLonLat: (map, extent, padding = 0) => {
    padding = [padding, padding, padding, padding]
    extent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
    map.getView().fit(extent, { constrainResolution: false, padding: padding })
  },

  // Get array of lonLat's from an extent object
  getLonLatFromExtent: (extent) => {
    extent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
    const ext = extent.map(x => { return parseFloat(x.toFixed(5)) })
    return ext
  },

  // Should be in liveMap somewhere
  liveMapSymbolBreakpoint: 100

}
