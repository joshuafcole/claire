(function claireBootstrap(window) {
  var path = require('path');

  var util = require(path.join(lt.util.load.pwd, 'plugins', 'claire', 'lib', 'util'))(window);
  var requireLocal = util.requireLocal;

  var _ = requireLocal('underscore');
  var $ = requireLocal('jquery');
  var claireFiles = requireLocal('claire-file');
  var claire = window.claire || {};

  /*\
  |*| Claire helpers
  \*/
  claire.init = function() {
    claire.$claire = $('<div id="claire"><div class="selector">');
    var $filterList = $('<div class="filter-list">').appendTo(claire.$claire.children('.selector'));
    claire.$search = $('File: <input class="search" type="text" placeholder="File..." tabindex=0 />').appendTo($filterList);
    claire.$results = $('<ul>').appendTo($filterList);

    $('#claire').remove();
    util.addItem('#bottombar', claire.$claire);
  };

  function setResults(err, matches) {
    var selected = claire.$results.find('li.selected').attr('title');
    claire.$results.html('');
    claire.matches = matches;
    matches.map(function(match, i) {
      var file = match.dir + match.file;
      var $result = $('<li>fileStats.name')
        .attr('title', file)
        .attr('tabIndex', i)
        .html(match.rendered);

      if(file === selected) {
        $result.addClass('selected');
      }

      claire.$results.append($result);
    });
  }

  var key = {tab: 9, backspace: 8, left: 37, up: 38, right: 39, down: 40};
  function processKeys(event) {
    if(event.keyCode === key.tab) {
      event.preventDefault();
      claire.complete();
    }

    if(event.keyCode === key.backspace) {
      claire.smartDelete();
    }

    if(event.keyCode === key.up) {
      event.preventDefault();
      claire.iterate('reverse');
    }
    if(event.keyCode === key.down) {
      event.preventDefault();
      claire.iterate();
    }
  }

  var search = function(event) {
    var skipKeys = [key.left, key.up, key.right, key.down];
    if(event && _.contains(skipKeys, event.keyCode)) {
      return;
    }

    var val = claire.$search.val();
    claireFiles.find(val, setResults, {pre: '<em>', post: '</em>', short: true});
  };

  /*\
  |*| Claire commands
  \*/

  claire.clear = function() {
    claire.$search.val('');
    claire.$results.html('');
  };
  util.addAction('claire.clear', claire.clear);

  claire.show = function() {
    var opened = util.showContainer('#bottombar');
    if(opened) {
      claire.$search.on('keydown', processKeys);
      claire.$search.on('keyup', search);
      claire.searchRoot = util.getBufferDirectory();
      claire.$search.val(claire.searchRoot);
      claire.$search.focus();
      search();

    } else {
      claire.$search.off('keydown', processKeys);
      claire.$search.off('keyup', search);
      claire.clear();
    }
  };
  util.addAction('claire.show', claire.show);

  claire.smartDelete = function() {
    var val = claire.$search.val();
    if(val[val.length - 1] === '/') {
      // Get slash before this one, if it exists.
      var slash = val.lastIndexOf('/', val.length - 2);
      if(slash !== -1) {
        val = val.slice(0, slash + 2); //include slash
      } else {
        val = '/'; //@TODO: Make platform generic
      }

      claire.$search.val(val);
    }
  };
  util.addAction('claire.smart-delete', claire.smartDelete);

  claire.iterate = function(mode) {
    var $selected = claire.$results.find('li.selected');

    if(mode === 'reverse') {
      if(!$selected.length) {
        claire.$results.find('li').last().addClass('selected');
        return;
      }

      $selected = $selected.removeClass('selected')
        .prev().addClass('selected');
    } else {
      if(!$selected.length) {
        claire.$results.find('li').first().addClass('selected');
        return;
      }

      $selected = $selected.removeClass('selected')
        .next().addClass('selected');
    }

  };
  util.addAction('claire.iterate', claire.iterate);

  // Calculate longest shared prefix or results and append to $search
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
    }

    items = items.sort();
    var first = items[0];
    var last = items[items.length - 1];
    var i = 0;
    while(i < first.length && first.charAt(i) == last.charAt(i)) {
      i++;
    }
    var shared = first.substring(0, i);

    if(shared.length > val.length) {
      if(shared.indexOf(val) !== -1) {
        claire.$search.val(shared);
      }
      return;
    }

    claire.iterate();
  };
  util.addAction('claire.complete', claire.complete);

  if(!window.claire) {
    claire.init();
    window.claire = claire;
  }
})(this);
