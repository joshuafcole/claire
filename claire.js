(function claireBootstrap(window) {
  var path = require('path');

  var util = require(path.join(lt.util.load.pwd, 'plugins', 'claire', 'lib', 'util'))(window);
  var requireLocal = util.requireLocal;

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
    claire.$results.html('');

    matches = _.sortBy(matches, function(match) {
      return -match.score;
    });

    matches.map(function(match) {
      var file = match.file;

      var $result = $('<li>fileStats.name').attr('title', file).html(match.rendered);
      claire.$results.append($result);
    });
  }

  var search = _.throttle(function() {
    var val = claire.$search.val();
    claireFiles.find(val, '/Users', setResults, {pre: '<em>', post: '</em>', short: true});
  }, 100, {trailing: true});

  /*\
  |*| Claire commands
  \*/

  claire.clear = function() {
    claire.$search.val('');
    claire.$results.html('');
  }
  util.addAction('claire.clear', claire.clear);

  claire.show = function() {
    var opened = util.showContainer('#bottombar');
    if(opened) {
      claire.$search.on('keydown', search);
      var startPath = util.getBufferDirectory();
      claire.$search.val(startPath);
      claire.$search.focus();
      search();

    } else {
      claire.$search.off('keydown', search);
      claire.clear();
    }
  };
  util.addAction('claire.show', claire.show);

  if(!window.claire) {
    claire.init();
    window.claire = claire;
  }
})(this);
