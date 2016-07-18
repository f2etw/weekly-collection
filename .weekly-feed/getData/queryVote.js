var fs = require('mz/fs');
var argv = require('yargs').argv;
var jsdom = require('jsdom');
var prompt = require('prompt');

var confirmIssueNum = new Promise((resolve, reject) => {
  prompt.get([{
    name: 'issueNum',
    pattern: /^\d+$/,
    default: argv.issue || 6
  }], (err, result) => {
    if (err) {
      console.log(err);
      reject(result);
    }

    resolve(result);
  });
});

confirmIssueNum.then((result) => {
var url = `https://github.com/f2etw/weekly-collection/issues/${result.issueNum}`;

var member = [
  'Rplus',
  'whalesingswee',
  'amazingandyyy',
  'Clementtang',
  'erwaiyang',
  'noootown',
  'ryrocks'
];

var allowedReactions = ['+1', 'thinking_face', 'tada'];

var weight = {
  likes: 1,      /* 互動基數 */
  comments: 1.5, /* 鼓勵討論 */
  shares: 2,     /* 鼓勵擴散 */
  vote: 3        /* 些微調整 */
};

// includes polyfill from MDN
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}

jsdom.env({
  url: url,
  done: (err, window) => {
    if (err) { console.log(err); }

    var doc = window.document;
    var date = doc.title.match(/\d{4}-\d{2}-\d{2}/g)[0];

    var box = doc.querySelector('.js-discussion');
    var comments = [].slice.call(box.querySelectorAll('.timeline-comment-wrapper'));
    var targetComments = comments.filter((comment) => {
      var firstTd = comment.querySelector('tbody td');
      return !!firstTd && /^\# \d+/.test(firstTd.textContent);
    });

    var emojisData = targetComments.map((t) => {
      var reactionBtn = [].slice.call(t.querySelectorAll('.comment-reactions-options .reaction-summary-item'));

      var avatarBoxStyle = doc.getElementById('customAvatarBoxStyle');
      if (!avatarBoxStyle) {
        var style = doc.createElement('style');
        style.id = 'customAvatarBoxStyle';
        style.innerHTML = '.customAvatarBox img {width: 20px; height: 20px; vertical-align: top; margin-left: 3px; border-radius: 3px;}';
        doc.head.appendChild(style);
      }

      return reactionBtn.map((btn) => {
        var who = btn.getAttribute('aria-label').split(' reacted with')[0].replace(/,| and/g, '').split(/\s+/);

        return {
          reaction: btn.value.split(/\s+/)[0],
          who: who
        };
      });
    });

    var sumTable = emojisData.map((emojis, idx) => {
      var voteData = {};
      var _id = targetComments[idx].querySelector('.comment-body a').href.replace('https://fb.com/', '');

      console.log(idx, `https://fb.com/${_id}`);

      var tds = [].slice.call(targetComments[idx].querySelectorAll('tbody td'));
      var tdsData = tds.map((td) => {
        return td.textContent;
      });

      voteData.order = tdsData[0];
      voteData.likes = tdsData[1];
      voteData.comments = tdsData[2];
      voteData.shares = tdsData[3];

      voteData.vote = 0;

      emojis.forEach((emoji) => {
        if (allowedReactions.indexOf(emoji.reaction) === -1) { return; }

        var reaction = emoji.reaction;
        var people = emoji.who;

        people.forEach((t) => {
          voteData[t] = reaction;
        });
      });

      Object.keys(voteData).forEach((i) => {
        if (!member.includes(i)) { return; }

        switch (voteData[i]) {
          case '+1':
            voteData.vote += 1;
            break;

          case 'thinking_face':
            voteData.vote -= 1;
            break;

          case 'tada':
            if (i === member[0]) {
              console.log('tada');
              voteData.vote -= 500;
            }
            break;
        }
      });

      voteData.calcSum = voteData.likes * weight.likes + voteData.comments * weight.comments + voteData.shares * weight.shares + voteData.vote * weight.vote;

      voteData.postId = _id;

      return voteData;
    });

    window.sumTable = sumTable;

    window.top10 = sumTable.sort((a, b) => {
      return b.calcSum - a.calcSum;
    });

    // console.table(window.top10);
    // console.log('copy(top10)');

    // fs.writeFile(`.weekly-feed/getData/.t/vote-${date}-o.html`, doc.documentElement.outerHTML);
    // fs.writeFile(
    //   `.weekly-feed/getData/.t/vote-${date}.html`,
    //   targetComments.map(i => i.outerHTML).join('')
    // );
    fs.writeFile(
      `.weekly-feed/${date}-vote.json`,
      JSON.stringify(window.top10, null, 2) + '\n'
    );
  }
});
});
