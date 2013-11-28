var path = require('path');


var exports = module.exports = function(window) {
  /*\
  |*| Helper function to require plugin-local files and modules.
  \*/
  function requireLocal(name, root) {
    var ltdir = window.lt.util.load.pwd;
    root = root || path.join(ltdir, 'plugins', 'claire');
    var module;
    try {
      module = require(path.join(root, name));
    } catch (e) {
      if(e.code !== 'MODULE_NOT_FOUND') {
        throw e;
      }
    }

    if(!module) {
      module = require(path.join(root, 'node_modules', name));
    }
    return module;
  }

  var $ = requireLocal('jquery');

  /*\
  |*| Helper function to register functions as CodeMirror actions.
  |*| Currently used as a hack becasue CodeMirror actions are the only
  |*| Functions I know how to reliably trigger.
  \*/
  function addAction(commandName, command) {
    var CodeMirror = window.CodeMirror;

    if (!CodeMirror.commands[commandName]) {
      CodeMirror.commands[commandName] = command;
    }
  }

  /*\
  |*| Opens a nifty synchronous prompt provided by lt.
  \*/
  function prompt(message) {
    return window.prompt(message);
  }

  /*\
  |*| Super hack to get the filepatch of the currently active tab.
  \*/
  function getActiveFile() {
    var $activeTab = $('#multi .tabset > .list li.active');
    return $activeTab.attr('title');
  }

  /*\
  |*| Gets the directory containing the current buffer if one exists, or home.
  \*/
  function getBufferDirectory() {
    var dir = path.dirname(getActiveFile());
    if(dir === '.') {
      dir = '~';
    }
    dir += '/';
    return dir;
  }

  /*\
  |*| Simple bit of logic for toggling container visiblity. Returns truthy if
  |*| opened and falsy if closed.
  \*/
  function showContainer(container) {
    var $container = $(container);
    var height = $container.height();
    if(height == 0) {
      $container.height('auto');
    } else {
      $container.height(0);
    }

    return !height;
  }

  /*\
  |*| Adds an element to a container's .content div.
  \*/
  function addItem(container, item) {
    $(container).children('.content').first().append(item);
  }

  return {
    requireLocal: requireLocal,
    addAction: addAction,
    prompt: prompt,
    getActiveFile: getActiveFile,
    getBufferDirectory: getBufferDirectory,
    showContainer: showContainer,
    addItem: addItem
  };
};
