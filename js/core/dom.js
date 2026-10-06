(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var counter = 0;

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) child.forEach(function (c) { append(el, c); });
    else if (child.nodeType) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }

  function mount(container, node) {
    while (container.firstChild) container.removeChild(container.firstChild);
    append(container, node);
    return container;
  }

  function on(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    return function () { el.removeEventListener(type, fn, opts); };
  }

  function uid(prefix) {
    counter += 1;
    return (prefix || 'id') + '-' + counter;
  }

  Lab.dom = { h: h, mount: mount, on: on, uid: uid };
})();
