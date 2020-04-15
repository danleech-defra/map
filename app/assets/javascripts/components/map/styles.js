'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke } from 'ol/style'

window.flood.maps.styles = {
  // Primarily vector tiles
  nuts1: (feature) => {
    // Generate style
    return new Style({
      fill: new Fill({
        color: '#f3f2f1'
      }),
      stroke: new Stroke({
        color: '#f3f2f1',
        width: 0
      })
    })
  },

  // Primarily vector tiles
  targetAreaPolygons: (feature) => {
    // Use corresposnding warning feature propeties for styling
    const warningsSource = window.flood.maps.warningsSource
    const warning = warningsSource.getFeatureById(feature.getId())
    if (!warning || !warning.get('isVisible')) {
      return new Style()
    }

    const state = warning.get('state')
    const isSelected = warning.get('isSelected')
    const isGroundwater = warning.getId().substring(6, 9) === 'FAG'

    // Defaults
    let strokeColour = 'transparent'
    let fillColour = 'transparent'
    let zIndex = 1

    switch (state) {
      case 11: // Severe warning
        strokeColour = isSelected ? '#FFDD00' : '#D4351C'
        fillColour = pattern('severe', isSelected)
        zIndex = 5
        break
      case 12: // Warning
        strokeColour = isSelected ? '#FFDD00' : '#D4351C'
        fillColour = pattern('warning', isSelected)
        zIndex = 4
        break
      case 13: // Alert
        strokeColour = isSelected ? '#FFDD00' : '#F47738'
        fillColour = pattern('alert', isSelected)
        zIndex = isGroundwater ? 1 : 2
        break
      case 14: // Removed
        strokeColour = isSelected ? '#FFDD00' : '#626A6E'
        fillColour = pattern('removed', isSelected)
        zIndex = 3
        break
    }

    // Generate style
    return new Style({
      fill: new Fill({
        color: fillColour
      }),
      stroke: new Stroke({
        color: strokeColour,
        width: 1,
        miterLimit: 2,
        lineJoin: 'round',
        lineDash: [0, 0]
      }),
      zIndex: zIndex
    })
  },

  // Warning centroids
  warnings: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return new Style({})
    }
    // Hide warning symbols when polygon is shown
    if (resolution < window.flood.maps.symbolThreshold) {
      return new Style({})
    }

    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const dataUri = {
      severe: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cpath d='M22.298,11.196c0.485,-1.003 1.513,-1.696 2.702,-1.696c1.189,0 2.217,0.693 2.703,1.697l0,0l12.464,24.929l0,0c0.213,0.412 0.333,0.879 0.333,1.374c0,1.655 -1.343,2.999 -2.997,3l0,0l-0.003,0l0,0l0,0l-25,0l0,0c-1.656,0 -3,-1.344 -3,-3c0,-0.495 0.12,-0.962 0.333,-1.374l0,0l12.465,-24.93l0,0Z' style='fill:%23fff;stroke:%23fff;stroke-width:8px;'/%3E%3Cpath d='M22.298,11.196c0.485,-1.003 1.513,-1.696 2.702,-1.696c1.189,0 2.217,0.693 2.703,1.697l0,0l12.464,24.929l0,0c0.213,0.412 0.333,0.879 0.333,1.374c0,1.655 -1.343,2.999 -2.997,3l0,0l-0.003,0l0,0l0,0l-25,0l0,0c-1.656,0 -3,-1.344 -3,-3c0,-0.495 0.12,-0.962 0.333,-1.374l0,0l12.465,-24.93l0,0Z' style='fill:%23d4351c;stroke:%23d4351c;stroke-width:6px;'/%3E%3Cpath d='M22.777,11.355c0.416,-0.804 1.256,-1.355 2.223,-1.355c0.991,0 1.848,0.577 2.252,1.414l0,0l12.471,24.941l0,0c0.177,0.343 0.277,0.732 0.277,1.145c0,1.38 -1.12,2.5 -2.5,2.5c0,0 -25,0 -25,0l0,0c-1.38,0 -2.5,-1.12 -2.5,-2.5c0,-0.413 0.1,-0.802 0.277,-1.145l0,0l12.471,-24.942c0.01,-0.019 0.019,-0.038 0.029,-0.057l0,-0.001l0,0Z'/%3E%3Cpath d='M12.5,37.5l1.252,-2.504c0.488,0.47 1.755,1.578 2.673,1.542c1.135,-0.044 2.104,-1.15 2.981,-1.122c0.696,0.022 1.264,1.118 2.74,1.125c1.392,0.006 1.87,-1.178 2.881,-1.162c0.837,0.013 1.257,1.186 2.795,1.162c1.627,-0.026 1.834,-1.141 2.878,-1.142c1.041,0 1.333,1.194 2.921,1.139c0.671,-0.022 1.464,-0.346 2.697,-1.401l1.182,2.363l-25,0Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M14.767,32.966l0.829,-1.658c2.081,2.183 3.14,0.447 4.548,0.076c0.681,-0.18 1.114,0.97 2.585,1.012c1.498,0.043 1.811,-1.055 2.659,-1.042c0.925,0.014 1.117,1.046 2.562,1.043c1.442,-0.004 1.833,-1.005 2.549,-1.039c0.994,-0.047 1.203,1.01 2.593,1.037c0.897,0.018 1.575,-0.561 1.575,-0.561l0.637,1.274c-0.648,0.498 -1.096,0.983 -1.92,0.94c-0.718,-0.037 -1.196,-1.071 -2.63,-1.13c-1.462,-0.06 -1.794,1.014 -2.804,1.141c-1.053,0.134 -1.347,-1.11 -2.915,-1.141c-1.604,-0.032 -1.852,1.132 -2.938,1.14c-0.959,0.008 -1.395,-1.074 -2.586,-1.122c-1.467,-0.058 -2.376,1.142 -3.113,1.112c-0.735,-0.03 -1.631,-1.082 -1.631,-1.082Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M16.529,29.443l0.711,-1.423c1.673,1.411 2.749,-0.365 3.689,-0.343c0.549,0.012 0.973,0.892 2.073,0.894c1.402,0.003 1.597,-0.893 2.339,-0.907c0.72,-0.014 0.965,0.885 2.182,0.907c1.377,0.026 1.656,-0.919 2.351,-0.907c0.865,0.014 1.297,1.385 3.072,0.729l0.579,1.158c0,0 -0.524,0.401 -1.017,0.467c-0.801,0.107 -1.179,-0.924 -2.49,-0.991c-1.228,-0.064 -1.742,1.009 -2.499,0.991c-0.98,-0.023 -1.198,-0.969 -2.451,-0.991c-1.457,-0.027 -1.585,0.961 -2.587,0.993c-0.792,0.025 -1.223,-0.966 -2.302,-0.98c-1.149,-0.014 -1.997,0.941 -2.632,0.978c-0.505,0.029 -1.018,-0.575 -1.018,-0.575Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M29.127,24.472l0.847,0c0.427,0 0.708,-0.531 0.396,-0.905l-4.973,-5.95c-0.189,-0.226 -0.561,-0.233 -0.794,0l-1.701,2.036l0,-1.001l-1.229,0l0,2.47l-2.043,2.445c-0.289,0.346 -0.055,0.905 0.396,0.905l0.847,0l0,0.911c0.724,-0.221 0.916,0.796 2.248,0.795c1.238,-0.001 1.375,-0.842 2.104,-0.843c0.651,-0.002 0.822,0.851 2.222,0.843c0.827,-0.005 1.412,-0.745 1.68,-0.791l0,-0.915Z' style='fill:%23fff;'/%3E%3Cpath d='M22.298,11.196c0.485,-1.003 1.513,-1.696 2.702,-1.696c1.189,0 2.217,0.693 2.703,1.697l0,0l12.464,24.929l0,0c0.213,0.412 0.333,0.879 0.333,1.374c0,1.655 -1.343,2.999 -2.997,3l0,0l-0.003,0l0,0l0,0l-25,0l0,0c-1.656,0 -3,-1.344 -3,-3c0,-0.495 0.12,-0.962 0.333,-1.374l0,0l12.465,-24.93l0,0Z' style='fill:%23d4351c;stroke:%23fff;stroke-width:1px;'/%3E%3Cpath d='M12.5,37.5l1.252,-2.504c0.488,0.47 1.755,1.578 2.673,1.542c1.135,-0.044 2.104,-1.15 2.981,-1.122c0.696,0.022 1.264,1.118 2.74,1.125c1.392,0.006 1.87,-1.178 2.881,-1.162c0.837,0.013 1.257,1.186 2.795,1.162c1.627,-0.026 1.834,-1.141 2.878,-1.142c1.041,0 1.333,1.194 2.921,1.139c0.671,-0.022 1.464,-0.346 2.697,-1.401l1.182,2.363l-25,0Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M14.767,32.966l0.829,-1.658c2.081,2.183 3.14,0.447 4.548,0.076c0.681,-0.18 1.114,0.97 2.585,1.012c1.498,0.043 1.811,-1.055 2.659,-1.042c0.925,0.014 1.117,1.046 2.562,1.043c1.442,-0.004 1.833,-1.005 2.549,-1.039c0.994,-0.047 1.203,1.01 2.593,1.037c0.897,0.018 1.575,-0.561 1.575,-0.561l0.637,1.274c-0.648,0.498 -1.096,0.983 -1.92,0.94c-0.718,-0.037 -1.196,-1.071 -2.63,-1.13c-1.462,-0.06 -1.794,1.014 -2.804,1.141c-1.053,0.134 -1.347,-1.11 -2.915,-1.141c-1.604,-0.032 -1.852,1.132 -2.938,1.14c-0.959,0.008 -1.395,-1.074 -2.586,-1.122c-1.467,-0.058 -2.376,1.142 -3.113,1.112c-0.735,-0.03 -1.631,-1.082 -1.631,-1.082Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M16.529,29.443l0.711,-1.423c1.673,1.411 2.749,-0.365 3.689,-0.343c0.549,0.012 0.973,0.892 2.073,0.894c1.402,0.003 1.597,-0.893 2.339,-0.907c0.72,-0.014 0.965,0.885 2.182,0.907c1.377,0.026 1.656,-0.919 2.351,-0.907c0.865,0.014 1.297,1.385 3.072,0.729l0.579,1.158c0,0 -0.524,0.401 -1.017,0.467c-0.801,0.107 -1.179,-0.924 -2.49,-0.991c-1.228,-0.064 -1.742,1.009 -2.499,0.991c-0.98,-0.023 -1.198,-0.969 -2.451,-0.991c-1.457,-0.027 -1.585,0.961 -2.587,0.993c-0.792,0.025 -1.223,-0.966 -2.302,-0.98c-1.149,-0.014 -1.997,0.941 -2.632,0.978c-0.505,0.029 -1.018,-0.575 -1.018,-0.575Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M29.127,24.472l0.847,0c0.427,0 0.708,-0.531 0.396,-0.905l-4.973,-5.95c-0.189,-0.226 -0.561,-0.233 -0.794,0l-1.701,2.036l0,-1.001l-1.229,0l0,2.47l-2.043,2.445c-0.289,0.346 -0.055,0.905 0.396,0.905l0.847,0l0,0.911c0.724,-0.221 0.916,0.796 2.248,0.795c1.238,-0.001 1.375,-0.842 2.104,-0.843c0.651,-0.002 0.822,0.851 2.222,0.843c0.827,-0.005 1.412,-0.745 1.68,-0.791l0,-0.915Z' style='fill:%23fff;'/%3E%3C/svg%3E`,
      severeSelected: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cpath d='M17.443,8.607c1.413,-2.735 4.268,-4.607 7.557,-4.607c3.289,0 6.144,1.872 7.557,4.607l0.001,0.003c0.034,0.064 0.066,0.13 0.098,0.196l12.401,24.801l0,0c0.603,1.167 0.943,2.49 0.943,3.893c0,4.691 -3.809,8.5 -8.5,8.5l0,0l-25,0l0,0c-4.691,0 -8.5,-3.809 -8.5,-8.5c0,-1.403 0.34,-2.726 0.943,-3.893l0,0l12.401,-24.802c0.032,-0.065 0.064,-0.13 0.098,-0.195l0.001,-0.003l0,0Z' style='stroke:%23fd0;stroke-width:8px;'/%3E%3Cpath d='M22.777,11.355c0.416,-0.804 1.256,-1.355 2.223,-1.355c0.991,0 1.848,0.577 2.252,1.414l0,0l12.471,24.941l0,0c0.177,0.343 0.277,0.732 0.277,1.145c0,1.38 -1.12,2.5 -2.5,2.5c0,0 -25,0 -25,0l0,0c-1.38,0 -2.5,-1.12 -2.5,-2.5c0,-0.413 0.1,-0.802 0.277,-1.145l0,0l12.471,-24.942c0.01,-0.019 0.019,-0.038 0.029,-0.057l0,-0.001l0,0Z' style='fill:%23d4351c;'/%3E%3Cpath d='M12.5,37.5l1.252,-2.504c0.488,0.47 1.755,1.578 2.673,1.542c1.135,-0.044 2.104,-1.15 2.981,-1.122c0.696,0.022 1.264,1.118 2.74,1.125c1.392,0.006 1.87,-1.178 2.881,-1.162c0.837,0.013 1.257,1.186 2.795,1.162c1.627,-0.026 1.834,-1.141 2.878,-1.142c1.041,0 1.333,1.194 2.921,1.139c0.671,-0.022 1.464,-0.346 2.697,-1.401l1.182,2.363l-25,0Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M14.767,32.966l0.829,-1.658c2.081,2.183 3.14,0.447 4.548,0.076c0.681,-0.18 1.114,0.97 2.585,1.012c1.498,0.043 1.811,-1.055 2.659,-1.042c0.925,0.014 1.117,1.046 2.562,1.043c1.442,-0.004 1.833,-1.005 2.549,-1.039c0.994,-0.047 1.203,1.01 2.593,1.037c0.897,0.018 1.575,-0.561 1.575,-0.561l0.637,1.274c-0.648,0.498 -1.096,0.983 -1.92,0.94c-0.718,-0.037 -1.196,-1.071 -2.63,-1.13c-1.462,-0.06 -1.794,1.014 -2.804,1.141c-1.053,0.134 -1.347,-1.11 -2.915,-1.141c-1.604,-0.032 -1.852,1.132 -2.938,1.14c-0.959,0.008 -1.395,-1.074 -2.586,-1.122c-1.467,-0.058 -2.376,1.142 -3.113,1.112c-0.735,-0.03 -1.631,-1.082 -1.631,-1.082Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M16.529,29.443l0.711,-1.423c1.673,1.411 2.749,-0.365 3.689,-0.343c0.549,0.012 0.973,0.892 2.073,0.894c1.402,0.003 1.597,-0.893 2.339,-0.907c0.72,-0.014 0.965,0.885 2.182,0.907c1.377,0.026 1.656,-0.919 2.351,-0.907c0.865,0.014 1.297,1.385 3.072,0.729l0.579,1.158c0,0 -0.524,0.401 -1.017,0.467c-0.801,0.107 -1.179,-0.924 -2.49,-0.991c-1.228,-0.064 -1.742,1.009 -2.499,0.991c-0.98,-0.023 -1.198,-0.969 -2.451,-0.991c-1.457,-0.027 -1.585,0.961 -2.587,0.993c-0.792,0.025 -1.223,-0.966 -2.302,-0.98c-1.149,-0.014 -1.997,0.941 -2.632,0.978c-0.505,0.029 -1.018,-0.575 -1.018,-0.575Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M29.127,24.472l0.847,0c0.427,0 0.708,-0.531 0.396,-0.905l-4.973,-5.95c-0.189,-0.226 -0.561,-0.233 -0.794,0l-1.701,2.036l0,-1.001l-1.229,0l0,2.47l-2.043,2.445c-0.289,0.346 -0.055,0.905 0.396,0.905l0.847,0l0,0.911c0.724,-0.221 0.916,0.796 2.248,0.795c1.238,-0.001 1.375,-0.842 2.104,-0.843c0.651,-0.002 0.822,0.851 2.222,0.843c0.827,-0.005 1.412,-0.745 1.68,-0.791l0,-0.915Z' style='fill:%23fff;'/%3E%3C/svg%3E`,
      warning: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cpath d='M22.298,11.196c0.485,-1.003 1.513,-1.696 2.702,-1.696c1.189,0 2.217,0.693 2.703,1.697l0,0l12.464,24.929l0,0c0.213,0.412 0.333,0.879 0.333,1.374c0,1.655 -1.343,2.999 -2.997,3l0,0l-0.003,0l0,0l0,0l-25,0l0,0c-1.656,0 -3,-1.344 -3,-3c0,-0.495 0.12,-0.962 0.333,-1.374l0,0l12.465,-24.93l0,0Z' style='fill:%23d4351c;stroke:%23fff;stroke-width:1px;'/%3E%3Cpath d='M12.5,37.5l1.252,-2.504c0.488,0.47 1.755,1.578 2.673,1.542c1.135,-0.044 2.104,-1.15 2.981,-1.122c0.696,0.022 1.264,1.118 2.74,1.125c1.392,0.006 1.87,-1.178 2.881,-1.162c0.837,0.013 1.257,1.186 2.795,1.162c1.627,-0.026 1.834,-1.141 2.878,-1.142c1.041,0 1.333,1.194 2.921,1.139c0.671,-0.022 1.464,-0.346 2.697,-1.401l1.182,2.363l-25,0Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M14.767,32.966l0.829,-1.658c2.081,2.183 3.14,0.447 4.548,0.076c0.681,-0.18 1.114,0.97 2.585,1.012c1.498,0.043 1.811,-1.055 2.659,-1.042c0.925,0.014 1.117,1.046 2.562,1.043c1.442,-0.004 1.833,-1.005 2.549,-1.039c0.994,-0.047 1.203,1.01 2.593,1.037c0.897,0.018 1.575,-0.561 1.575,-0.561l0.637,1.274c-0.648,0.498 -1.096,0.983 -1.92,0.94c-0.718,-0.037 -1.196,-1.071 -2.63,-1.13c-1.462,-0.06 -1.794,1.014 -2.804,1.141c-1.053,0.134 -1.347,-1.11 -2.915,-1.141c-1.604,-0.032 -1.852,1.132 -2.938,1.14c-0.959,0.008 -1.395,-1.074 -2.586,-1.122c-1.467,-0.058 -2.376,1.142 -3.113,1.112c-0.735,-0.03 -1.631,-1.082 -1.631,-1.082Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M29.127,26.403l0.847,0c0.427,0 0.708,-0.531 0.396,-0.905l-4.973,-5.95c-0.189,-0.226 -0.561,-0.233 -0.794,0l-1.701,2.036l0,-1.001l-1.229,0l0,2.47l-2.043,2.445c-0.289,0.346 -0.055,0.905 0.396,0.905l0.847,0l0,2.546c0,0 0.832,0.854 2.029,0.851c1.442,-0.004 1.613,-1.004 2.495,-1.01c0.736,-0.005 1.055,1.014 2.573,1.009c0.698,-0.002 1.157,-0.34 1.157,-0.34l0,-3.056Z' style='fill:%23fff;'/%3E%3C/svg%3E`,
      warningSelected: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cpath d='M17.443,8.607c1.413,-2.735 4.268,-4.607 7.557,-4.607c3.289,0 6.144,1.872 7.557,4.607l0.001,0.003c0.034,0.064 0.066,0.13 0.098,0.196l12.401,24.801l0,0c0.603,1.167 0.943,2.49 0.943,3.893c0,4.691 -3.809,8.5 -8.5,8.5l0,0l-25,0l0,0c-4.691,0 -8.5,-3.809 -8.5,-8.5c0,-1.403 0.34,-2.726 0.943,-3.893l0,0l12.401,-24.802c0.032,-0.065 0.064,-0.13 0.098,-0.195l0.001,-0.003l0,0Z' style='stroke:%23fd0;stroke-width:8px;'/%3E%3Cpath d='M22.777,11.355c0.416,-0.804 1.256,-1.355 2.223,-1.355c0.991,0 1.848,0.577 2.252,1.414l0,0l12.471,24.941l0,0c0.177,0.343 0.277,0.732 0.277,1.145c0,1.38 -1.12,2.5 -2.5,2.5c0,0 -25,0 -25,0l0,0c-1.38,0 -2.5,-1.12 -2.5,-2.5c0,-0.413 0.1,-0.802 0.277,-1.145l0,0l12.471,-24.942c0.01,-0.019 0.019,-0.038 0.029,-0.057l0,-0.001l0,0Z' style='fill:%23d4351c;stroke:%23000;stroke-width:0.1px;'/%3E%3Cpath d='M12.5,37.5l1.252,-2.504c0.488,0.47 1.755,1.578 2.673,1.542c1.135,-0.044 2.104,-1.15 2.981,-1.122c0.696,0.022 1.264,1.118 2.74,1.125c1.392,0.006 1.87,-1.178 2.881,-1.162c0.837,0.013 1.257,1.186 2.795,1.162c1.627,-0.026 1.834,-1.141 2.878,-1.142c1.041,0 1.333,1.194 2.921,1.139c0.671,-0.022 1.464,-0.346 2.697,-1.401l1.182,2.363l-25,0Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M14.767,32.966l0.829,-1.658c2.081,2.183 3.14,0.447 4.548,0.076c0.681,-0.18 1.114,0.97 2.585,1.012c1.498,0.043 1.811,-1.055 2.659,-1.042c0.925,0.014 1.117,1.046 2.562,1.043c1.442,-0.004 1.833,-1.005 2.549,-1.039c0.994,-0.047 1.203,1.01 2.593,1.037c0.897,0.018 1.575,-0.561 1.575,-0.561l0.637,1.274c-0.648,0.498 -1.096,0.983 -1.92,0.94c-0.718,-0.037 -1.196,-1.071 -2.63,-1.13c-1.462,-0.06 -1.794,1.014 -2.804,1.141c-1.053,0.134 -1.347,-1.11 -2.915,-1.141c-1.604,-0.032 -1.852,1.132 -2.938,1.14c-0.959,0.008 -1.395,-1.074 -2.586,-1.122c-1.467,-0.058 -2.376,1.142 -3.113,1.112c-0.735,-0.03 -1.631,-1.082 -1.631,-1.082Z' style='fill:%23fff;stroke:%23fff;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M29.127,26.403l0.847,0c0.427,0 0.708,-0.531 0.396,-0.905l-4.973,-5.95c-0.189,-0.226 -0.561,-0.233 -0.794,0l-1.701,2.036l0,-1.001l-1.229,0l0,2.47l-2.043,2.445c-0.289,0.346 -0.055,0.905 0.396,0.905l0.847,0l0,2.546c0,0 0.832,0.854 2.029,0.851c1.442,-0.004 1.613,-1.004 2.495,-1.01c0.736,-0.005 1.055,1.014 2.573,1.009c0.698,-0.002 1.157,-0.34 1.157,-0.34l0,-3.056Z' style='fill:%23fff;'/%3E%3C/svg%3E`,
      alert: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cpath d='M22.298,11.196c0.485,-1.003 1.513,-1.696 2.702,-1.696c1.189,0 2.217,0.693 2.703,1.697l0,0l12.464,24.929l0,0c0.213,0.412 0.333,0.879 0.333,1.374c0,1.655 -1.343,2.999 -2.997,3l0,0l-0.003,0l0,0l0,0l-25,0l0,0c-1.656,0 -3,-1.344 -3,-3c0,-0.495 0.12,-0.962 0.333,-1.374l0,0l12.465,-24.93l0,0Z' style='fill:%23f47738;stroke:%23fff;stroke-width:1px;'/%3E%3Cpath d='M25,12.5l12.5,25l-25,0l12.5,-25Z' style='fill:%23fff;'/%3E%3Cpath d='M29.124,27.684l0.848,0c0.426,0 0.707,-0.531 0.395,-0.904l-4.973,-5.951c-0.188,-0.226 -0.561,-0.232 -0.793,0l-1.702,2.036l0,-1.001l-1.229,0l0,2.471l-2.043,2.445c-0.289,0.345 -0.055,0.904 0.396,0.904l0.848,0l0,3.991l8.253,0l0,-3.991Z' style='fill:%23f47738;'/%3E%3Cpath d='M14.927,36l1.257,-2.513c0.631,0 1.103,1.152 2.783,1.163c1.516,0.01 1.921,-1.196 2.968,-1.185c0.961,0.01 1.294,1.188 2.963,1.188c1.634,0 1.93,-1.183 2.909,-1.188c1.091,-0.006 1.342,1.233 3.171,1.185c1.458,-0.038 1.83,-1.198 2.828,-1.185l1.267,2.535l-20.146,0Z' style='fill:%23f47738;stroke:%23f47738;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3C/svg%3E`,
      alertSelected: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cpath d='M17.443,8.607c1.413,-2.735 4.268,-4.607 7.557,-4.607c3.289,0 6.144,1.872 7.557,4.607l0.001,0.003c0.034,0.064 0.066,0.13 0.098,0.196l12.401,24.801l0,0c0.603,1.167 0.943,2.49 0.943,3.893c0,4.691 -3.809,8.5 -8.5,8.5l0,0l-25,0l0,0c-4.691,0 -8.5,-3.809 -8.5,-8.5c0,-1.403 0.34,-2.726 0.943,-3.893l0,0l12.401,-24.802c0.032,-0.065 0.064,-0.13 0.098,-0.195l0.001,-0.003l0,0Z' style='stroke:%23fd0;stroke-width:8px;'/%3E%3Cpath d='M22.777,11.355c0.416,-0.804 1.256,-1.355 2.223,-1.355c0.991,0 1.848,0.577 2.252,1.414l0,0l12.471,24.941l0,0c0.177,0.343 0.277,0.732 0.277,1.145c0,1.38 -1.12,2.5 -2.5,2.5c0,0 -25,0 -25,0l0,0c-1.38,0 -2.5,-1.12 -2.5,-2.5c0,-0.413 0.1,-0.802 0.277,-1.145l0,0l12.471,-24.942c0.01,-0.019 0.019,-0.038 0.029,-0.057l0,-0.001l0,0Z' style='fill:%23f47738;'/%3E%3Cpath d='M25,12.5l12.5,25l-25,0l12.5,-25Z' style='fill:%23fff;'/%3E%3Cpath d='M29.124,27.684l0.848,0c0.426,0 0.707,-0.531 0.395,-0.904l-4.973,-5.951c-0.188,-0.226 -0.561,-0.232 -0.793,0l-1.702,2.036l0,-1.001l-1.229,0l0,2.471l-2.043,2.445c-0.289,0.345 -0.055,0.904 0.396,0.904l0.848,0l0,3.991l8.253,0l0,-3.991Z' style='fill:%23f47738;'/%3E%3Cpath d='M14.927,36l1.257,-2.513c0.631,0 1.103,1.152 2.783,1.163c1.516,0.01 1.921,-1.196 2.968,-1.185c0.961,0.01 1.294,1.188 2.963,1.188c1.634,0 1.93,-1.183 2.909,-1.188c1.091,-0.006 1.342,1.233 3.171,1.185c1.458,-0.038 1.83,-1.198 2.828,-1.185l1.267,2.535l-20.146,0Z' style='fill:%23f47738;stroke:%23f47738;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3C/svg%3E`,
      removed: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath d='M22.298,11.196c0.485,-1.003 1.513,-1.696 2.702,-1.696c1.189,0 2.217,0.693 2.703,1.697l0,0l12.464,24.929l0,0c0.213,0.412 0.333,0.879 0.333,1.374c0,1.655 -1.343,2.999 -2.997,3l0,0l-0.003,0l0,0l0,0l-25,0l0,0c-1.656,0 -3,-1.344 -3,-3c0,-0.495 0.12,-0.962 0.333,-1.374l0,0l12.465,-24.93l0,0Z' style='fill:%23626a6e;stroke:%23fff;stroke-width:1px;'/%3E%3Cpath d='M25,12.5l12.5,25l-25,0l12.5,-25Z' style='fill:%23fff;'/%3E%3Cpath d='M14.927,36l1.257,-2.513c0.631,0 1.103,1.152 2.783,1.163c1.516,0.01 1.921,-1.196 2.968,-1.185c0.961,0.01 1.294,1.188 2.963,1.188c1.634,0 1.93,-1.183 2.909,-1.188c1.091,-0.006 1.342,1.233 3.171,1.185c1.458,-0.038 1.83,-1.198 2.828,-1.185l1.267,2.535l-20.146,0Z' style='fill:%23626a6e;stroke:%23626a6e;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M17.28,31.293l0.734,-1.467c0,0 0.783,0.757 2.03,0.722c1.36,-0.038 1.66,-1.078 2.563,-1.071c0.786,0.005 1.053,1.01 2.533,1.071c1.572,0.065 1.835,-1.014 2.752,-1.071c0.766,-0.048 1.058,0.997 2.548,1.069c1.079,0.051 1.628,-0.556 1.628,-0.556l0.652,1.303c0,0 -1.026,0.982 -1.908,0.963c-0.775,-0.016 -1.189,-1.108 -2.76,-1.162c-1.535,-0.053 -1.939,1.174 -3.036,1.161c-0.91,-0.01 -1.322,-1.102 -2.634,-1.161c-1.939,-0.087 -2.177,1.21 -3.182,1.161c-0.958,-0.045 -1.058,-0.595 -1.92,-0.962Z' style='fill:%23626a6e;stroke:%23626a6e;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3C/svg%3E`,
      removedSelected: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath d='M17.443,8.607c1.413,-2.735 4.268,-4.607 7.557,-4.607c3.289,0 6.144,1.872 7.557,4.607l0.001,0.003c0.034,0.064 0.066,0.13 0.098,0.196l12.401,24.801l0,0c0.603,1.167 0.943,2.49 0.943,3.893c0,4.691 -3.809,8.5 -8.5,8.5l0,0l-25,0l0,0c-4.691,0 -8.5,-3.809 -8.5,-8.5c0,-1.403 0.34,-2.726 0.943,-3.893l0,0l12.401,-24.802c0.032,-0.065 0.064,-0.13 0.098,-0.195l0.001,-0.003l0,0Z' style='stroke:%23fd0;stroke-width:8px;'/%3E%3Cpath d='M22.777,11.355c0.416,-0.804 1.256,-1.355 2.223,-1.355c0.991,0 1.848,0.577 2.252,1.414l0,0l12.471,24.941l0,0c0.177,0.343 0.277,0.732 0.277,1.145c0,1.38 -1.12,2.5 -2.5,2.5c0,0 -25,0 -25,0l0,0c-1.38,0 -2.5,-1.12 -2.5,-2.5c0,-0.413 0.1,-0.802 0.277,-1.145l0,0l12.471,-24.942c0.01,-0.019 0.019,-0.038 0.029,-0.057l0,-0.001l0,0Z' style='fill:%23626a6e;'/%3E%3Cpath d='M25,12.5l12.5,25l-25,0l12.5,-25Z' style='fill:%23fff;'/%3E%3Cpath d='M14.927,36l1.257,-2.513c0.631,0 1.103,1.152 2.783,1.163c1.516,0.01 1.921,-1.196 2.968,-1.185c0.961,0.01 1.294,1.188 2.963,1.188c1.634,0 1.93,-1.183 2.909,-1.188c1.091,-0.006 1.342,1.233 3.171,1.185c1.458,-0.038 1.83,-1.198 2.828,-1.185l1.267,2.535l-20.146,0Z' style='fill:%23626a6e;stroke:%23626a6e;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3Cpath d='M17.28,31.293l0.734,-1.467c0,0 0.783,0.757 2.03,0.722c1.36,-0.038 1.66,-1.078 2.563,-1.071c0.786,0.005 1.053,1.01 2.533,1.071c1.572,0.065 1.835,-1.014 2.752,-1.071c0.766,-0.048 1.058,0.997 2.548,1.069c1.079,0.051 1.628,-0.556 1.628,-0.556l0.652,1.303c0,0 -1.026,0.982 -1.908,0.963c-0.775,-0.016 -1.189,-1.108 -2.76,-1.162c-1.535,-0.053 -1.939,1.174 -3.036,1.161c-0.91,-0.01 -1.322,-1.102 -2.634,-1.161c-1.939,-0.087 -2.177,1.21 -3.182,1.161c-0.958,-0.045 -1.058,-0.595 -1.92,-0.962Z' style='fill:%23626a6e;stroke:%23626a6e;stroke-width:0.2px;stroke-linecap:round;stroke-miterlimit:1.5;'/%3E%3C/svg%3E`
    }
    let source = ''

    // Defaults
    let zIndex = 1

    switch (state) {
      case 11: // Severe warning
        zIndex = 10
        source = isSelected ? dataUri.severeSelected : dataUri.severe
        break
      case 12: // Warning
        zIndex = 9
        source = isSelected ? dataUri.warningSelected : dataUri.warning
        break
      case 13: // Alert
        zIndex = 7
        source = isSelected ? dataUri.alertSelected : dataUri.alert
        break
      case 14: // Removed
        zIndex = 8
        source = isSelected ? dataUri.removedSelected : dataUri.removed
        break
    }

    return new Style({
      image: new Icon({
        src: source,
        imgSize: [50, 50],
        anchor: [0.5, 0.5]
      }),
      zIndex: zIndex
    })
  },

  // Station centroids
  stations: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return new Style({})
    }
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const isBigSymbol = resolution <= window.flood.maps.symbolThreshold
    let style = {}

    if (state === 21) {
      style = isSelected ? (isBigSymbol ? styleCache.highBigSelected : styleCache.highSelected) : (isBigSymbol ? styleCache.highBig : styleCache.high)
    } else {
      style = isSelected ? (isBigSymbol ? styleCache.defaultBigSelected : styleCache.defaultSelected) : (isBigSymbol ? styleCache.defaultBig : styleCache.default)
    }

    return style
  },

  // Impact centroids
  impacts: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return new Style({})
    }
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let anchor = [0.5, 0.75]
    let offset = [0, 500]

    // Use large symbols
    if (resolution > window.flood.maps.symbolThreshold) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    // Use selected symbol
    if (isSelected) {
      offset[0] += 100
    }

    return new Style({
      image: new Icon({
        src: source,
        size: [74, 74],
        anchor: anchor,
        scale: 0.5,
        offset: [0, 0]
      })
    })
  },

  // Rainfall centroids
  rainfall: (feature, resolution) => {
    if (!feature.get('isVisible')) {
      return new Style({})
    }
    const isSelected = feature.get('isSelected')
    const source = '/public/images/icon-map-features-2x.png'

    // Defaults
    let anchor = [0.5, 0.75]
    let offset = [0, 1500]

    // Use large symbols
    if (resolution > window.flood.maps.symbolThreshold) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    // Use selected symbol
    if (isSelected) {
      offset[0] += 100
    }

    return new Style({
      image: new Icon({
        src: source,
        size: [66, 84],
        anchor: anchor,
        scale: 0.5,
        offset: [0, 0]
      })
    })
  }
}

