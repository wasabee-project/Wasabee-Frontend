const path = require("path");
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = {
  entry: "./src/wasabee.js",
  mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new ESLintPlugin({
      fix: true,
    }),
  ],
};
