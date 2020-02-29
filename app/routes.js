const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

router.get('/api/warnings.geojson', function (req, res) {
  var data = {
    type: 'FeatureCollection',
    totalFeatures: 4,
    features: [
      {
        type: 'Feature',
        id: 'ta.013FWFD2',
        geometry: {
          type: 'Point',
          coordinates: [
            -1.95888018,
            53.44510995
          ]
        },
        properties: {
          state: 14,
          name: 'Glossop and Long Clough Brook at Glossop'
        }
      },
      {
        type: 'Feature',
        id: 'ta.013WAFLM',
        geometry: {
          type: 'Point',
          coordinates: [
            -2.59005947,
            53.37576792
          ]
        },
        properties: {
          state: 13,
          name: 'Lower River Mersey including Warrington, Runcorn and Lymm areas'
        }
      },
      {
        type: 'Feature',
        id: 'ta.013FWFGM52',
        geometry: {
          type: 'Point',
          coordinates: [
            -2.19737045,
            53.39474177
          ]
        },
        properties: {
          state: 12,
          name: 'Chorlton Brook at Cheadle, Sports Field, Palmer Avenue and Cuthbert Road areas'
        }
      },
      {
        type: 'Feature',
        id: 'ta.013FWFGM5',
        geometry: {
          type: 'Point',
          coordinates: [
            -2.15920682,
            53.61582569
          ]
        },
        properties: {
          state: 12,
          name: 'River Roch in Rochdale'
        }
      }
    ]
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
})

router.get('/api/stations.geojson', function (req, res) {
  var data = {
    type: 'FeatureCollection',
    totalFeatures: 3,
    features: [
      {
        type: 'Feature',
        id: 'st.5149',
        geometry: {
          type: 'Point',
          coordinates: [
            -2.56037241,
            53.39066965
          ]
        },
        properties: {
          state: 21,
          name: 'Westy (River Mersey)'
        }
      },
      {
        type: 'Feature',
        id: 'st.5193',
        geometry: {
          type: 'Point',
          coordinates: [
            -2.37556674,
            53.49407954
          ]
        },
        properties: {
          state: 22,
          name: 'Chestnut Road (Worsley Brook)'
        }
      },
      {
        type: 'Feature',
        id: 'st.5088',
        geometry: {
          type: 'Point',
          coordinates: [
            -2.22896423,
            53.47419061
          ]
        },
        properties: {
          state: 23,
          name: 'London Road (River Medlock)'
        }
      }
    ]
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
})

router.get('/api/rainfall.geojson', function (req, res) {
  var data = {
    type: 'FeatureCollection',
    totalFeatures: 0,
    features: []
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
})

router.get('/api/impacts.geojson', function (req, res) {
  var data = {
    type: 'FeatureCollection',
    totalFeatures: 0,
    features: []
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
})

module.exports = router
