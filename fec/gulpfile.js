var _ = require('underscore');

var gulp = require('gulp');
var fs = require('fs');

var consolidate = require('gulp-consolidate');
var rename = require('gulp-rename');
var svgmin = require('gulp-svgmin');
var urlencode = require('gulp-css-urlencode-inline-svgs');

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
