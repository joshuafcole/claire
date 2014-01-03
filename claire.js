(function claireBootstrap(window) {
  var lt = window.lt;
  var path = require('path');
  var fs = require('fs');

  // Hack to initially load our plugin utilities. After this we can use requireLocal.
  // Anything that gets required this way can use the global require normally.
  var util = require(path.join(lt.util.load.pwd, 'plugins', 'claire', 'lib', 'util'))(window);
  var requireLocal = util.requireLocal;

  var _ = requireLocal('underscore');
  var $ = requireLocal('jquery');
  var claireFiles = requireLocal('claire-files');
  var claire = window.claire || {};
  /*************************************************************************\
   * Claire helpers
  \*************************************************************************/
  /*\
  |*| Creates the HTML template for claire and inserts it into Light Table.
  \*/
  claire.init = function() {
    claire.$claire = $('<div id="claire"><div class="selector">');
    var $filterList = $('<div class="filter-list">').appendTo(claire.$claire.children('.selector'));
    claire.$search = $('File: <input class="search" type="text" placeholder="File..." tabindex=0 />').appendTo($filterList);
    claire.$results = $('<ul>').appendTo($filterList);

    $('#claire').remove();
    util.addItem('#bottombar', claire.$claire);
  };

  /*\
  |*| Inserts matching results into claire's filter-list.
  \*/
  function setResults(err, matches) {
    if(err) {
      claire.$results.text(err);
      return;
    }

    var selected = claire.$results.find('li.selected').attr('title');
    claire.$results.html('');
    claire.matches = matches;
    matches.map(function(match, i) {
      var relative = match.dir + match.file;
      var absolute = match.shared + relative;

      if(!relative) {
        return;
      }

      var $result = $('<li>fileStats.name')
        .attr('title', absolute)
        .attr('data-relative', relative)
        .attr('tabIndex', i)
        .html(match.rendered);

      if(absolute === selected) {
        $result.addClass('selected');
      }

      claire.$results.append($result);
    });
  }

  /*\
  |*| Dispatches search term to claire-files live as it is typed.
  \*/
  function search() {
    var val = claire.$search.val();
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


  /*************************************************************************\
   * Claire commands
  \*************************************************************************/
  /*\
  |*| Resets claire's state.
  \*/
  claire.clear = function() {
    claire.$search.val('');
    claire.$results.html('');
  };
  util.addAction('claire.clear', claire.clear);

  /*\
  |*| Displays claire and initalizes it's context.
  \*/
  claire.show = function() {
    var opened = util.showContainer('#bottombar');
    if(opened) {
      util.enterContext('claire');
      claire.$search.on('keyup', search);
      claire.searchRoot = util.getBufferDirectory();
      claire.$search.val(claire.searchRoot);
      claire.$search.focus();
      search();

    } else {
      util.exitContext('claire');
      claire.$search.off('keyup', search);
      claire.clear();
    }
  };
  util.addAction('claire.show', claire.show);

  /*\
  |*| Deletes a full path component if the char under mark is a path separator, or deletes regularly.
  \*/
  claire.smartDelete = function() {
    var val = claire.$search.val();
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

    claire.$search.val(val);
    search();
  };
  util.addAction('claire.smart-delete', claire.smartDelete);

  /*\
  |*| Iterates through search results.
  \*/
  claire.iterate = function(cm, mode) {
    var initial = 'first';
    var iter = 'next';
    if(mode === 'reverse') {
      initial = 'last';
      iter = 'prev';
    }

    // Find and highlight newly selected item.
    var $selected = claire.$results.find('li.selected');

    // Store the uncompleted search term in case the user backs out.
    var val = claire.$search.val();
    if(!$selected.length) {
      claire.search = val;
    }

    if(!$selected.length) {
      $selected = claire.$results.find('li')[initial]().addClass('selected');
    } else {
      $selected = $selected.removeClass('selected')[iter]().addClass('selected');
    }

    // Populate search bar with current selection.
    if($selected.length) {
      val = $selected.attr('title') || '';
      // If selection is a directory, don't include the last slash -- typing it finalizes the selection.
      if(val[val.length - 1] === path.sep) {
        val = val.slice(0, val.length - 1);
      }
    } else {
      val = claire.search;
    }

    claire.$search.val(val);
  };
  util.addAction('claire.iterate', claire.iterate);

  /*\
  |*| Calculate longest shared prefix or results and append to $search.
  |*| Note that this is the complete path in the case of a single result.
  \*/
  claire.complete = function() {
    var val = claireFiles.expandPath(claire.$search.val());
    var items = _.map(claire.matches, function(match) {
      return path.join(match.shared, match.dir, match.file);
    });

    if(!items.length) {
      return;
    }
    if(items.length === 1) {
      claire.$search.val(items[0]);
      search();
      return true;
    }

    var shared = getSharedPrefix(items);
    if(shared.length > val.length) {
      if(shared.indexOf(val) !== -1) {
        claire.$search.val(shared);
        search();
        return true;
      }
    }
    return false;
  };
  util.addAction('claire.complete', claire.complete);

  /*\
  |*| completes from the given results if possible or iterates through them if not.
  \*/
  claire.smartComplete = function() {
    var completed = claire.complete();
    if(!completed) {
      claire.iterate();
    }
  };
  util.addAction('claire.smart-complete', claire.smartComplete);

  /*\
  |*| Opens the currently selected file.
  |*| @TODO: Should prompt user for creation instead of doing it implicitly.
  \*/
  claire.openMatch = function() {
    var filepath = claire.$search.val();
    fs.appendFile(filepath, '', function(err) {
      if(err) {
        //@TODO: Error handling.
        console.error(err);
      }
      util.open(filepath);
    });
  };
  util.addAction('claire.open-match', claire.openMatch);

  // Initializes claire only if it hasn't already been initialized.
  if(!window.claire) {
    claire.init();
    window.claire = claire;
  }
})(this);
