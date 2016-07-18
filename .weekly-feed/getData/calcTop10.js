var fs = require('mz/fs');
var argv = require('yargs').argv;
var mustache = require('mustache');
var prompt = require('prompt');
var lastSunday = require('./lastSunday').date;

var date = argv.date || lastSunday;

console.log(`請確認開始日期: ${date} ?`);

prompt.get([{
  name: 'startDate',
  pattern: /^\d{4}(-\d{2}){2}$/,
  default: date
}], (err, result) => {
  if (err) { console.log(err); }
  date = result.startDate;

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

var mdTpl = `---
layout: post
title: "Collection #0{{ week }}"
categories: collection
tags: weekly-popular
publish-date: '{{ publishDate }}'
date-since: '{{ dateSince }}'
date-until: '{{ dateUntil }}'
volunteer: {{ volunteer }}
---

{% include card.html %}
`;

Promise.all([top20, top20Voted]).then(v => {
  var top20 = v[0];
  var top20Voted = v[1];

  // get the original picture from fb cdn
  top20.forEach(i => i.cover = i.picture ? decodeURIComponent(i.picture.split(/&url=([^&]+)/)[1]) : '');

  var top10Voted = top20Voted.slice(0, 10);

  var top10yaml = top10Voted.map(i => {
    // filter matched data in top20, and render with mustache
    return mustache.render(yamlTpl, top20.filter(j => j.id === i.postId)[0]);
  });

  var now = new Date();

  var frontMatter = {
    week: ~~((new Date(date) - new Date('2016-03-13')) / (7 * 24 * 60 * 60 * 1000)),
    dateSince: date,
    dateUntil: date.replace(/(\d\d)$/, a => a * 1 + 6),
    publishDate: new Date(now - now.getTimezoneOffset() * 60 * 1000).toJSON().split('T')[0],
    volunteer: argv.volunteer || 'Rplus'
  };

  fs.writeFile(`_data/${date}.yml`, top10yaml.join('\n'));
  fs.writeFile(`_posts/${date}-0${frontMatter.week}.md`, mustache.render(mdTpl, frontMatter));
});
});
