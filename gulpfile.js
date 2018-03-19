/*
    
    I tried to simplify things, but I might have introduced more complexity than necessary.
    Send a pull request for improvements please. Thank you.

    Make sure you have gulp globally installed via
    npm install -g gulp
 */

"use strict";

var gulp        = require('gulp');
var sass        = require('gulp-ruby-sass');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var del         = require('del');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var sourcemaps  = require('gulp-sourcemaps');
var babelify    = require('babelify');
var watchify    = require('watchify');
var streamify   = require('gulp-streamify');
var server      = require('gulp-server-livereload');
var Q           = require('q');


/**
 * Paths
 */
var assets = [
    'src/img/*', 
    'src/js/vendor/*',
    'src/index.html'
];

var paths = {
    npm: 'node_modules/',
    dist: 'dist/',
    css: {
        base: 'src/css/',
        vendor: 'src/css/vendor/',
        dist: 'dist/css/'
    },
    js: {
        base: 'src/js/',
        vendor: 'src/js/vendor/',
        dist: 'dist/js/'
    },
    staticFiles: {
        images: 'src/img/',
        index: 'src/index.html'
    }
}

var appJs = {
    source: 'app.es6',
    name: 'app.js'
}

var vendorJs = [
    paths.js.vendor + 'to_bundle/*.js',
    paths.npm + 'jquery/dist/jquery.js',
    paths.npm + 'fastclick/lib/fastclick.js'
];

var dependencies = [
  
];


// Regular functions - used to compose the gulp tasks later
function taskWatchAll() {
    gulp.watch(paths.js.base + '**/*', ['browserify-watch']);
    taskWatchSassAndStatic();
}

function taskWatchSassAndStatic() {
    gulp.watch(paths.css.base + '**/*', ['sass']);
    gulp.watch(paths.staticFiles.index, ['copy-assets']);
    gulp.watch(paths.staticFiles.images + '**/*', ['copy-assets']);
}

function taskStartWebServer() {
    return gulp.src('dist/')
        .pipe(server({
            livereload: true,
            open: true,
            port: 8989
        }));
}

function taskSass() {
    return sass(paths.css.base + 'main.scss', { style: 'compressed', sourcemap: true })
        .on('error', sass.logError)
        .pipe(rename('styles.css'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.css.dist));
}

function taskJsBundleVendor() {
    return gulp.src(vendorJs)
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.js.dist));
}

function taskJsBundleVendorAll() {
    return browserify(paths.js.base + appJs.source)
        .require(dependencies)
        .transform(babelify, {presets: ['es2015']})
        .bundle()
        .pipe(source('vendor.app.js'))
        .pipe(streamify(uglify({ mangle: false })))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.js.dist))
}

function taskCopyAssets() {
    var deferred = Q.defer();

    gulp.src(assets, { base: './src/'})
        .on('end', function(){ 
            deferred.resolve();
        })
        .pipe(gulp.dest(paths.dist));

    return deferred.promise;
}

function taskCleanAll(cb) {
    if (cb) {
        return del(['dist'], cb);
    }
    return del.sync(['dist']);
}

function taskWatchJs(cb) {
    return taskCompile(cb, true);
}

function taskCompile(cb, doWatch) {
    // debug: true will append a source map inline into the app.js file
    doWatch = !!doWatch;
    var bundler;

    if (doWatch) {
        bundler = watchify(browserify(paths.js.base + appJs.source, { debug: true }));
    } else {
        bundler = browserify(paths.js.base + appJs.source, { debug: true });
    }

    // bundler.external(dependencies);
    bundler.transform(babelify, {presets: ['es2015']});

    function rebundle() {
        
        function onEnd() {
            if (cb) {
                cb();
            }
        }

        function onError(err) {
            console.error("Bundle errored out. Please check.");
            console.error(err.message);
            // this.emit('end');
        }

        return bundler
            .bundle()
            .on('error', onError)
            .on('end', onEnd)
            .pipe(source(appJs.name))
            .pipe(buffer())
            .pipe(gulp.dest(paths.js.dist))
            .pipe(rename({ suffix: '.min' }))
            .pipe(sourcemaps.init({ loadMaps: true }))
            // .pipe(uglify({ mangle: false }))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(paths.js.dist));
    }

    if (doWatch) {
        bundler.on('update', rebundle);
    }

    return rebundle();
}

function taskBuildAll(cb) {

    function copyAssetsLast() {
        var ccb = cb;

        taskCopyAssets().then(function(){
            if (ccb) {
                ccb();
            }    
        });
    }

    taskCleanAll();

    taskSass();

    taskJsBundleVendor();
    taskJsBundleVendorAll();

    taskCompile(copyAssetsLast);
}

function taskRun(cb) {

    var deferred = Q.defer();

    function after() {
        taskWatchJs();
        taskWatchSassAndStatic();
        taskStartWebServer();
        // we never call resolve on purpose
    }

    taskBuildAll(after);

    return deferred.promise;
}

// Gulp tasks

gulp.task('build', taskBuildAll);
gulp.task('browserify', taskCompile);
gulp.task('browserify-watch', taskWatchJs);
gulp.task('browserify-vendor', taskJsBundleVendorAll);
gulp.task('clean', taskCleanAll);
gulp.task('copy-assets', taskCopyAssets);
gulp.task('default', taskRun);
gulp.task('js-vendor', taskJsBundleVendor);
gulp.task('sass', taskSass);
gulp.task('watch', taskWatchAll);
gulp.task('webserver', taskStartWebServer);
