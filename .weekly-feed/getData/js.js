/* global fetch, WC, Mustache, Blob, URL */
console.log('init', 111);

// weekColection
window.WC = {};
WC.apiDomain = 'https://graph.facebook.com/';

WC.config = {
  power: {
    likes: 1,
    comments: 1.5,
    shares: 2,
    vote: 3
  },
  perpage: 200,
  groupId: '521085554595481',
  fbToken: '1385521591772831|lMcuWxJls6aEK-IwR0Z-_AQVMV4'
};

WC.calcPow = function (stat) {
  var power = WC.config.power;
  var likes = stat.likes && stat.likes.summary.total_count || 0;
  var comments = stat.comments && stat.comments.summary.total_count || 0;
  var shares = stat.shares && stat.shares.count || 0;
  return [likes * power.likes + comments * power.comments + shares * power.shares, likes, comments, shares];
};

WC.sortData = function (_feeds) {
  if (!_feeds) {
    _feeds = WC.feeds.origin;
  }

  _feeds.forEach(function (feed) {
    feed.power = WC.calcPow(feed);
  });

  WC.feeds.sorted = _feeds.sort((feed1, feed2) => {
    return feed2.power[0] - feed1.power[0];
  });

  WC.feeds.top20 = WC.feeds.sorted.slice(0, 20);

  console.log('WC.feeds.top20, WC.feeds.sorted all done!');
};

WC.genarateMD = (data) => {
  var tpl = document.getElementById('template').innerHTML.trim();
  var html = [];

  data.forEach(function (feed, index) {
    // console.log(feed);
    feed.order = index + 1;
    html.push(Mustache.render(tpl, feed));
  });

  var lists = document.querySelector('.popular-lists');
  lists.innerHTML = html.join('');
  lists.addEventListener('click', function (e) {
    document.execCommand('SelectAll', false, null);
    document.execCommand('copy', false, null);
  });
};

WC.filterByCreatedTime = (data) => {
  if (!data) {
    data = WC.feeds.origin;
  }

  var since = +new Date(WC.queryURL.since);
  var until = since + 6 * 24 * 60 * 60 * 1000;
  var _time;

  data = data.filter((item) => {
    _time = +new Date(item.created_time.split(/T/)[0]);
    return _time >= since && _time <= until;
  });

  console.log('filted', data);

  return data;
};

WC.getGroupFeed = function (url) {
  return new Promise(function (resolve, reject) {
    url = url || WC.feedUrl;
    var allFeeds = [];

    fetch(url).then(function (response) {
      return response.json();
    })
    .then(function (posts) {
      console.log('o-data', posts);
      allFeeds = allFeeds.concat(posts.data);

      if (posts.data.length >= WC.config.perpage && posts.paging && posts.paging.next) {
        return WC.getGroupFeed(posts.paging.next);
      } else {
        console.log('fetch end');
        return allFeeds;
      }
    })
    .catch(function (err) {
      console.log('err msg: ' + err);
      reject(err);
      return 'ccc';
    })
    .then(function (data) {
      resolve(data);
    });
  });
};

WC.queryURL = ((key) => {
  if (!window.location.search) { return false; }
  var qObj = {};
  window.location.search.substring(1).split('&').forEach((pair) => {
    var kv = pair.split('=');
    qObj[kv[0]] = kv[1] || '';
  });
  return qObj;
})();

WC.getSavedFeeds = () => {
  return new Promise(function (resolve, reject) {
    fetch(`../${WC.queryURL.since}.json`).then((response) => {
      return response.json();
    })
    .then(function (posts) {
      return posts;
    })
    .catch(function (err) {
      console.log('err msg: ' + err);
      reject(err);
      return 'ccc';
    })
    .then(function (data) {
      resolve(data);
    });
  });
};

WC.renderTop10 = () => {
  WC.genarateMD(WC.feeds.top10);
  var lists = document.querySelector('.popular-lists');
  lists.innerHTML = lists.innerHTML.replace(/contenteditable/g, '');
};

