(function claireBootstrap(window) {
  var lt = window.lt;
  var path = require('path');
  var fs = require('fs');

  if(!lt.user_plugins) {
    lt.user_plugins = {};
  }

  // When installed through the plugin manager, the plugin directory is created upper case.
  // When manually cloned, the directory is created lower case..
  var localRoot = path.join(lt.objs.plugins.user_plugins_dir, 'Claire');
  if(!fs.existsSync(localRoot)) {
    localRoot = path.join(lt.objs.plugins.user_plugins_dir, 'claire');
  }

  var ltrap = require(path.join(localRoot, 'node_modules', 'ltrap'))(window, localRoot);

  var _ = ltrap.require('underscore');
  var claireFiles = ltrap.require('claire-files');

  var claire = lt.user_plugins.claire || {};
  /*************************************************************************\
   * Claire helpers
  \*************************************************************************/

  /*\
  |*| Inserts matching results into claire's filter-list.
  \*/
  function setResults(err, matches) {
    if(err) {
      claire.results.textContent = err;
      return;
    }

    var selected = claire.results.querySelector('li.selected');
    if(selected) {
      selected = selected.getAttribute('title');
    } else {
      selected = '';
    }

    claire.results.innerHTML = '';
    claire.matches = matches;
    matches.map(function(match, i) {
      var relative = match.dir + match.file;
      var absolute = match.shared + relative;

      // Nameless element means it's not a real result.
      if(!relative) {
        return;
      }

      var result = document.createElement('li');
        result.setAttribute('title', absolute);
        result.setAttribute('data-relative', relative);
        result.setAttribute('tabIndex', i);
        result.innerHTML = match.rendered;

      if(absolute === selected) {
        result.classList.add('selected');
      }

      claire.results.appendChild(result);
    });
  }

  /*\
  |*| Dispatches search term to claire-files live as it is typed.
  \*/
  function search() {
    var val = claire.getValue();
    claireFiles.find(val, setResults, {pre: '<em>', post: '</em>', short: true});
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

  /*\
  |*| Gets the current search term from claire.
  \*/
  claire.getValue = function() {
    return claire.search.value;
  };

  /*\
  |*| Sets the current search term for claire.
  |*| @NOTE: Does *not* automatically refresh. Call `claire.search()` to update results.
  \*/
  claire.setValue = function(value) {
    claire.search.value = value;
  };

  /*\
  |*| Creates the HTML template for claire and inserts it into Light Table.
  \*/
  claire.init = function() {
    if(claire.claire) {
      claire.claire.parentNode.removeChild(claire.claire);
    }

    claire.claire = document.createElement('div');
    claire.claire.id = 'claire';
    claire.claire.innerHTML =
      '<div class="filter-list">' +
      '  File: <input type="text" class="search"' +
      '    placeholder="File..." tabindex=0 />' +
      '    <ul></ul>' +
      '</div>';

    claire.search = claire.claire.querySelector('.search');
    claire.results = claire.claire.querySelector('ul');

    claire.search.addEventListener('focus', function() {
      ltrap.enterContext('claire');
    });

    claire.search.addEventListener('blur', function() {
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
      claire.search.focus();
      claire.search.addEventListener('keyup', search);
      claire.searchRoot = ltrap.getActiveDirectory();
      claire.setValue(claire.searchRoot);
      search();

    } else {
      claire.search.removeEventListener('keyup', search);
      claire.search.blur();
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
    if(val[val.length - 1] === path.sep) {
      // Get separator before this one, if it exists.
      var sep = val.lastIndexOf(path.sep, val.length - 2);
      if(sep !== -1) {
        val = val.slice(0, sep + 1); // Include the separator.
      } else {
        val = path.sep;
      }


    } else {
      // Truncate last char normally.
      val = val.slice(0, val.length - 1);
    }

    claire.setValue(val);
    search();
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
      search();
      return true;
    }

    var shared = getSharedPrefix(items);
    if(shared.length > val.length) {
      if(shared.indexOf(val) !== -1) {
        claire.setValue(shared);
        search();
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
    fs.appendFile(filepath, '', function(err) {
      if(err) {
        //@TODO: Error handling.
        console.error(err);
      }
      ltrap.execCommand('open-path', filepath);
    });
  };
  ltrap.addCommand({
    command: 'claire-open-match',
    desc: 'Claire: Open current search result',
    exec: claire.openMatch
  });

  // Initializes claire only if it hasn't already been initialized.
  if(!lt.user_plugins.claire) {
    claire.init();
    lt.user_plugins.claire = claire;
  }
})(this);
