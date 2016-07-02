var fs = require('mz/fs');
var argv = require('yargs').argv;
var mustache = require('mustache');
var lastSunday = require('./lastSunday').date;

var date = argv.date || lastSunday;

console.log('Start date: ', date);

var fetchJSONFile = ($path) => {
  return fs.readFile($path, 'utf8').then(data => JSON.parse(data)).catch(err => {
    console.log(err);
  });
};

var top20 = fetchJSONFile(`.weekly-feed/${date}.json`);
var top20Voted = fetchJSONFile(`.weekly-feed/${date}-vote.json`);

var yamlTpl = `- permalink: 'https://fb.com/{{ id }}'
  time: '{{ created_time }}'
  sharer-name: '{{ from.name }}'
  sharer-id: '{{ from.id }}'
  title: '{{ name }}'
  link: '{{{ link }}}'
  {{# cover }}
  cover: '{{{ cover }}}'
  {{/ cover }}
  intro: ''
`;

Promise.all([top20, top20Voted]).then(v => {
  var top20 = v[0];
  var top20Voted = v[1];

  var top10Voted = top20Voted.slice(0, 10);

  var top10yaml = top10Voted.map(i => {
    // filter matched data in top20, and render with mustache
    return mustache.render(yamlTpl, top20.filter(j => j.id === i.postId)[0]);
  });

  fs.writeFile(`_data/${date}.yml`, top10yaml.join('\n'));
});
