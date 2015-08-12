#!/usr/bin/env node

var Metalsmith = require('metalsmith'),
    markdown = require('metalsmith-markdown'),
    jadeTemplater = require('metalsmith-jade-templater'),
    browserSync = require('metalsmith-browser-sync'),
    drafts = require('metalsmith-drafts'),
    sass = require('metalsmith-sass'),
    static = require('metalsmith-static'),
    collections = require('metalsmith-collections'),
    dynContentConverter = require('./dyn-content-converter'),
    yargs = require('yargs');

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

    .use(yamlToHtmlRenamer())

    // Capture HTML path.
    .use(updatePaths())

    .use(collectionsCleaner(['caseStudies', 'projects']))

    .use(collections(
    //   {
    //   caseStudies: {
    //     pattern: 'case-studies/*.html'
    //   },
    //   projects: {
    //     pattern: 'projects/*.html'
    //   }
    // }
    ))

    .use(collectionsSpy())

    .use(listPage)

    // Convert dynamic content.
    .use(dynContentConverter())

    .use(jadeTemplater(jadeTemplaterOptions))
    // .use(spy())
    .use(sass({outputStyle: 'expanded'}))

    // Conditionally watch and serve with BrowserSync.
    .use(conditionalBrowserSync)

    // .use(static({
    //   src:'static',
    //   dest:'.'
    // }));


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
      console.log('collections list found');

      listInfo.items = metalsmith.metadata()[listInfo.key];

    }
  });

  done();
}

function spy () {
  return function (files, metalsmith, done) {
    console.log(Object.keys(files));

    Object.keys(files).forEach(function (fileKey) {
      var file = files[fileKey];

      // console.log(Object.keys(file));
      // console.log(JSON.stringify(file));
      console.log(file.contents.toString());
    });

    done();
  }
}

function collectionsSpy () {
  return function (files, metalsmith, done) {
    var metadata = metalsmith.metadata();

    console.log('Case Studies:', metadata.caseStudies.length);
    console.log(metadata.caseStudies);
    console.log('Projects:', metadata.projects.length);
    console.log(metadata.projects);

    done();
  }
}

function yamlToHtmlRenamer () {
  var yamlSearchRegex = /\.yaml$/;

  return function (files, metalsmith, done) {

    var basename = require('path').basename,
        extname = require('path').extname;

    Object.keys(files).forEach(function (file) {
      console.log('Existing key:', file);


      if (yamlSearchRegex.test(file)) {
        var htmlFilePath = file.replace(yamlSearchRegex, '.html');

        var fileData = files[file];

        delete files[file];
        files[htmlFilePath] = fileData;
        console.log('New key:', htmlFilePath);
      }
    });

    done();
  };
}

function updatePaths () {
  return function (files, metalsmith, done) {
    Object.keys(files).forEach(function (fileKey) {
      files[fileKey].path = fileKey;
    });

    done();
  };
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
