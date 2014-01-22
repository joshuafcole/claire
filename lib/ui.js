var _ = require('underscore');

module.exports = function(window) {
  var document = window.document;

  /*************************************************************************\
   * Generic UI helpers.
  \*************************************************************************/
  function createElement(tag, content, attributes) {
    var el = document.createElement(tag);
    if(content) {
      el.innerHTML = content;
    }

    _.each(attributes, function(val, attr) {
      el.setAttribute(attr, val);
    });

    return el;
  }


  /*************************************************************************\
   * Claire specific helpers.
  \*************************************************************************/
  /*\
  |*| Inserts matching results into a filter-list ul.
  \*/
  function setResults(list, matches) {
    // Remember selected match if it remains in the new set of matches.
    var selected = list.querySelector('li.selected');
    if(selected) {
      selected = selected.getAttribute('title');
    } else {
      selected = '';
    }

    list.innerHTML = '';

    matches.map(function(match, i) {
      var relative = match.dir + match.file;
      var absolute = match.shared + relative;

      // Nameless element means it's not a real result.
      if(!relative) {
        return;
      }

      var result =  createElement('li', match.rendered, {
        title: absolute,
        'data-relative': relative,
        tabindex: i
      });

      if(absolute === selected) {
        result.classList.add('selected');
      }

      list.appendChild(result);
    });
  }

  /*\
  |*| Create claire html component.
  \*/
  function createClaireComponent() {
    var el = createElement('div',
                           '<div class="filter-list">' +
                           '  <input type="text" class="search"' +
                           '    placeholder="File..." tabindex=0 />' +
                           '  <ul></ul>' +
                           '</div>',
                           {id: 'claire'});

    return el;
  }


  return {
    createElement: createElement,
    setResults: setResults,
    createClaireComponent: createClaireComponent
  };
};
