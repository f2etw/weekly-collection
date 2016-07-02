var bs = require('browser-sync').create();
var argv = require('yargs').argv;

var date = argv.date;

if (!date) {
  date = require('./lastSunday').date;
}

console.log('Start date: ', date);

bs.init({
  server: '.weekly-feed',
  startPath: `./getData/?since=${date}`
});
