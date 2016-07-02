javascript: (function () {
  var data = [];

  var textarea = document.getElementById('new_comment_field');

  document.querySelector('.js-discussion').addEventListener('DOMNodeInserted', (e) => {
    if (e.target.tagName === 'DIV' && e.target.classList.contains('timeline-comment-wrapper')) {
      data.shift();
      console.log('shift', data.length);
      if (data.length) {
        console.log('ccc');
        autoSubmit();
      }
    }
  }, false);

  var autoSubmit = () => {
    setTimeout(function () {
      textarea.value = data[0];
      textarea.closest('form').querySelector('.btn.btn-primary').click();
    }, 2000);
  };

  var dialog = document.createElement('dialog');
  var input = document.createElement('input');

  input.type = 'file';

  input.addEventListener('change', (e) => {
    console.log(e.target.files[0]);
    var file = new window.FileReader();
    file.onload = (evt) => {
      var result = evt.target.result;
      data = JSON.parse(result);
      autoSubmit();
      dialog.remove();
      input.remove();
    };
    file.readAsText(e.target.files[0]);
  });

  dialog.appendChild(input);
  document.body.appendChild(dialog);

  dialog.showModal();
}());
