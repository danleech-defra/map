/*
  webpack.js
  ===========
  bundles javascript files into public folder
*/

const gulp = require('gulp')
const webpackStream = require('webpack-stream')
const config = require('./config.json')
const webpackConfig = require('../webpack.config.js')

gulp.task('webpack', function () {
  return webpackStream(webpackConfig)
    .pipe(gulp.dest(`${config.paths.public}/javascripts/pages`))
})
