#!/usr/bin/env node

var Metalsmith = require('metalsmith'),
    markdown = require('metalsmith-markdown'),
    jadeTemplater = require('metalsmith-jade-templater'),
    browserSync = require('metalsmith-browser-sync'),
    drafts = require('metalsmith-drafts'),
    sass = require('metalsmith-sass'),
    collections = require('metalsmith-collections'),
    dynContentConverter = require('./dyn-content-converter'),
    filenames = require('metalsmith-filenames'),
    rename = require('metalsmith-rename'),
    yargs = require('yargs'),
    debug = require('debug')('claycarpenter.us');

// Define default values for CLI arguments.
var defaultArgValues = {
    // Whether to process draft posts.
    draft: false,

    // Whether to run browserSync server and watch for changes.
    watch: false,

    // Whether to clean the output directory before running the pipeline.
    // Disable this action when running BrowserSync as BrowserSync currently
    // seems to get confused when a directory it's watching is removed and
    // replaced.
    clean: false,

    // Default to either the environment port (for Cloud9 compatibility) or
    // the browserSync default port of 3000.
    port: process.env.PORT || 3000
};

// Require arguments parser and set default values.
var cliArgs = yargs.default(defaultArgValues).argv;

var jadeTemplaterOptions = {
    baseTemplatesDir: __dirname + '/templates'
};

var browserSyncOptions = {
    server: 'output',
    files: [
        'src/**/*.md', // Markdown Posts
        'src/**/*.yaml', // YAML Posts
        'templates/**/*.jade',   // Jade templates
        'src/**/*.scss', // Sass
        'static/**/*' // Static files
    ],
    port: cliArgs.port,
    index: 'index.html'
};

var conditionalBrowserSync = conditional(
        isWatchModeTest,
        browserSync(browserSyncOptions)
);

// Define the Metalsmith file processing pipeline.
var metalsmith = Metalsmith(__dirname)
    .source('./src/')
    .destination('./output/')

    // Conditionally enable cleaning (default false)
    .clean(cliArgs.clean)

    // Conditionally process drafts.
    .use(conditional(
        isDraftModeTest,
        drafts()
    ))

    .use(rename([[/\.yaml$/, '.html']]))

    // Capture HTML path.
    .use(filenames())

    .use(collectionsCleaner(['caseStudies', 'projects']))

    .use(collections())

    .use(collectionsSpy())

    .use(listPage)

    // Convert dynamic content.
    .use(dynContentConverter())

    .use(jadeTemplater(jadeTemplaterOptions))
    // .use(spy())
    .use(sass({outputStyle: 'expanded'}))

    // Conditionally watch and serve with BrowserSync.
    .use(conditionalBrowserSync);

metalsmith.build(function (err, files) {
    console.log('Building.');

    if (err) throw err;

    console.log('Build successful. Output files:', Object.keys(files));
});

function collectionsCleaner (collectionsKeys) {
  var keys;

  collectionsKeys = collectionsKeys || [];
  keys = typeof collectionsKeys === 'string' ? [collectionsKeys] : collectionsKeys;

  return function (files, metalsmith, done) {
    var metadata = metalsmith.metadata();

    keys.forEach(function (key) {
      delete metadata[key];
    });

    done();
  };
}

function listPage (files, metalsmith, done) {
  Object.keys(files).forEach(function (file) {
    var listInfo = files[file].list;

    if (listInfo && listInfo.key) {
      debug('collections list found');

      listInfo.items = metalsmith.metadata()[listInfo.key];
    }
  });

  done();
}

function spy () {
  return function (files, metalsmith, done) {
    debug(Object.keys(files));

    Object.keys(files).forEach(function (fileKey) {
      var file = files[fileKey];

      debug(file.contents.toString());
    });

    done();
  }
}

function collectionsSpy () {
  return function (files, metalsmith, done) {
    var metadata = metalsmith.metadata();

    debug('Case Studies:', metadata.caseStudies.length);
    debug(metadata.caseStudies);
    debug('Projects:', metadata.projects.length);
    debug(metadata.projects);

    done();
  }
}

function isDraftModeTest () {
    return !cliArgs.draft;
}

function isWatchModeTest () {
    return cliArgs.watch;
}

function conditional (testFunc, plugin) {
    return function (files, metalsmith, done) {
        var execute = testFunc();

        if (execute) {
            plugin(files, metalsmith, done);
        } else {
            done();
        }
    };
}
