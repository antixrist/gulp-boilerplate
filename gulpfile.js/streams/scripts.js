'use strict';

const $        = require('gulp-load-plugins')();
const _        = require('lodash');
const __       = require('../helpers');
const path     = require('path');
const envs     = require('../../scaffront.env.js');
const slice    = require('sliced');
const combiner = require('stream-combiner2').obj;

const named         = require('vinyl-named');
const webpackStream = require('webpack-stream');
const webpack       = webpackStream.webpack;

let streams = {};
let defaults = {
  output: {
    filename: '[name].js',
    library: '[name]',
    chunkFilename: '[id].js'
  },

  resolve: {
    modulesDirectories: ['node_modules', 'bower_components'],
    extensions: ['', '.js']
  },

  devtool: '#inline-source-map',

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015'],
        plugins: [
          ['transform-runtime', {
            "polyfill": false,
            "regenerator": true
          }]
        ]
      }
    }]
  },
  resolveLoader: {
    modulesDirectories: ['node_modules'],
    moduleTemplates: ['*-loader', '*'],
    extensions: ['', '.js']
  }
};

streams.webpack = function (options, cb) {
  let args = slice(arguments);

  if (args.length == 1 && _.isFunction(args[0])) {
    cb = options;
  }

  options = (_.isPlainObject(options)) ? _.defaultsDeep(args[0], defaults) : _.defaults({}, defaults);
  cb = (_.isFunction(cb)) ? cb : __.noop;

  return combiner(
    $.plumber({
      errorHandler: $.notify.onError(err => ({
        title:   'Webpack',
        message: err.message
      }))
    }),
    named(),
    webpackStream(options, null, cb)
  );
};


module.exports = streams;