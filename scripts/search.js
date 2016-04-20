/* global fetch */

var search = {
  form: document.querySelector('.Search'),
  input: document.querySelector('.Search__input'),
  ul: document.querySelector('.SearchLists'),
  kwdBuffer: 10
};

search.fetchData = () => {
  if (!fetch) {
    window.alert('We use fetch to get search data.');
    return;
  }

  fetch('../search_data.json')
    .then((res) => res.json())
    .then((data) => {
      search.data = data.map((week) => {
        week.stringify = week.items.map((item) => {
          return Object.keys(item).map((itemProp) => item[itemProp]).join();
        }).join();

        return week;
      });
    });
};

search.queryKwd = ($kwd) => {
  search.matchedArr = [];
  search.kwd = $kwd.trim();
  search.pattern = new RegExp(`(?:.{0,${search.kwdBuffer}})${search.kwd}(?:.{0,${search.kwdBuffer}})`, 'gi');

  search.data.forEach((week) => {
    var matchedItem = week.stringify.match(search.pattern);

    if (matchedItem) {
      search.matchedArr.push({
        week: week,
        string: matchedItem
      });
    }
  });

  search.renderResult();
};

search.renderResult = () => {
  var html = search.matchedArr.map((item) => {
    var pattern = new RegExp(`(${search.kwd})`, 'ig');
    var matchedStr = item.string.map((str) => {
      str = str.replace(pattern, `<mark>$1</mark>`);
      return `<dd class="SearchLists__item truncate">${str}</dd>`;
    }).join('');

    return `
    <dl class="mb1">
      <a href="${item.week['post-url']}?mark=${search.kwd}">${item.week['date-since']}</a>
    </dl>
    ${matchedStr}
    `;
  });

  search.ul.innerHTML = html.join('');
};

search.binding = () => {
  search.form.addEventListener('submit', (e) => {
    e.preventDefault();
    var searchValue = search.input.value;

    if (searchValue && search.data) {
      search.queryKwd(searchValue);
    }
  });
};

search.init = () => {
  search.fetchData();
  search.binding();
};

search.init();
