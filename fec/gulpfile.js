const _ = require('underscore');

const gulp = require('gulp');
const fs = require('fs');

const consolidate = require('gulp-consolidate');
const rename = require('gulp-rename');
const svgmin = require('gulp-svgmin');
const urlencode = require('gulp-css-urlencode-inline-svgs');
const sass = require('gulp-sass');
// minifies css
const cleanCSS = require('gulp-clean-css');
// Clears contents of directory
const clean = require('gulp-clean');
const rev = require('gulp-rev');
//var sourcemaps = require('gulp-sourcemaps');

// Consider using gulp-rev-delete-original later
gulp.task('clear-css-dir', function() {
  return gulp
    .src('./dist/fec/static/css', { read: false, allowEmpty: true })
    .pipe(clean());
});

gulp.task(
  'build-sass',
  gulp.series('clear-css-dir', function() {
    return (
      gulp
        .src('./fec/static/scss/*.scss')
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
        .pipe(gulp.dest('.'))
    );
    //.pipe(gulpif(!production, sourcemaps.write()))
  })
);

// The modules are separate because we want them in a specific place with a predictable naming convention
gulp.task('clear-modules-css-dir', function() {
  return gulp
    .src('./dist/fec/static/css/modules', { read: false, allowEmpty: true })
    .pipe(clean());
});
gulp.task(
  'build-modules-sass',
  gulp.series('clear-modules-css-dir', function() {
    return (
      gulp
        .src('./fec/static/scss/modules/*.scss')
        // compiles sass
        .pipe(sass().on('error', sass.logError))
        // minifies css
        .pipe(cleanCSS())
        // sourcemaps for local to back-trace source of scss
        //.pipe(gulpif(!production, sourcemaps.init()))*/
        //makes manifest sass (static asset revision) and puts in destination
        // .pipe(rev())
        .pipe(gulp.dest('./dist/fec/static/css/modules'))
        // writes manifest file into destination
        // .pipe(rev.manifest('./dist/fec/static/css/rev-manifest-modules-css.json'))
        .pipe(gulp.dest('./dist/fec/static/css/modules'))
    );
    //.pipe(gulpif(!production, sourcemaps.write()))
  })
);

// clear icons output folder to clean old icons
gulp.task('clean-output-icons', function() {
  return gulp.src('./fec/static/icons/output', { read: false }).pipe(clean());
});

gulp.task(
  'minify-icons',
  gulp.series('clean-output-icons', function() {
    return gulp
      .src('./fec/static/icons/input/*.svg')
      .pipe(
        svgmin({
          plugins: [
            {
              removeAttrs: { attrs: '(fill|fill-rule)' }
            },
            {
              removeStyleElement: true
            },
            {
              removeTitle: true
            }
          ]
        })
      )
      .pipe(gulp.dest('./fec/static/icons/output', { overwrite: true }));
  })
);

gulp.task('consolidate-icons', function() {
  function getSVGs() {
    return _(fs.readdirSync('./fec/static/icons/output/'))
      .chain()
      .filter(function(filename) {
        return filename.substr(-4) === '.svg';
      })
      .map(function(filename) {
        return {
          name: filename.split('.')[0],
          content: fs.readFileSync(
            './fec/static/icons/output/' + filename,
            'utf8'
          )
        };
      })
      .value();
  }

  const svgs = getSVGs();
  const data = {
    icons: svgs
  };

  return gulp
    .src('./fec/static/icons/icon-template.scss')
    .pipe(consolidate('underscore', data))
    .pipe(rename({ basename: '_icon-variables' }))
    .pipe(urlencode())
    .pipe(gulp.dest('./fec/static/scss/'));
});
