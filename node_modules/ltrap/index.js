var _ = require('underscore');
var path = require('path');



var ltdir = window.lt.util.load.pwd;
path.join(ltdir, 'plugins', 'recall');

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
  |*| Registers functions as CodeMirror actions.
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
  function command(name) {
    var args = [].slice.call(arguments, 1);
    var kw = toKeyword(name);
    args.unshift(kw);
    return lt.objs.command.exec_BANG_.apply(lt.objs.command.command, args);
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
  |*| @FIXME: Does not work with multiple tabsets.
  \*/
  function getActiveTab() {
    return document.querySelector('#multi .tabset > .list li.active');
  }

  /*\
  |*| Gets the filepath of the currently active tab, super hacky.
  |*| @FIXME: Does not work with multiple tabsets.
  \*/
  function getActiveFile() {
    return getActiveTab().getAttribute('title');
  }

  /*\
  |*| Gets the directory containing the current buffer if one exists, or home.
  |*| cwd in LT points to LT's directory
  |*| @FIXME: Does not work with multiple tabsets
  \*/
  function getActiveDirectory() {
    var dir = path.dirname(getActiveFile());
    if(dir === '.') {
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

    // lt
    require: requireLocal,
    requireLocal: requireLocal, // @deprecated
    addAction: addAction,
    command: command,
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
