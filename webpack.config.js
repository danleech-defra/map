var path = require('path')

module.exports = {
  mode: 'development', // 'development' or 'production',
  devtool: 'none', // 'source-map' or 'none',
  entry: {
    index: './app/assets/javascripts/pages/index'
  },
  output: {
    path: path.resolve(__dirname, 'public/javascripts'),
    publicPath: '/public/javascripts',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        exclude: /(docs|gulp|lib|node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  cache: false
}
