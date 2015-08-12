
var marked = require('marked'),
    jade = require('jade'),
    debug = require('debug')('dyn-content-converter');

module.exports = function () {
  // Ignored properties are a simplistic hack to prevent
  // circular reference-based errors.
  var ignoredProperties = [
    'previous',
    'next'
  ];

  function find(object, matches) {
    // Quit quickly if object isn't an object.
    if (typeof object !== 'object') return;

    if (object['_type'] === 'dyn' && object['_lang']) {
      matches.push(object);
    }

    Object.keys(object).forEach(function (key) {
      if (
        object.hasOwnProperty(key) &&
        ignoredProperties.indexOf(key) < 0
        ) {
        var value = object[key];

        if (value instanceof Array) {
          // Iterate over array members, continuing search.
          value.forEach(function (item) {
            find(item, matches);
          });
        } else if (value instanceof Object) {
          // Search child object.
          find(value, matches);
        }
      }
    });
  }

  return function (files, metalsmith, done) {
    debug('dyn-content-converter: starting');

    Object.keys(files).forEach(function (file) {
      debug('Investigating', file);

      var fileData = files[file];
      var matches = [];

      // Find all items with a _type of 'dyn'
      find(fileData, matches);
      debug(matches.length, 'matches in file', file, '\n');

      matches.forEach(function (item) {
        switch (item._lang.toLowerCase()) {
          case 'jade':
              var template = jade.compile(item._content);
              item.content = template(fileData);
              break;

          case 'markdown':
              item.content = marked(item._content);
              break;

          case 'plaintext':
              item.content = '<p>' + item._content + '</p>';
              break;

          default:
            throw new Error('Unrecognized lang value: ' + item._lang);
        }
      });
    });

    done();
  }
};
