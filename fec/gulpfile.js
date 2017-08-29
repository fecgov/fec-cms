/* global process */

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var stringify = require('stringify');
var hbsfy = require('hbsfy');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');

var production = ['stage', 'prod'].indexOf(process.env.FEC_WEB_ENVIRONMENT) !== -1;

var entries = [
  './fec/static/js/fec.js',
  './fec/static/js/contact-form.js',
  './fec/static/js/calendar-page.js',
  './fec/static/js/home.js',
  './fec/static/js/legal.js'
];

var debug = !!process.env.FEC_CMS_DEBUG;

gulp.task('build-js', function () {
  return entries.forEach(function(entry) {
    return browserify(entry, {debug: debug})
      .transform({global: true}, stringify(['.html']))
      .transform({global: true}, hbsfy)
      .bundle()
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(gulpif(production, uglify()))
      .pipe(gulp.dest('dist'));
  });
});
;
