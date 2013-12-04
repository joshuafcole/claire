var path = require('path');


var exports = module.exports = function(window) {
  /*\
  |*| Requires plugin-local files and modules.
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
  var cljs = window.cljs;
  var lt = window.lt;

  /*\
  |*| Registers functions as CodeMirror actions.
  |*| Currently used as a hack becasue CodeMirror actions are the only
  |*| Functions I know how to create and trigger in keymaps.
  \*/
  function addAction(commandName, command) {
    var CodeMirror = window.CodeMirror;

    if (!CodeMirror.commands[commandName]) {
      CodeMirror.commands[commandName] = command;
    }
  }

  /*\
  |*| Casts a string into a cljs keyword.
  \*/
  function Keyword(name) {
    return new cljs.core.Keyword(null, name, name);
  }

  /*\
  |*| Tells Light Table to listen to and dispatch key events for the given context.
  \*/
  function enterContext(context) {
    var keyword = Keyword(context);
    lt.objs.context.in_BANG_.call(null, keyword, null);
  }

  /*\
  |*| Tells Light Table to cease listening to and dispatching key events for the given context.
  \*/
  function exitContext(context) {
    var keyword = Keyword(context);
    lt.objs.context.out_BANG_.call(null, keyword, null);
  }

  /*************************************************************************\
   * File Helpers
  \*************************************************************************/
  /*\
  |*| Gets the filepath of the currently active tab, super hacky.
  \*/
  function getActiveFile() {
    var $activeTab = $('#multi .tabset > .list li.active');
    return $activeTab.attr('title');
  }

  /*\
  |*| Gets the directory containing the current buffer if one exists, or home.
  |*| cwd in LT points to LT's directory
  \*/
  function getBufferDirectory() {
    var dir = path.dirname(getActiveFile());
    if(dir === '.') {
      dir = '~';
    }
    dir += path.sep;
    return dir;
  }

  /*\
  |*| Opens a file in the current tabset.
  \*/
  function open(filepath) {
    var openPath = Keyword('open-path');
    lt.objs.command.exec_BANG_.call(lt.objs.command.command, openPath, filepath);
  }

  /*************************************************************************\
   * UI Helpers
  \*************************************************************************/
  /*\
  |*| Opens a nifty synchronous prompt provided by lt.
  \*/
  function prompt(message) {
    return window.prompt(message);
  }

  /*\
  |*| Toggles an element's visiblity. Returns truthy if
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
    Keyword: Keyword,
    enterContext: enterContext,
    exitContext: exitContext,

    getActiveFile: getActiveFile,
    getBufferDirectory: getBufferDirectory,
    open: open,

    prompt: prompt,
    showContainer: showContainer,
    addItem: addItem
  };
};
