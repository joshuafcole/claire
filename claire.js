(function claire(lt) {
  var fs = require('fs');
  var path = require('path');

  var root = path.join(lt.util.load.pwd, 'plugins', 'claire');
  var modules = path.join(root, '/node_modules');

  function requireLocal(name) {
    var module;
    try {
      module = require(path.join(root, name));
    } catch (e) {
      if(e.code !== 'MODULE_NOT_FOUND') {
        throw e;
      }
    }

    if(!module) {
      module = require(path.join(modules, name));
    }
    return module;
  }


  var fuzzy = requireLocal('fuzzy');
  var walk = requireLocal('walk');

  var cludge = goog.require('./build/claire.main.getlink');
  console.log('CLUDGE', cludge);

  //console.log(fuzzy, walk);
  //console.log(lt.objs.bottombar);
})(window.lt);
