var path = require('path')

console.log(path)
console.log(__dirname)

module.exports = {
  mode: 'development', // 'development' or 'production',
  devtool: 'source-map', // 'source-map' or 'none',
  entry: {
    index: './app/assets/javascripts/pages/index'
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
        use: {
          loader: 'babel-loader'
        }
      },
      {
        type: 'javascript/auto',
        test: /\.json$/,
        include: [
          path.join(__dirname, 'app/data')
        ],
        use: [
          {
            loader: 'json-loader'
          }
        ]
      }
    ]
  },
  cache: false
}
