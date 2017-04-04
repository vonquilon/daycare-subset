var fs = require('fs');
var path = require('path');
var del = require('del');

var gulp = require('gulp');

var inject = require('gulp-inject');
var md5 = require('gulp-md5');
var filter = require('gulp-filter');
var order = require('gulp-order');
var rename = require('gulp-rename');
var mainBowerFiles = require('main-bower-files');
var es = require('event-stream');
var series = require('stream-series');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var runSequence = require('run-sequence');

var pkg = require('./package.json');

// change working directory to web
process.chdir('./web')

var assetsPath = 'assets/';
var tempPath = 'temp/';
var bowerOptions = {
    paths: '..'
};

var allCSSFiles = [!assetsPath+'dist', assetsPath+'css/**/*.css', assetsPath+'plugins/**/*.css'];
var cssFilter = '**/*.css';
var cssOrder = order([
    assetsPath+'css/bootstrap.min.css',
    assetsPath+'plugins/**',
    'vendor/**',
    assetsPath+'css/plugins/**',
    assetsPath+'css/themes/**',
    assetsPath+'css/custom/theme-custom.css',
    !assetsPath+'css/custom/**/custom.css',
    assetsPath+'css/index.css'
]);

var allJSFiles = ['*.js', !assetsPath+'dist', !assetsPath+'plugins/jquery.js', assetsPath+'**/*.js', 'controls/**/*.js', 'directives/**/*.js', 'services/**/*.js'];
var jsFilter = '**/*.js';
var jsOrder = order([
    assetsPath+'plugins/jquery.js',
    'vendor/js/angular.js',
    'vendor/js/vs-google-autocomplete.js',
    'vendor/js/d3.js',
    'vendor/js/nv.d3.js',
    'vendor/**',
    'app.js',
    'services/**',
    'controls/**',
    'directives/**',
    assetsPath+'plugins/**',
    assetsPath+'js/*',
    assetsPath+'js/plugins/**',
    assetsPath+'js/languages/**',
    assetsPath+'theme/js/**',
    assetsPath+'js/custom/**'
]);

gulp.task('inject:dev', function() {
    return gulp.src('./index_html/index.html')
        .pipe(gulp.dest('.'))
        .pipe(inject(gulp.src('app.js', {read:false}), {name:'app',relative:true}))
        .pipe(inject(gulp.src('./services/**/*.js', {read:false}), {name:'services',relative:true}))
        .pipe(inject(gulp.src('./controls/**/*.js', {read:false}), {name:'controls',relative:true}))
        .pipe(inject(gulp.src('./directives/**/*.js', {read:false}), {name:'directives',relative:true}))
        .pipe(inject(gulp.src('./assets/js/custom/index.js', {read:false}), {name:'index',relative:true}))
        .pipe(gulp.dest('.'));
});

gulp.task('copy:temp', function() {
    var bowerCSS = gulp.src(mainBowerFiles(bowerOptions))
        .pipe(filter(cssFilter))
        .pipe(gulp.dest(tempPath+'vendor/css'));

    var cssFiles = gulp.src(allCSSFiles, {base:assetsPath})
        .pipe(gulp.dest(tempPath+'assets'));

    var bowerJS = gulp.src(mainBowerFiles(bowerOptions))
        .pipe(filter([jsFilter, '!**/jquery.js']))
        .pipe(uglify())
        .pipe(gulp.dest(tempPath+'vendor/js'));

    var jsFiles = gulp.src(allJSFiles, {base:'.'})
        .pipe(gulp.dest(tempPath));

    var jqueryFile = gulp.src(assetsPath+'plugins/jquery.js', {base:'.'})
        .pipe(uglify())
        .pipe(gulp.dest(tempPath));

    return es.merge(bowerCSS, cssFiles, bowerJS, jsFiles, jqueryFile);
});

gulp.task('hash:prod', function() {
    var minifiyCSS = cleanCSS({compatibility: 'ie8'});

    var cssStream = gulp.src(tempPath+'**')
        .pipe(filter(cssFilter))
        .pipe(cssOrder)
        .pipe(concat('main.min.css'))
        .pipe(minifiyCSS)
        .pipe(md5())
        .pipe(gulp.dest(assetsPath+'dist'));

    var jsStream = gulp.src(tempPath+'**')
        .pipe(filter(jsFilter))
        .pipe(jsOrder)
        .pipe(concat('main.min.js'))
        .pipe(md5())
        .pipe(gulp.dest(assetsPath+'dist'));

    return gulp.src('index_html/index.prod.html')
        .pipe(rename({
            basename: 'index'
        }))
        .pipe(gulp.dest('.'))
        .pipe(inject(es.merge(cssStream,jsStream), {relative:true}))
        .pipe(gulp.dest('.'));
});

gulp.task('clean:temp', function() {
    return del.sync(['temp/**']);
});

gulp.task('clean:dist', function() {
    return del.sync([assetsPath+'dist/**', 'jsver/**']);
})

gulp.task('inject:prod', function(cb) {
    runSequence(['clean:dist','copy:temp'], 'hash:prod', 'clean:temp', cb);
});
