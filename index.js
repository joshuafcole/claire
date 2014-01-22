(function nodePluginBootstrap(window) {
  var lt = window.lt;
  var path = require('path');
  var fs = require('fs');

  var localRoot = lt.objs.plugins.adjust_path('');
  if(!localRoot) {
    throw new Error("plugin could not be found by LT:", localRoot);
  }

  var ltrap = require(path.join(localRoot, 'node_modules', 'ltrap'))(window, localRoot);
  var pkg = ltrap.require('package');

  if(!lt.user_plugins) {
    lt.user_plugins = {};
  }

  // Initiate new claire instance.
  plugin = ltrap.require(path.join('lib', pkg.name))(window, localRoot);
  plugin.init();

  lt.user_plugins[pkg.name] = plugin;
})(window);
