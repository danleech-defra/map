'use strict'
/*
  Intialises the window.flood.maps object with extent and center
*/
import { transform, transformExtent } from 'ol/proj'

window.flood.maps = {

  extent: transformExtent([
    -5.75447130203247,
    49.9302711486816,
    1.79968345165253,
    55.8409309387207
  ], 'EPSG:4326', 'EPSG:3857'),

  center: transform([
    -1.4758,
    52.9219
  ], 'EPSG:4326', 'EPSG:3857'),

  liveMapSymbolBreakpoint: 100

}
