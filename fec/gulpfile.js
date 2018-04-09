var _ = require('underscore');

var gulp = require('gulp');
var fs = require('fs');

var consolidate = require('gulp-consolidate');
var rename = require('gulp-rename');
var svgmin = require('gulp-svgmin');
var urlencode = require('gulp-css-urlencode-inline-svgs');
var sass = require('gulp-sass');
// minifies css
var cleanCSS = require('gulp-clean-css');
// Clears contents of directory
var clean = require('gulp-clean');
var rev = require('gulp-rev');
//var sourcemaps = require('gulp-sourcemaps');

// Consider using gulp-rev-delete-original later
gulp.task('clear-css-dir', function () {
    return gulp.src('./dist/fec/static/css', {read: false})
        .pipe(clean());
});

gulp.task('build-sass', ['clear-css-dir'], function() {
  return gulp.src('./fec/static/scss/*.scss')
    // compiles sass
    .pipe(sass().on('error', sass.logError))
    // minifies css
    .pipe(cleanCSS())
    // sourcemaps for local to back-trace source of scss
    //.pipe(gulpif(!production, sourcemaps.init()))*/
    //makes manifest sass (static asset revision) and puts in destination
    .pipe(rev())
    .pipe(gulp.dest('./dist/fec/static/css'))
    // writes manifest file into destination
    .pipe(rev.manifest('./dist/fec/static/css/rev-manifest-css.json'))
    .pipe(gulp.dest('.'));
    //.pipe(gulpif(!production, sourcemaps.write()))
});

// clear icons output folder to clean old icons
gulp.task('clean-output-icons', function () {
    return gulp.src('./fec/static/icons/output', {read: false})
        .pipe(clean());
});

gulp.task('minify-icons', ['clean-output-icons'], function() {
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
