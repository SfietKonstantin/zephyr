var gulp = require("gulp");
var gutil = require("gulp-util");
var mocha = require("gulp-mocha");
var istanbul = require('gulp-istanbul');
var typings = require("gulp-typings");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var webpack = require("webpack");
var exec = require('child_process').exec;
var filter = require('gulp-filter');

var webpackClientConfig = {
    entry: {
        index: ['babel-polyfill', './src/client/index.tsx'],
        project: ['babel-polyfill', './src/client/project.tsx'],
        task: ['babel-polyfill', './src/client/task.tsx'],
        imports: ['babel-polyfill', './src/client/imports.tsx']
    },
    output: {
        library: "[name]",
        filename: './dist/public/[name].bundle.js'
    },
    resolve: {
        extensions: ['', '.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: 'babel-loader?presets[]=es2015!ts-loader' },
            { test: /\.tsx$/, loader: 'babel-loader?presets[]=es2015!ts-loader' }
        ]
    },
    externals: {
        "redux": "Redux",
        "react": "React",
        "react-dom": "ReactDOM",
        "react-redux": "ReactRedux",
        "react-bootstrap": "ReactBootstrap",
        "redux-thunk": "ReduxThunk"
    }
}

gulp.task("init:server:typings", function() {
    var stream = gulp.src("src/server/typings.json").pipe(typings());
    return stream;
})

gulp.task("init:client:typings", function() {
    var stream = gulp.src("src/client/typings.json").pipe(typings());
    return stream;
})

gulp.task("init:server:tests:typings", function() {
    var stream = gulp.src("src/tests/server/typings.json").pipe(typings());
    return stream;
})

gulp.task("init:client:tests:typings", function() {
    var stream = gulp.src("src/tests/client/typings.json").pipe(typings());
    return stream;
})

gulp.task("build:common", function() {
    var tsProject = ts.createProject("src/common/tsconfig.json");
    var result = gulp.src("src/common/**/*.ts").pipe(tsProject())
    return result.js.pipe(gulp.dest("dist/common")).pipe(gulp.dest("tests/common"));
})

gulp.task("watch:common", ["build:common"], function() {
    gulp.watch("src/common/**/*.ts", ["build:common"]);
})

gulp.task("build:server", function() {
    var tsProject = ts.createProject('src/server/tsconfig.json');
    var result = gulp.src("src/server/**/*.ts").pipe(tsProject())
    return result.js.pipe(gulp.dest("dist/server")).pipe(gulp.dest("tests/server"));
})

gulp.task("watch:server", ["build:server"], function() {
    gulp.watch("src/server/**/*.ts", ["build:server"]);
})

gulp.task("build:server:tests", function() {
    var tsProject = ts.createProject("src/tests/server/tsconfig.json");
    var result = gulp.src("src/tests/server/**/*.ts").pipe(tsProject())
    return result.js.pipe(gulp.dest("tests/tests/server"));
})

gulp.task("watch:server:tests", ["build:server:tests"], function() {
     gulp.watch("src/tests/server/**/*.ts", ["build:server:tests"]);
})

var webpackCompiler = webpack(webpackClientConfig);

gulp.task("build:client", function(callback) {
    webpackCompiler.run(function(err, stats) {
        if (err) {
            throw new gutil.PluginError("webpack", err);
        }
        gutil.log("[webpack]", stats.toString("normal"));
        callback();
    })
})


gulp.task("watch:client", ["build:client"], function() {
    gulp.watch("src/client/**/*.ts*", ["build:client"]);
})

gulp.task("build:client:ts", function() {
    var tsProject = ts.createProject("src/client/tsconfig.json");
    var result = gulp.src("src/client/**/*.ts*").pipe(tsProject())
    return result.js.pipe(gulp.dest("tests/client"));
})

gulp.task("watch:client:ts", ["build:client:ts"], function() {
    gulp.watch("src/client/**/*.ts*", ["build:client:ts"]);
})

gulp.task("build:client:tests", function() {
    var tsProject = ts.createProject("src/tests/client/tsconfig.json");
    var result = gulp.src("src/tests/client/**/*.ts*").pipe(tsProject())
    return result.js.pipe(gulp.dest("tests/tests/client"));
})

gulp.task("watch:client:tests", ["build:client:tests"], function() {
    gulp.watch("src/tests/client/**/*.ts*", ["build:client:tests"]);
})

gulp.task("test:pre", function () {
    // Removing entry points
    var f = filter([
        "**",
        "!tests/server/server.js",
        "!tests/server/core/tests/testdata.js",
        "!tests/server/routes/**/*.js",
        "!tests/client/index.js",
        "!tests/client/project.js",
        "!tests/client/task.js",
        "!tests/client/imports.js",
        "!tests/client/imports/primavera.js"
    ])
    return gulp.src(["tests/common/**/*.js", "tests/server/**/*.js", "tests/client/**/*.js"])
               .pipe(f)
               .pipe(istanbul({includeUntested: true}))
               .pipe(istanbul.hookRequire());
});

gulp.task("test", ["test:pre"], function() {
    return gulp.src("tests/tests/**/*.js")
               .pipe(mocha({reporter: "spec"}))
               .pipe(istanbul.writeReports({
                    dir: "./coverage",
                    reportOpts: {
                        dir: "./coverage"
                    },
                    reporters: ["html"]
                }))
})

gulp.task("serve", function() {
    exec("node dist/www");
})

gulp.task('tslint', () => {
    var f = filter(["**", "!**/index.d.ts"]);
    return gulp.src("src/**/*.ts*").pipe(f).pipe(tslint()).pipe(tslint.report({ formatter: 'prose', emitError: false }));
})

gulp.task("init", ["init:server:typings", "init:client:typings", "init:server:tests:typings", "init:client:tests:typings"])
gulp.task("default", ["build:common", "build:server", "build:server:tests", "build:client", "build:client:ts", "build:client:tests"])
gulp.task("watch", ["watch:common", "watch:server", "watch:server:tests", "watch:client", "watch:client:ts", "watch:client:tests"])
