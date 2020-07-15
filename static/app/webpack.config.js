const path = require('path');

module.exports = {
  entry: "./src/wasabee.js",
  mode: "development",
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
	loader: 'eslint-loader',
	options: {
	  fix: true,
	},
      },
    ],
  },
};
