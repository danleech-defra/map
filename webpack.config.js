var path = require('path')

console.log(path)
console.log(__dirname)

module.exports = {
  mode: 'development', // 'development' or 'production',
  devtool: 'source-map', // 'source-map' or 'none',
  entry: {
    index: './app/assets/javascripts/pages/index',
    draw: './app/assets/javascripts/pages/draw'
  },
  output: {
    path: path.join(__dirname, 'public/javascripts'),
    publicPath: '/public/javascripts',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.join(__dirname, 'app/assets/javascripts')
        ],
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  cache: false
}
