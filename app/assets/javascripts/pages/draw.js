'use strict'
import '../core'
import '../components/map/maps'
import '../components/map/layers'
import '../components/map/draw'

// Create an area map
window.flood.maps.createDrawMap('map', {
  centre: [-2.9329, 54.8925],
  zoom: 18
})
