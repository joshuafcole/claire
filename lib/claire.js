var path = require('path');
var fs = require('fs');

var _ = require('underscore');

var claireFiles = require('claire-files');
var util = require('./util');


module.exports = function(window, localRoot) {
  var ltrap = require('ltrap')(window, localRoot);
  var ui = require('./ui')(window);

  var lt = window.lt;
  var document = window.document;
  var claire = {};

  /*************************************************************************\
   * Claire helpers
  \*************************************************************************/
  /*\
  |*| Inserts matching results into claire's filter-list as a callback.
  \*/
  claire.setResults = function(err, matches) {
    if(err) {
      claire.results.textContent = err;
      return;
    }
    claire.matches = matches;
    return ui.setResults(claire.results, matches);
  }

  /*\
  |*| Dispatches search term to claire-files live as it is typed.
  \*/
  claire.search = function() {
    var val = claire.getValue();
    if(!val) {
      return claire.setResults(null, []);
    }
    claireFiles.find(val, claire.setResults, {pre: '<em>', post: '</em>', short: true});
  }

  /*\
  |*| Gets the current search term from claire.
  \*/
  claire.getValue = function() {
    return claire.searchInput.value;
  };

  /*\
  |*| Sets the current search term for claire.
  |*| @NOTE: Does *not* automatically refresh. Call `claire.search()` to update results.
  \*/
  claire.setValue = function(value) {
    claire.searchInput.value = value;
  };

  /*\
  |*| Creates the HTML template for claire and inserts it into Light Table.
  \*/
  claire.init = function() {
    if(claire.claire) {
      claire.claire.parentNode.removeChild(claire.claire);
    }

    claire.claire = ui.createClaireComponent();
    claire.searchInput = claire.claire.querySelector('.search');
    claire.results = claire.claire.querySelector('ul');

    claire.searchInput.addEventListener('focus', function() {
      ltrap.enterContext('claire');
    });
    claire.searchInput.addEventListener('blur', function() {
      ltrap.exitContext('claire');
    });

    document.querySelector('#bottombar > .content').appendChild(claire.claire);
  };

  /*************************************************************************\
   * Claire commands
  \*************************************************************************/
  /*\
  |*| Resets claire's state.
  \*/
  claire.clear = function() {
    claire.setValue('');
    claire.results.innerHTML = '';
  };
  ltrap.addCommand({
    command: 'claire-clear',
    desc: 'Claire: Clear current search',
    exec: claire.clear
  });

  /*\
  |*| Displays claire and initalizes it's context.
  \*/
  claire.show = function() {
    var opened = ltrap.showContainer('#bottombar');
    if(opened) {
      // Closing the console deletes claire?
      if(!document.querySelector('#claire').length) {
        document.querySelector('#bottombar').appendChild(claire.claire);
      }

      claire.searchInput.focus();
      claire.searchInput.addEventListener('keyup', claire.search);
      claire.searchRoot = ltrap.getActiveDirectory();
      claire.setValue(claire.searchRoot);
      claire.search();

    } else {

      claire.searchInput.removeEventListener('keyup', claire.search);
      claire.searchInput.blur();
    }
  };
  ltrap.addCommand({
    command: 'claire-show',
    desc: 'Claire: Show claire search bar',
    exec: claire.show
  });

  /*\
  |*| Deletes a full path component if the char under mark is a path separator, or deletes regularly.
  \*/
  claire.smartDelete = function() {
    var val = claire.getValue();
    if(util.isDirectory(val) && val.length > 1) {
      // Get separator before this one, if it exists.
      var sep = val.lastIndexOf(path.sep, val.length - 2);
      if(sep !== -1) {
        val = val.slice(0, sep + 1); // Leave the separator.
      } else {
        val = path.sep;
      }


    } else {
      // Truncate last char normally.
      val = val.slice(0, val.length - 1);
    }

    claire.setValue(val);
    claire.search();
  };
  ltrap.addCommand({
    command: 'claire-smart-delete',
    desc: 'Claire: Delete last path segment or character',
    exec: claire.smartDelete
  });

  /*\
  |*| Iterates through search results.
  \*/
  claire.iterate = function(cm, mode) {
    var initial = 'firstChild';
    var iter = 'nextSibling';
    if(mode === 'reverse') {
      initial = 'lastChild';
      iter = 'previousSibling';
    }

    // Find and highlight newly selected item.
    var selected = claire.results.querySelector('li.selected');

    // Store the uncompleted search term in case the user backs out.
    var val = claire.getValue();
    if(!selected) {
      claire.lastSearch = val;
      selected = claire.results[initial];
    } else {
      selected.classList.remove('selected');
      selected = selected[iter];
    }

    // Populate search bar with current selection.
    if(selected) {
      selected.classList.add('selected');
      val = selected.getAttribute('title') || '';
    } else {
      val = claire.lastSearch;
    }

    claire.setValue(val);
  };
  ltrap.addCommand({
    command: 'claire-iterate',
    desc: 'Claire: Iterate through search results',
    exec: claire.iterate
  });

  /*\
  |*| Calculate longest shared prefix or results and append to search.
  |*| Note that this is the complete path in the case of a single result.
  \*/
  claire.complete = function() {
    var val = claireFiles.expandPath(claire.getValue());
    var items = _.map(claire.matches, function(match) {
      return path.join(match.shared, match.dir, match.file);
    });

    if(!items.length) {
      return;
    }
    if(items.length === 1) {
      claire.setValue(items[0]);
      claire.search();
      return true;
    }

    var shared = util.getSharedPrefix(items);
    if(shared.length > val.length) {
      if(shared.indexOf(val) !== -1) {
        claire.setValue(shared);
        claire.search();
        return true;
      }
    }
    return false;
  };
  ltrap.addCommand({
    command: 'claire-complete',
    desc: 'Claire: Complete current search result',
    exec: claire.complete
  });

  /*\
  |*| completes from the given results if possible or iterates through them if not.
  \*/
  claire.smartComplete = function() {
    var completed = claire.complete();
    if(!completed) {
      claire.iterate();
    }
  };
  ltrap.addCommand({
    command: 'claire-smart-complete',
    desc: 'Claire: Complete or iterate current search result',
    exec: claire.smartComplete
  });

  /*\
  |*| Opens the currently selected file.
  |*| @TODO: Should prompt user for creation instead of doing it implicitly.
  \*/
  claire.openMatch = function() {
    var filepath = claire.getValue();
    if(util.isDirectory(filepath)) {
      return claire.search();
    }

    fs.appendFile(filepath, '', function(err) {
      if(err) {
        //@TODO: Error handling.
        console.error(err);
      }
      ltrap.execCommand('open-path', filepath);
      claire.clear();
      claire.show();
    });
  };
  ltrap.addCommand({
    command: 'claire-open-match',
    desc: 'Claire: Open current search result',
    exec: claire.openMatch
  });

  return claire;
};
