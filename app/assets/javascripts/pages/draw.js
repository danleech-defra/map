'use strict'
import '../core'
import '../components/map/maps'
import '../components/map/layers'
import '../components/map/draw'

// Create an area map
window.flood.maps.createDrawMap('map', {
  centre: [0.90401, 51.80645],
  zoom: 15
})
