/**
 *
 */
const fs = require('graceful-fs');
const gulp = require('gulp');
// minifies css
// Clears contents of directory
const clean = require('gulp-clean');
const consolidate = require('gulp-consolidate');
const urlencode = require('gulp-css-urlencode-inline-svgs');
const csso = require('gulp-csso');
//var sourcemaps = require('gulp-sourcemaps');
const purgecss = require('gulp-purgecss');
const rename = require('gulp-rename');
const rev = require('gulp-rev');
const sass = require('gulp-sass')(require('sass'));
const svgmin = require('gulp-svgmin');
const _ = require('underscore');

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
        .pipe(csso())
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

gulp.task('purgecss', () => {
  return gulp
    .src('./dist/fec/static/css/home-*.css')
    .pipe(
      purgecss({
        content: [
          './home/templates/purgecss-homepage/navs.html',
          './home/templates/purgecss-homepage/banners.html',
          './home/templates/purgecss-homepage/hero.html',
          './home/templates/purgecss-homepage/comissioners.html',
          './home/templates/purgecss-homepage/toggled.html',
          './home/templates/purgecss-homepage/full.html'
        ]
      })
    )
    .pipe(gulp.dest('./dist/fec/static/css'));
});

// The widgets are separate because we want them in a specific place with a predictable naming convention
gulp.task('clear-widgets-css-dir', function() {
  return gulp
    .src('./dist/fec/static/css/widgets', { read: false, allowEmpty: true })
    .pipe(clean());
});
gulp.task(
  'build-widgets-sass',
  gulp.series('clear-widgets-css-dir', function() {
    return (
      gulp
        .src('./fec/static/scss/widgets/*.scss')
        // compiles sass
        .pipe(sass().on('error', sass.logError))
        // minifies css
        .pipe(csso())
        // sourcemaps for local to back-trace source of scss
        //.pipe(gulpif(!production, sourcemaps.init()))*/
        //makes manifest sass (static asset revision) and puts in destination
        // .pipe(rev())
        .pipe(gulp.dest('./dist/fec/static/css/widgets'))
        // writes manifest file into destination
        // .pipe(rev.manifest('./dist/fec/static/css/rev-manifest-modules-css.json'))
        .pipe(gulp.dest('./dist/fec/static/css/widgets'))
    );
    //.pipe(gulpif(!production, sourcemaps.write()))
  })
);

// clear icons output folder to clean old icons
gulp.task('clean-output-icons', function() {
  // TODO: bring back read:false
  // return gulp.src('./fec/static/icons/output', { read: false, allowEmpty: true }).pipe(clean());
  return gulp.src('./fec/static/icons/output', { read: true, allowEmpty: true }).pipe(clean());
});

gulp.task(
  'minify-icons',
  gulp.series('clean-output-icons', function() {
    return gulp
      .src('./fec/static/icons/input/*.svg')
      .pipe(
        svgmin({
          multipass: true,
          plugins: [
            {
              name: 'removeViewBox',
              active: false
            },
            {
              name: 'removeAttrs',
              params: {
                attrs: '(fill|fill-rule)'
              }
            },
            'removeStyleElement',
            'removeTitle'
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
