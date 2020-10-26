const path = require("path");
// const ESLintPlugin = require("eslint-webpack-plugin");
const webpack = require("webpack");
// const PrettierPlugin = require("prettier-webpack-plugin");

module.exports = {
  entry: "./src/wasabee.js",
  // mode: "development",
   mode: "production",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    // new PrettierPlugin(),
    // new ESLintPlugin({ fix: true })
  ],
};
