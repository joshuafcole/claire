var _ = require('underscore');
_.str = require('underscore.string');
var fs = require('fs');
var path = require('path');
var findit = require('findit');
var fuzzy = require('fuzzy');

var util = require('./lib/util');

var claire = module.exports = {
  defaultFilters: ['.git']
};

claire.getUnion = util.getUnion;
claire.expandPath = util.expandPath;

/*\
|*| Infers the search root experimentally.
\*/
function getRoot(term, opts) {
  var parts = term.split(path.sep);
  var root = parts.shift() || path.sep; // Windows support, I hope?

  // Last section treated as term if not suffixed by path separator.
  for(var i = 0; i < parts.length - 1; i++) {
    var tryPath = path.join(root, parts[i]);
    try {
      var stat = fs.statSync(tryPath);
      if(!stat.isDirectory()) {
        break;
      }
    } catch (e) {
      if(e.code === 'ENOENT') {
        break;
      }
      throw e;
    }
    root = tryPath;
  }
  root = util.normalizePath(root);
  return root;
}
claire.getRoot = getRoot;

/*\
|*| Calculates the relative search term based on the given root.
\*/
function getRelativeTerm(term, root) {
  term = term.slice(root.length);
  return _.str.trim(term, path.sep);
}
claire.getRelativeTerm = getRelativeTerm;

/*\
|*| Shortens directories of matches by rendering relative to the search root.
\*/
function shorten(term, match, opts) {
  var matchOpts = {pre: opts.pre, post: opts.post};
  var shared = util.getUnion(term, match.dir);
  var cutoff = shared.lastIndexOf(path.sep) + 1;
  match.dir = match.dir.slice(cutoff);
  match.shared = shared.slice(0, cutoff);

  var filepath = path.join(match.dir, match.file);
  term = getRelativeTerm(term, match.shared);

  var relativeMatch = fuzzy.match(term, filepath, matchOpts);
  if(relativeMatch) {
    match.rendered = relativeMatch.rendered;
  }
}

/*\
|*| Finds and scores all matches for the given search term.
|*| opts:
|*|   short:boolean = false // Render matches relative to search root instead of absolute.
|*|   pre/post:any = undefined // Passed through to the fuzzy module, wraps matching characters when rendering matches.
\*/
function find(term, callback, opts) {
  term = util.expandPath(term);
  opts = opts || {};
  var skipDirs = opts.filters || claire.defaultFilters;
  var matches = [];

  var root = getRoot(term, opts);
  var finder = findit(root);
  var matchOpts = {pre: opts.pre, post: opts.post};

  var searchDepth = util.getPathDepth(getRelativeTerm(term, root));
  finder.on('directory', function(dir, stat, stop) {
    if(_.contains(skipDirs, path.basename(dir))) {
      return stop();
    }

    var match = fuzzy.match(term, dir, matchOpts);
    if(match) {
      match.dir = dir;
      match.file = '';
      matches.push(match);
    }

    var relative = dir.slice(root.length);
    var currentDepth = (relative) ? util.getPathDepth(relative) : 0;

    if(currentDepth >= searchDepth) {
      return stop();
    }
  });

  finder.on('file', function(file, stat) {
    var match = fuzzy.match(term, file, matchOpts);
    if(!match) {
      return;
    }

    match.dir = path.dirname(file);
    match.file = path.basename(file);
    matches.push(match);
  });

  finder.on('end', function(err) {

    matches = _.sortBy(matches, function(match) {
      return -match.score;
    });

    _.each(matches, function(match) {
      match.dir = util.normalizePath(match.dir);
      // Slice off shared path between search term and directory.
      if(opts.short) {
        shorten(term, match, opts);
      }
    });

    callback(err, matches);
  });
}
claire.find = find;

module.exports = claire;
