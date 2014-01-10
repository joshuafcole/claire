var path = require('path');

/*\
|*| Gets the longest shared prefix of two strings.
\*/
function getUnion(p1, p2) {
  var i = 0;
  var max = Math.min(p1.length, p2.length);
  while(p1[i] === p2[i] && i < max) {
    i++;
  }

  return p1.substring(0, i);
}

/*\
|*| Gets the depth of a path.
\*/
function getPathDepth(p) {
  var parts = p.split(path.sep);
  // On *nix-based OS's, the root is '/'
  if(!parts[0]) {
    parts.unshift();
  }

  return p.split(path.sep).length;
}

/*\
|*| Expands paths with special meaning or relative paths into absolute paths.
\*/
function expandPath(p) {
  if(p[0] === '~') {
    p = getUserHome() + p.slice(1);
  }
  return path.normalize(p);
}

/*\
|*| Ensures that a directory string is suffixed with a path separator.
\*/
function normalizePath(dir) {
  if(dir && dir[dir.length - 1] != path.sep) {
    dir += path.sep;
  }
  return dir;
}

/*\
|*| Gets a user's home directory regardless of platform (hopefully!).
\*/
function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var exports = module.exports = {
  getUnion: getUnion,
  getPathDepth: getPathDepth,
  expandPath: expandPath,
  normalizePath: normalizePath,
  getUserHome: getUserHome
};
