var _ = require('underscore');
var path = require('path');
var claire = require('..');

function reportMatches(err, matches) {
  console.log('----');

  if(err) {
    console.log('ERROR:', err);
  }

  _.each(matches, function(match) {
    console.log(match.rendered, match.score);
  });
}

claire.find(path.join(__dirname, 'amp'), reportMatches);
claire.find(path.join('~', 'rep'), reportMatches);
claire.find(path.join(__dirname, 'amp'), reportMatches, {short: true});