const pattern = (style, isSelected) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'severe':
      ctx.fillStyle = isSelected ? '#FFDD00' : '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'warning':
      ctx.fillStyle = isSelected ? '#FFDD00' : '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'alert':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = isSelected ? '#FFDD00' : '#F47738'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'removed':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = isSelected ? '#FFDD00' : '#626A6E'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

const styleCache = {
  default: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='8.5' style='fill:%23003078;stroke:%23fff;stroke-width:1px;'/%3E%3Ccircle cx='25' cy='25' r='5' style='fill:%23fff;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 4
  }),
  defaultSelected: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 38 38'%3E%3Ccircle cx='18.75' cy='18.75' r='10.5' style='fill:%230b0c0c;stroke:%23fd0;stroke-width:6px;'/%3E%3Ccircle cx='18.75' cy='18.75' r='4.875' style='fill:%23fff;stroke:%23003078;stroke-width:2.25px;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 4
  }),
  defaultBig: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='13.75' style='fill:%23003078;stroke:%23fff;stroke-width:1px;'/%3E%3Ccircle cx='25' cy='25' r='10' style='fill:%23fff;'/%3E%3Cpath d='M22,16.521l6,0l0,2.018l-3,0l0,0.968l3,0l0,2.028l-2,0l0,0.967l2,0l0,1.991l-2,0l0,0.967l2,0l0,2.485c-0.907,-0.041 -1.325,-1.111 -2.563,-1.133c-1.58,-0.027 -1.777,1.541 -3.437,1.048l0,-11.339Z' style='fill:%23003078;'/%3E%3Cpath d='M16.907,28.939c1.019,-0.014 1.825,-0.841 2.779,-1.093c0.74,-0.195 1.21,1.054 2.809,1.1c1.626,0.047 1.967,-1.146 2.888,-1.132c1.006,0.015 1.213,1.136 2.784,1.132c1.566,-0.003 1.991,-1.091 2.77,-1.128c0.91,-0.043 1.215,0.768 2.195,1.04c-0.171,0.359 -0.364,0.705 -0.579,1.036c-0.353,-0.198 -0.779,-0.358 -1.339,-0.381c-1.59,-0.065 -1.95,1.101 -3.047,1.24c-1.144,0.145 -1.464,-1.206 -3.167,-1.24c-1.743,-0.035 -2.012,1.23 -3.193,1.239c-1.042,0.008 -1.515,-1.167 -2.809,-1.219c-0.595,-0.024 -1.104,0.143 -1.552,0.359c-0.198,-0.306 -0.379,-0.624 -0.539,-0.953Z' style='fill:%23003078;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 4
  }),
  defaultBigSelected: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='19.25' style='fill:%230b0c0c;stroke:%23fd0;stroke-width:8px;'/%3E%3Ccircle cx='25' cy='25' r='13.25' style='fill:%23003078;'/%3E%3Ccircle cx='25' cy='25' r='10' style='fill:%23fff;'/%3E%3Cpath d='M22,16.521l6,0l0,2.018l-3,0l0,0.968l3,0l0,2.028l-2,0l0,0.967l2,0l0,1.991l-2,0l0,0.967l2,0l0,2.485c-0.907,-0.041 -1.325,-1.111 -2.563,-1.133c-1.58,-0.027 -1.777,1.541 -3.437,1.048l0,-11.339Z' style='fill:%23003078;'/%3E%3Cpath d='M16.907,28.939c1.019,-0.014 1.825,-0.841 2.779,-1.093c0.74,-0.195 1.21,1.054 2.809,1.1c1.626,0.047 1.967,-1.146 2.888,-1.132c1.006,0.015 1.213,1.136 2.784,1.132c1.566,-0.003 1.991,-1.091 2.77,-1.128c0.91,-0.043 1.215,0.768 2.195,1.04c-0.171,0.359 -0.364,0.705 -0.579,1.036c-0.353,-0.198 -0.779,-0.358 -1.339,-0.381c-1.59,-0.065 -1.95,1.101 -3.047,1.24c-1.144,0.145 -1.464,-1.206 -3.167,-1.24c-1.743,-0.035 -2.012,1.23 -3.193,1.239c-1.042,0.008 -1.515,-1.167 -2.809,-1.219c-0.595,-0.024 -1.104,0.143 -1.552,0.359c-0.198,-0.306 -0.379,-0.624 -0.539,-0.953Z' style='fill:%23003078;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 4
  }),
  high: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='8.5' style='fill:%23003078;stroke:%23fff;stroke-width:1px;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 5
  }),
  highSelected: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='14' style='fill:%230b0c0c;stroke:%23fd0;stroke-width:8px;'/%3E%3Ccircle cx='25' cy='25' r='8' style='fill:%23003078;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 5
  }),
  highBig: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='13.75' style='fill:%23003078;stroke:%23fff;stroke-width:1px;'/%3E%3Cpath d='M22,16.521l6,0l0,2.018l-3,0l0,0.968l3,0l0,2.462c-0.907,-0.041 -1.325,-1.111 -2.563,-1.133c-1.58,-0.027 -1.777,1.541 -3.437,1.048l0,-5.363Z' style='fill:%23fff;'/%3E%3Cpath d='M15.356,22.35c1.87,1.467 2.944,-0.114 4.33,-0.48c0.74,-0.195 1.21,1.054 2.809,1.1c1.626,0.047 1.967,-1.146 2.888,-1.133c1.006,0.016 1.213,1.137 2.784,1.133c1.566,-0.004 1.991,-1.091 2.77,-1.128c1.079,-0.052 1.306,1.098 2.816,1.127c0.378,0.007 0.72,-0.083 0.998,-0.196c0.133,0.584 0.215,1.188 0.24,1.806c-0.268,0.13 -0.561,0.204 -0.921,0.185c-0.779,-0.04 -1.299,-1.164 -2.856,-1.227c-1.59,-0.065 -1.95,1.101 -3.047,1.24c-1.144,0.145 -1.464,-1.206 -3.167,-1.24c-1.743,-0.035 -2.012,1.229 -3.193,1.239c-1.042,0.008 -1.515,-1.168 -2.809,-1.219c-1.594,-0.064 -2.581,1.24 -3.382,1.207c-0.197,-0.008 -0.405,-0.083 -0.607,-0.193c0.032,-0.766 0.151,-1.509 0.347,-2.221Z' style='fill:%23fff;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 5
  }),
  highBigSelected: new Style({
    image: new Icon({
      src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='19.25' style='fill:%230b0c0c;stroke:%23fd0;stroke-width:8px;'/%3E%3Ccircle cx='25' cy='25' r='13.25' style='fill:%23003078;'/%3E%3Cpath d='M22,16.521l6,0l0,2.018l-3,0l0,0.968l3,0l0,2.462c-0.907,-0.041 -1.325,-1.111 -2.563,-1.133c-1.58,-0.027 -1.777,1.541 -3.437,1.048l0,-5.363Z' style='fill:%23fff;'/%3E%3Cpath d='M15.356,22.35c1.87,1.467 2.944,-0.114 4.33,-0.48c0.74,-0.195 1.21,1.054 2.809,1.1c1.626,0.047 1.967,-1.146 2.888,-1.133c1.006,0.016 1.213,1.137 2.784,1.133c1.566,-0.004 1.991,-1.091 2.77,-1.128c1.079,-0.052 1.306,1.098 2.816,1.127c0.378,0.007 0.72,-0.083 0.998,-0.196c0.133,0.584 0.215,1.188 0.24,1.806c-0.268,0.13 -0.561,0.204 -0.921,0.185c-0.779,-0.04 -1.299,-1.164 -2.856,-1.227c-1.59,-0.065 -1.95,1.101 -3.047,1.24c-1.144,0.145 -1.464,-1.206 -3.167,-1.24c-1.743,-0.035 -2.012,1.229 -3.193,1.239c-1.042,0.008 -1.515,-1.168 -2.809,-1.219c-1.594,-0.064 -2.581,1.24 -3.382,1.207c-0.197,-0.008 -0.405,-0.083 -0.607,-0.193c0.032,-0.766 0.151,-1.509 0.347,-2.221Z' style='fill:%23fff;'/%3E%3C/svg%3E`,
      size: [50, 50],
      anchor: [0.5, 0.5]
    }),
    zIndex: 5
  })
}
