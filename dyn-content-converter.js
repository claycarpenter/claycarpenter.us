
var marked = require('marked'),
    jade = require('jade');

module.exports = function () {
  function find(object, matches) {
    // Quit quickly if object isn't an object.
    if (typeof object !== 'object') return;

    if (object['_type'] === 'dyn' && object['_lang']) {
      matches.push(object);
    }

    Object.keys(object).forEach(function (key) {
      if (object.hasOwnProperty(key)) {
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
    console.log('dyn-content-converter: starting');

    Object.keys(files).forEach(function (file) {
      console.log('Investigating', file);

      var fileData = files[file];
      var matches = [];

      // Find all items with a _type of 'dyn'
      find(fileData, matches);
      console.log(matches.length, 'matches in file', file, '\n');

      // Print matches
      if (matches.length) console.log(matches);

      matches.forEach(function (item) {
        switch (item._lang.toLowerCase()) {
          case 'jade':
              console.log('Converting Jade');
              console.log('Source:', item._content);

              var template = jade.compile(item._content);
              item.content = template(fileData);
              
              console.log('Compiled:', item.content);

            break;

          case 'markdown':
              console.log('Converting Markdown');
              console.log('Source:', item._content);

              item.content = marked(item._content);
              console.log('Compiled:', item.content);
            break;

          case 'plaintext':
              console.log('Converting plaintext');
              console.log('Source:', item._content);

              item.content = '<p>' + item._content + '</p>';
              console.log('Compiled:', item.content);

            break;

          default:
            throw new Error('Unrecognized lang value: ' + item._lang);
        }
      });
    });

    done();
  }
};
