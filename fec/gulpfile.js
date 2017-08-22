/* global require, process */

var _ = require('underscore');

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var stringify = require('stringify');
var hbsfy = require('hbsfy');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var fs = require('fs');
var path = require('path');

var consolidate = require('gulp-consolidate');
var rename = require('gulp-rename');
var svgmin = require('gulp-svgmin');
var urlencode = require('gulp-css-urlencode-inline-svgs');

// var rev = require('gulp-rev');

var production = ['stage', 'prod'].indexOf(process.env.FEC_WEB_ENVIRONMENT) !== -1;
var debug = !!process.env.FEC_CMS_DEBUG;


gulp.task('build-sass', function() {
  return gulp.src('./fec/static/scss/*.scss')
    .pipe(sass({
      includePaths: Array.prototype.concat(
        './fec/static/scss',
        '../node_modules'
      )
    }).on('error', sass.logError))
    // .pipe(rev())
    .pipe(cleanCSS())
    .pipe(gulp.dest('./dist/fec/static/styles/'));
    // .pipe(rev.manifest({merge: true}))
    // .pipe(gulp.dest('./dist/fec/static/styles/'));
});


var entries = _(fs.readdirSync('./fec/static/js/pages'))
  .chain()
  .filter(function(filename) {
    return /.js$/.test(filename);
  })
  .map(function(each) {
    return path.join('./fec/static/js/pages', each);
  })
  .value();
entries.unshift('./fec/static/js/init.js');
entries.unshift('./fec/static/js/data-init.js');

gulp.task('build-js', function () {
  return entries.forEach(function(entry) {
    return browserify(entry, {debug: debug})
      .transform({global: true}, stringify(['.html']))
      .transform({global: true}, hbsfy)
      .bundle()
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(gulpif(production, uglify({
        mangle: {
          reserved: []
        },
        output: {
          beautify: false,
          comments: false,
          max_line_len: 320000000
        }
      })))
      .pipe(gulp.dest('dist'));
  });
});

gulp.task('build-legal', function() {
  browserify('./fec/static/js/legal/LegalApp.js',
    {
      debug: debug
    })
    .transform('babelify', {
      presets: ['latest', 'react']
    })
    .bundle()
    .pipe(fs.createWriteStream('./fec/static/js/legalApp.js'));
});

gulp.task('minify-icons', function() {
  return gulp.src('./fec/static/icons/input/*.svg')
    .pipe(svgmin({
      plugins: [
        {
          removeAttrs: {attrs: '(fill|fill-rule)'}
        },
        {
          removeStyleElement: true,
        },
        {
          removeTitle: true
        }
      ]
    }))
    .pipe(gulp.dest('./fec/static/icons/output', {overwrite: true}));
});

gulp.task('consolidate-icons', function() {
  function getSVGs() {
    return _(fs.readdirSync('./fec/static/icons/output/'))
      .chain()
      .filter(function (filename) {
        return filename.substr(-4) === '.svg';
      }).map(function (filename) {
        return {
          name: filename.split('.')[0],
          content: fs.readFileSync('./fec/static/icons/output/' + filename, 'utf8')
        };
      }).value();
  }

  var svgs = getSVGs();
  var data = {
    icons: svgs
  };

  return gulp.src('./fec/static/icons/icon-template.scss')
    .pipe(consolidate('underscore', data))
    .pipe(rename({basename: '_icon-variables'}))
    .pipe(urlencode())
    .pipe(gulp.dest('./fec/static/scss/'));
});
