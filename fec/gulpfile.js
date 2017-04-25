/* global process */

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var stringify = require('stringify');
var hbsfy = require('hbsfy');

var entries = [
  './fec/static/js/fec.js',
  './fec/static/js/contact-form.js',
  './fec/static/js/calendar-page.js',
  './fec/static/js/home.js'
];

var debug = !!process.env.FEC_CMS_DEBUG;

gulp.task('build-js', function () {
  return entries.forEach(function(entry) {
    return browserify(entry, {debug: debug})
      .transform({global: true}, stringify(['.html']))
      .transform({global: true}, hbsfy)
      .bundle()
      .pipe(source(entry))
      .pipe(gulp.dest('dist'));
  });
});
