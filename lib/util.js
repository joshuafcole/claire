var path = require('path');

/*\
|*| Tests if the given path is a directory.
\*/
function isDirectory(filepath) {
  return filepath[filepath.length - 1] === path.sep;
}

/*\
|*| Gets the shared prefix of an array of strings.
|*| Neat trick -- Compare the first and last elements of a sorted array.
|*| Their shared prefix is guaranteed to be a prefix of all elements of the array.
\*/
function getSharedPrefix(items) {
  if(!items.length) {
    return '';
  }

  items = items.sort();
  var first = items[0];
  var last = items[items.length - 1];
  var i = 0;
  while(i < first.length && first.charAt(i) === last.charAt(i)) {
    i++;
  }
  return first.substring(0, i);
}

module.exports = {
  isDirectory: isDirectory,
  getSharedPrefix: getSharedPrefix
};
