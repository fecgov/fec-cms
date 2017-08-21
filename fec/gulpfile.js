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
// var rename = require('gulp-rename');
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
      .pipe(gulpif(production, uglify()))
      .pipe(gulp.dest('dist'));
  });
});
