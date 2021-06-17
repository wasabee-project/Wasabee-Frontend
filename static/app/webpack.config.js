const path = require("path");
// const ESLintPlugin = require("eslint-webpack-plugin");
const webpack = require("webpack");
// const PrettierPlugin = require("prettier-webpack-plugin");
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  entry: "./src/wasabee.js",
  // mode: "development",
   mode: "production",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      }
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new VueLoaderPlugin(),
    // new PrettierPlugin(),
    // new ESLintPlugin({ fix: true })
  ],
};
