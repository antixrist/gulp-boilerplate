'use strict';

const $              = require('gulp-load-plugins')();
const _              = require('lodash');
const __             = require('../helpers');
const sass           = require('node-sass');
const path           = require('path');
const gulp           = require('gulp');
const isUrl          = require('is-url');
const config         = require('../../scaffront.config.js');
const extend         = require('extend');
const postcss        = require('postcss');
const resolve        = require('resolve');
const combiner       = require('stream-combiner2').obj;
const through        = require('through2').obj;
const applySourceMap = require('vinyl-sourcemaps-apply');
const resolver       = require('../resolver');

var assetResolverFactory = function assetResolverFactory (assetResolver) {
  if (typeof assetResolver != 'function') {
    assetResolver = __.noop;
  }

  return function (url, pathname, entryPathname) {
    var result = assetResolver(url, pathname, entryPathname);
    result = (result) ? result : url;
    result = (_.isPlainObject(result)) ? result : { url: result };

    Object.assign({
      url: '',
      src: '',
      dest: ''
    }, result);

    return result;
  };
};

function handleError (cb) {
  return function (error) {
    var errorOptions = { fileName: file.path };
    if (error.name === 'CssSyntaxError') {
      error = error.message + error.showSourceCode();
      errorOptions.showStack = false;
    }
    // Prevent stream’s unhandled exception from
    // being suppressed by Promise
    cb && setImmediate(function () {
      cb(new $.util.PluginError('gulp-postcss', error));
    });
  };
}

var streams = {};

streams.cssCompile = function cssCompile (options) {
  options = (_.isPlainObject(options)) ? options : {};

  var assetResolver = assetResolverFactory(options.assetResolver || null);

  return combiner(
    // пропускаем каждую точку входа через свой поток-трансформер
    through(function(file, enc, callback) {
      if (file.isNull()) {
        return cb(null, file);
      }

      if (file.isStream()) {
        return handleError(callback)('Streams are not supported!');
      }

      var assets = {};
      var opts = { map: false };

      if (file.sourceMap) {
        opts.map = { annotation: false };
      }

      opts.from = file.path;
      opts.to = opts.to || file.path;

      //var entryFilepath = path.join(file.base, file.name);
      var entryFilepath = file.path;

      postcss([
        // сперва сохраним все ассеты для точки входа
        //getTargetAssetsPlugin(assets, entryFilepath, entryFilepath, options),
        // импортируем вложенные css-ки
        require('postcss-import')({
          resolve: function (module, basedir, importOptions) {
            return resolver(module, basedir, {
              extensions: ['.css']
            });
          },
          // каждый импортированный файл тоже надо пропустить через postcss
          transform: function(css, filepath, _options) {
            return postcss([
              // теперь сохраним все ассеты из импортируемых файлов
              require('postcss-url')({
                url: function (url) {
                  var asset = assetResolver(url, filepath, entryFilepath);
                  if (asset.src && asset.dest) {
                    assets[asset.src] = asset.dest;
                  }

                  return asset.url || url;
                }
              })
            ])
              .process(css)
              .then(function(result) {
                return result.css;
              });
          }
        })
      ])
        .process(file.contents, opts)
        .then(function postcssHandleResult (result) {
          var map;
          var warnings = result.warnings().join('\n');

          file.contents = new Buffer(result.css);
          file.assets = assets;

          // Apply source map to the chain
          if (file.sourceMap) {
            map = result.map.toJSON();
            map.file = file.relative;
            map.sources = [].map.call(map.sources, function (source) {
              return path.join(path.dirname(file.relative), source);
            });
            applySourceMap(file, map);
          }

          if (warnings) {
            $.util.log('gulp-postcss:', file.relative + '\n' + warnings)
          }

          setImmediate(function () {
            callback(null, file)
          })
        }, handleError(callback));
    })
  );
};

streams.scssCompile = function scssCompile (options) {

  var assets = {};
  var assetResolver = assetResolverFactory(options.assetResolver || null);

  return combiner(
    through(function(file, enc, callback) {
      var __filepath = `$__filepath: unquote("${file.path}");`;
      var contents = file.contents.toString().replace(/(@import\b.+?;)/gm, `$1\n${__filepath}`);

      contents = `
        ${__filepath}
        @function url($url: null) {
          @return __url($__filepath, $url);
        }
        ${contents}
      `;

      file.contents = Buffer.from(contents);
      file.scssExt = path.extname(file.path);
      callback(null, file);
    }),
    $.sass({
      precision: 10,
      quiet: true,
      importer: require('node-sass-import-once'),
      importOnce: {
        index: true,
        css: true,
        bower: false,
        /**
         * @param {string} filepath
         * @param {string} contents
         * @returns {string}
         */
        transformContent: function (filepath, contents) {
          console.log('===== filepath', filepath);
          filepath = filepath.replace(/\\/g, '\\\\');

          var __filepath = `$__filepath: unquote("${filepath}");`;
          contents = contents.replace(/(@import\b.+?;)/gm, '$1\n'+ __filepath);

          return `${__filepath}\n${contents}`;
        }
      },
      functions: {
        '__url($filepath, $url)': function(filepath, url, done) {
          var entryFilepath = this.options.file;
          url               = url.getValue();
          filepath          = filepath.getValue();

          //console.log($.util.colors.blue('entryFilepath'), entryFilepath);
          //console.log($.util.colors.blue('filepath'), filepath);
          console.log($.util.colors.blue('url'), url);
          console.log('');

          //assets[entryFilepath] = assets[entryFilepath] || {};
          //var assetsStorage = assets[entryFilepath];
          //
          //if (!url) {
          //  url = '';
          //} else {
          //  url = getTargetAssetsUrl(assetsStorage, url, entryFilepath, baseFilepath, options);
          //}

          done(new sass.types.String('url("'+ url +'")'));
        }
      }
    }),
    through(function(file, enc, callback) {
      file.assets = assets[$.util.replaceExtension(file.path, file.scssExt)] || {};

      callback(null, file);
    })
  );
};

streams.dist = function (options) {
  options = (_.isPlainObject(options)) ? options : {};


};

module.exports = streams;
