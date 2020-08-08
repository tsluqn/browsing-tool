function $(selector) {
  return document.querySelector(selector);
}
$.on = function (selector, event, listener) {
  $(selector).addEventListener(event, listener);
}

$.click = function (selector, listener) {
  $.on(selector, "click", listener);
}

$.un = function (selector, event, listener) {
  $(selector).removeEventListener(event, listener);
}

$.delegate = function (selector, tag, event, listener) {
  $.on(selector, event, e => {
      if (e.target.tagName.toLowerCase() == tag.toLowerCase()) {
          listener(e);
      }
  });
}
