var fs = require('mz/fs');
var argv = require('yargs').argv;
var mustache = require('mustache');
var request = require('request');
var FBTOKEN = require('./token.json').facebook;

var date = argv.date;

if (!date) {
  date = require('./lastSunday').date;
}

var issueTpl = `| power# | likes | comments | shares |
|:------:|:-----:|:--------:|:------:|
| # {{ order }} | {{ power.1 }} | {{ power.2 }} | {{ power.3 }} |
* [fb permalink](https://fb.com/{{ id }}) @ \`{{ created_time }}\`
* who: [{{{ from.name }}}](https://facebook.com/{{ from.id }})  
![](https://graph.facebook.com/{{ from.id }}/picture?width=60&height=60)
{{# message }}
* intro:
\`\`\`
{{{ message }}}
\`\`\`
{{/ message }}
{{# icon }}
> ![]({{{ icon }}}): [{{ name }}]({{{ link }}})
{{/ icon }}
{{# description }}
> {{{ description }}}
{{/ description }}
{{#picture}}
> ![]({{{ picture }}})
{{/picture}}`;

console.log('Start date: ', date);

request({
  uri: `https://graph.facebook.com/521085554595481/feed?since=${+new Date(date) / 1000}&access_token=${FBTOKEN}&limit=200&fields=comments.limit(0).summary(true).filter(stream),likes.limit(0).summary(true),shares,created_time,updated_time,from,message,icon,link,name,description,picture`
}, (err, response, body) => {
  if (err) { console.log(err); }

  var data = JSON.parse(body).data;

  var since = +new Date(date);
  var until = since + 7 * 24 * 60 * 60 * 1000;
  var _time;
  console.log(`week since: ${new Date(since).toJSON()}, ${since}\nweek until: ${new Date(until).toJSON()}, ${until}`);

  var filteredData = data.filter((item) => {
    _time = +new Date(item.created_time);
    return _time >= since && _time <= until;
  });

  console.log(`The total number of feeds in this week is: ${filteredData.length}`);

  filteredData.forEach(stat => {
    var likes = stat.likes && stat.likes.summary.total_count || 0;
    var comments = stat.comments && stat.comments.summary.total_count || 0;
    var shares = stat.shares && stat.shares.count || 0;

    stat.power = [likes * 1 + comments * 1.5 + shares * 2, likes, comments, shares];
  });

  var top20 = filteredData.sort((fa, fb) => {
    return fb.power[0] - fa.power[0];
  }).slice(0, 20);

  var issue20 = top20.map((feed, index) => {
    feed.order = index + 1;

    if (feed.description) {
      feed.description = feed.description.replace(/\n/gm, '\n> ');
    }

    return mustache.render(issueTpl, feed);
  });

  // fs.writeFile(`.weekly-feed/${date}-o.json`, JSON.stringify(data, null, 2));
  // fs.writeFile(`.weekly-feed/${date}-f.json`, JSON.stringify(filteredData, null, 2));
  fs.writeFile(`.weekly-feed/${date}.json`, JSON.stringify(top20, null, 2));
  fs.writeFile(`.weekly-feed/issue-${date}.json`, JSON.stringify(issue20, null, 2).replace(/\#x2F\;/gm, '/'));
});
