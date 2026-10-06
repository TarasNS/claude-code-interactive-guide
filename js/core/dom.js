(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var counter = 0;

  var URL_ATTRS = /^(href|src|action|formaction|xlink:href)$/i;
  var NAME_OK = /^[a-zA-Z][a-zA-Z0-9:_-]*$/;

  function isSafeAttribute(name, value) {
    if (!NAME_OK.test(name) || name.toLowerCase() === 'style') return false;
    if (URL_ATTRS.test(name)) {
      var text = String(value).replace(/[\u0000- ]/g, '');
      return /^(#|\/|\.|[a-z0-9-]+\/|https:)/i.test(text) || text === '';
    }
    return true;
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) {
          if (typeof v === 'function') el.addEventListener(k.slice(2), v);
        } else if (isSafeAttribute(k, v)) el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) child.forEach(function (c) { append(el, c); });
    else if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (isSafeAttribute(k, v) && k.indexOf('on') !== 0) el.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
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

  Lab.dom = { h: h, svg: svg, mount: mount, on: on, uid: uid };
})();