WC.renderYAML = () => {
  var yamlBox = document.getElementById('yaml');
  var yamlTpl = document.getElementById('yaml-template').innerHTML;
  var _html = WC.feeds.top10.map((data) => {
    data.cover = data.picture ? decodeURIComponent(data.picture.split(/&url=([^&]+)/)[1]) : '';
    return Mustache.render(yamlTpl, data);
  });

  yamlBox.innerHTML = _html.join('');
  WC.bindDownload(_html.join(''), `${WC.queryURL.since}.yml`);
};

WC.bindDownload = (text, filename) => {
  var downloadLink = document.getElementById('download');

  downloadLink.addEventListener('click', () => {
    var file = new Blob([text], {type: 'text/plain'});
    downloadLink.href = URL.createObjectURL(file);
    downloadLink.download = filename;
  });
};

WC.calcVotedResult = () => {
  fetch(`../${WC.queryURL.since}-vote.json`)
  .then((response) => response.json())
  .then((voteData) => {
    var _weight = WC.config.power;
    var voteResult = {};

    voteData.forEach((data) => {
      voteResult[data.postId] = data.vote;
    });

    WC.feeds.top20.forEach((feed) => {
      feed.powerObj = {
        likes: feed.power[1],
        comments: feed.power[2],
        shares: feed.power[3],
        vote: voteResult[feed.id] || 0
      };

      feed.powerObj.sum = ['likes', 'comments', 'shares', 'vote'].map((i) => {
        return feed.powerObj[i] * _weight[i];
      }).reduce((prev, curr) => prev + curr);
    });

    WC.feeds.top20withOrder = WC.feeds.top20.sort((feed1, feed2) => {
      return feed2.powerObj.sum - feed1.powerObj.sum;
    });

    WC.feeds.top10 = WC.feeds.top20withOrder.slice(0, 10);

    console.log('WC.feeds.top10 generated!');

    if (WC.queryURL.yaml === '') {
      WC.renderYAML();
    } else {
      WC.renderTop10();
    }
  })
  .catch(function (err) {
    console.log('err msg: ' + err);
    console.log('fetch fails!!!');
    return 'ccc';
  });
};

WC.init = () => {
  if (!WC.queryURL) { return; }
  var since = +new Date(WC.queryURL.since) / 1000;
  var feedFields = [
    'comments.limit(0).summary(true).filter(stream)',
    'likes.limit(0).summary(true)',
    'shares',
    'created_time', 'updated_time', 'from', 'message',
    'icon', 'link', 'name', 'description', 'picture'
  ];
  WC.feedUrl = `${WC.apiDomain}${WC.config.groupId}/feed?since=${since}&access_token=${WC.config.fbToken}&limit=${WC.config.perpage}&fields=${feedFields.join(',')}`;

  if (WC.queryURL.top10 || WC.queryURL.top10 === '') {
    WC.getSavedFeeds().then(($feeds) => {
      var opOrder;

      WC.feeds = WC.feeds || {};
      WC.feeds.top10 = [];
      WC.feeds.top20 = $feeds;

      if (WC.queryURL.top10) {
        opOrder = WC.queryURL.top10.split(',');
        opOrder.forEach((order, idx) => {
          WC.feeds.top10[idx] = WC.feeds.top20[+order];
        });

        if (WC.queryURL.yaml === '') {
          WC.renderYAML();
        } else {
          WC.renderTop10();
        }

      } else {
        WC.calcVotedResult();
      }
    });
  } else {
    WC.getGroupFeed().then((data) => {
      WC.feeds = {
        origin: data,
        sorted: null,
        top10: null,
        top20: null
      };

      WC.feeds.filted = WC.filterByCreatedTime();
      WC.sortData(WC.feeds.filted);
      WC.genarateMD(WC.feeds.top20);
    });
  }
};

WC.init();
