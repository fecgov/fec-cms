/* global require */

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('gulp-buffer');

var entry = './fec/static/js/fec.js';

gulp.task('build-js', function () {
  return browserify(entry)
    .bundle()
    .pipe(source(entry))
    .pipe(buffer())
    .pipe(gulp.dest('dist'));
});
