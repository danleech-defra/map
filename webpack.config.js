var path = require('path')

module.exports = {
  mode: 'development', // 'development' or 'production',
  devtool: 'source-map', // 'source-map' or 'none',
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
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
}
