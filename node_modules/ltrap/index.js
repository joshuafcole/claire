var _ = require('underscore');
var path = require('path');

module.exports = function(window, localRoot) {
  var cljs = window.cljs;
  var document = window.document;
  var lt = window.lt;

  /*************************************************************************\
   * Misc. Helpers
  \*************************************************************************/
  /*\
  |*| Attempt the given operation, ignoring errors with the given code.
  \*/
  function ignore(callback, codes) {
    if(!_.isArray(codes)) {
      codes = [codes];
    }

    try {
      return callback();
    } catch (err) {
      if(_.contains(codes, err.code)) {
        return;
      }
      throw err;
    }
  }


  /*************************************************************************\
   * CLJS Helpers
  \*************************************************************************/
  /*\
  |*| Casts a string into a cljs keyword.
  \*/
  function toKeyword(name) {
    return new cljs.core.Keyword(null, name, name);
  }

  /*\
  |*| Casts an object into a cljs PersistentHashMap.
  |*| noConvert: [Boolean] Do not convert string keys into Keywords.
  \*/
  function toHashMap(obj, noConvert) {
    var hash = cljs.core.PersistentHashMap.EMPTY;
    _.each(obj, function(value, key) {
      if(!noConvert) {
        key = toKeyword(key);
      }
      hash = cljs.core.assoc(hash, key, value);
    });

    return hash;
  }


  /*************************************************************************\
   * LT Helpers
  \*************************************************************************/
  /*\
  |*| Requires plugin-local files and modules.
  \*/
  function requireLocal(name, root) {
    root = root || localRoot;

    return ignore(_.partial(require, path.join(root, name)), 'MODULE_NOT_FOUND') || // File include.
      ignore(_.partial(require, path.join(root, 'node_modules', name)), 'MODULE_NOT_FOUND') || // Module include
      require(name); // Global include
  }

  /*\
  |*| Registers a function as a CodeMirror action.
  \*/
  function addAction(commandName, command) {
    var CodeMirror = window.CodeMirror;

    if (!CodeMirror.commands[commandName]) {
      CodeMirror.commands[commandName] = command;
    }
  }

  /*\
  |*| Invokes a native LT command (anything that is registered with the commandbar).
  \*/
  function execCommand(name) {
    var args = [].slice.call(arguments, 1);
    var kw = toKeyword(name);
    args.unshift(kw);
    return lt.objs.command.exec_BANG_.apply(lt.objs.command.command, args);
  }

  /*\
  |*| Registers a new command with LT.
  |*| command {
  |*|   command: String    Name (cast to Keyword)
  |*|   desc:    String    Description
  |*|   exec:    function  Function to execute.
  |*|   hidden:  [Boolean] Visible in commandbar
  |*| }
  \*/
  function addCommand(command) {
    if('command' in command) {
      command.command = toKeyword(command.command);
    }
    if('hidden' in command) {
      command.hidden = false;
    }
    var cmd = toHashMap(command);
    lt.objs.command.command.call(null, cmd);
  }

  /*\
  |*| Tells Light Table to listen to and dispatch key events for the given context.
  \*/
  function enterContext(context) {
    var keyword = toKeyword(context);
    lt.objs.context.in_BANG_.call(null, keyword, null);
  }

  /*\
  |*| Tells Light Table to cease listening to and dispatching key events for the given context.
  \*/
  function exitContext(context) {
    var keyword = toKeyword(context);
    lt.objs.context.out_BANG_.call(null, keyword, null);
  }



  /*************************************************************************\
   * Tab Helpers
  \*************************************************************************/

  /*\
  |*| Gets a list of all open tabs, represented in a 2D array of [group][file]
  \*/
  function getTabs() {
    var tabsets = document.querySelectorAll('#multi .tabset');
    return _.map(tabsets, function(tabset) {
      return _.map(tabset.querySelectorAll('.list li'), function(tab) {
        return tab.getAttribute('title');
      });
    });
  }

  /*\
  |*| Gets the currently active tab as an html element.
  \*/
  function getActiveTab() {
    return lt.objs.tabs.active_tab();
  }

  /*\
  |*| Gets the filepath of the currently active tab, super hacky.
  \*/
  function getActiveFile() {
    var active = getActiveTab();
    if(!active) {
      return false;
    }
    return lt.objs.tabs.__GT_path(active);
  }

  /*\
  |*| Gets the directory containing the current buffer if one exists, or home.
  |*| cwd in LT points to LT's directory
  \*/
  function getActiveDirectory() {
    var dir = path.dirname(getActiveFile());

    if(!dir || dir === '.') {
      dir = '~';
    }
    return dir + path.sep;
  }

  /*************************************************************************\
   * UI Helpers
  \*************************************************************************/
  /*\
  |*| Opens a synchronous dialog with the given message, returning the result
  |*| of user interaction, if any.
  \*/
  var prompt = window.prompt;
  var confirm = window.confirm;

  /*\
  |*| Toggles an element's visiblity. Returns truthy if
  |*| opened and falsy if closed.
  |*| @NOTE: This is hacky and behavior is subject to future improvement.
  \*/
  function showContainer(container) {
    var elem = document.querySelector(container);
    if(!elem) {
      return false;
    }

    var height = parseInt(elem.style.height, 10);
    if(height === 0) {
      elem.style.height = 'auto';
    } else {
      elem.style.height = 0;
    }

    return !height;
  }

  return {
    ignore: ignore,

    // cljs
    toKeyword: toKeyword,
    toHashMap: toHashMap,

    // lt
    require: requireLocal,

    addAction: addAction,
    addCommand: addCommand,
    execCommand: execCommand,

    enterContext: enterContext,
    exitContext: exitContext,

    // tab
    getActiveTab: getActiveTab,
    getTabs: getTabs,
    getActiveFile: getActiveFile,
    getActiveDirectory: getActiveDirectory,

    // UI
    prompt: prompt,
    confirm: confirm,
    showContainer: showContainer
  };
};
