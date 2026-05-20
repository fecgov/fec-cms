/**
 *
 */
import fs from 'graceful-fs';
import gulp from 'gulp';
import clean from 'gulp-clean';
import consolidate from 'gulp-consolidate';
import urlencode from 'gulp-css-urlencode-inline-svgs';
import csso from 'gulp-csso';
import purgecss from 'gulp-purgecss';
import rename from 'gulp-rename';
import rev from 'gulp-rev';
import gulpSass from 'gulp-sass';
import svgmin from 'gulp-svgmin';
import webp from 'gulp-webp';
import * as dartSass from 'sass';
import _ from 'underscore'; // TODO: remove single Underscore dependency

const sass = gulpSass(dartSass);
const { series, src, task } = gulp;

/**
 * Converts selected files to the webp file format
 */
function _buildWebpFiles() {
  return src([
    './fec/static/img/*hero*.*', // All files with 'hero' in the name
    './fec/static/img/map-election-search-default.png',
    './fec/static/img/fec-office.jpg'
    ])
    .pipe(webp())
    .pipe(gulp.dest('./dist/fec/static/img/'));
}

/**
 * Empties ./dist/fec/static/css
 */
function _clearDirectory() {
  return src('./dist/fec/static/css', { read: false, allowEmpty: true })
    .pipe(clean());
}

/**
 * Empties ./dist/fec/static/css/widgets
 */
function _clearWidgetsDirectory() {
  return src('./dist/fec/static/css/widgets', { read: false, allowEmpty: true })
    .pipe(clean());
}

/**
 * Builds the main css files and creates the css manifest
 */
function _compile() {
  return src('./fec/static/scss/*.scss')
    // compiles sass
    .pipe(sass().on('error', sass.logError))
    // minifies css
    .pipe(csso())
    // sourcemaps for local to back-trace source of scss
    //.pipe(gulpif(!production, sourcemaps.init())
    //makes manifest sass (static asset revision) and puts in destination
    .pipe(rev())
    .pipe(gulp.dest('./dist/fec/static/css'))
    // writes manifest file into destination
    .pipe(rev.manifest('./dist/fec/static/css/rev-manifest-css.json'))
    .pipe(gulp.dest('.'));
}

/**
 * Builds the css files for the widgets and creates the widgets css manifest
 */
function _compileWidgets() {
  return src('./fec/static/scss/widgets/*.scss')
  // compiles sass
  .pipe(sass().on('error', sass.logError))
  // minifies css
  .pipe(csso())
  // sourcemaps for local to back-trace source of scss
  //.pipe(gulpif(!production, sourcemaps.init()))
  //makes manifest sass (static asset revision) and puts in destination
  // .pipe(rev())
  .pipe(gulp.dest('./dist/fec/static/css/widgets'))
  // writes manifest file into destination
  // .pipe(rev.manifest('./dist/fec/static/css/rev-manifest-modules-css.json'))
  .pipe(gulp.dest('./dist/fec/static/css/widgets'));
}

/**
* Takes the SVG files in fec/fec/static/icons/output/ and
*  - url-encodes them into data:image values for css (e.g. converting spaces to %20)
*  - builds _icon-variables.scss from those values, based on icon-template.scss
* Prev: minify-icons should be called before consolidate-icons
* Next: build-sass should be called after consolidate-icons
*/
function _consolidateIcons() {
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

  return src('./fec/static/icons/icon-template.scss')
    .pipe(consolidate('underscore', data))
    .pipe(rename({ basename: '_icon-variables' }))
    .pipe(urlencode())
    .pipe(gulp.dest('./fec/static/scss/'));
}

/**
 * 1. Empties fec/fec/static/icons/output/
 * 2. Takes the SVG files in fec/fec/static/icons/input/ and minifies them to fec/fec/static/icons/output/,
 *    removing bulk like <title> but also every element's fill and fill-rule parameters, and
 *    simplifies and makes values uniform (e.g. '#000000' to "#000")
 * Next: consolidate-icons is usually called next
 * Next: build-sass should be called after consolidate-icons
 * NOTE:
 * The files in icons/input/ should be simple because sass is going to add a fill color to the root <svg>.
 * Because of becoming <svg fill="{color}">, any strokes, masks, etc may break.
 */
function _minifyIcons() {
  return src('./fec/static/icons/input/*.svg')
    .pipe(
      svgmin({
        multipass: true,
        plugins: [
          { removeViewBox: false },
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
}

/**
 * _purgecss prunes the homepage css,
 * removing everything that isn't represented in the purgecss-homepage/*.html files
 */
function _purgecss() {
  return src('./dist/fec/static/css/home-*.css')
    .pipe(
      purgecss({
        content: [
          './home/templates/purgecss-homepage/navs.html',
          './home/templates/purgecss-homepage/banners.html',
          './home/templates/purgecss-homepage/hero.html',
          './home/templates/purgecss-homepage/commissioners.html',
          './home/templates/purgecss-homepage/toggled.html',
          './home/templates/purgecss-homepage/full.html'
        ]
      })
    )
    .pipe(gulp.dest('./dist/fec/static/css'));
}

/**
 * Register the events so package.json can call them with npm run
 */
task('build-sass', series(_clearDirectory, _compile));
task('build-webp-files', _buildWebpFiles);
task('build-widgets-sass', series(_clearWidgetsDirectory, _compileWidgets));
task('consolidate-icons', _consolidateIcons);
task('minify-icons', _minifyIcons);
task('purgecss', _purgecss);
