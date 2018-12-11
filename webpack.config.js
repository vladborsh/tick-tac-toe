const path = require("path");
const yargs = require("yargs");

/* Configure HTMLWebpack plugin */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
    template: __dirname + "/src/index.html",
    filename: "index.html",
    inject: "body"
});

/* Configure BrowserSync */
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const BrowserSyncPluginConfig = new BrowserSyncPlugin({
    host: 'localhost',
    port: 3000,
    server: { baseDir: ['dist'] }
}, config = {
    reload: true
})

/* Configure ProgressBar */
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const ProgressBarPluginConfig = new ProgressBarPlugin() 

var argv = yargs.boolean("disable-bs").argv;

module.exports = {
    entry: "./src/index.ts",
    devtool: "source-map",
    mode: 'development',
    module: {
        rules: [
        {
            test: /\.ts?$/,
            use: 'awesome-typescript-loader'
        }
        ]
    },
    watch: false,
    plugins: (function(argv) {
        var plugins = [];
        if (!argv.disableBs) {
        plugins.push(HTMLWebpackPluginConfig, BrowserSyncPluginConfig, ProgressBarPluginConfig);
        }
        return plugins;
    })(argv),
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        modules: [path.resolve(__dirname, "src"), "node_modules"]
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist")
    }
};
