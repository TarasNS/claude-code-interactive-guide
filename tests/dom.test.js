(function () {
  'use strict';
  var T = window.LabTests;
  var h = window.Lab.dom.h;

  T.test('dom.h writes text as text, never as markup', function () {
    var el = h('p', null, '<img src=x onerror=alert(1)>');
    T.eq(el.children.length, 0);
    T.eq(el.textContent, '<img src=x onerror=alert(1)>');
  });

  T.test('dom.h drops string event handlers but keeps function handlers', function () {
    var clicked = 0;
    var el = h('button', { onclick: function () { clicked += 1; }, onmouseover: 'alert(1)' });
    T.eq(el.hasAttribute('onmouseover'), false);
    T.eq(el.hasAttribute('onclick'), false);
    el.click();
    T.eq(clicked, 1);
  });

  T.test('dom.h blocks javascript: and data: URLs, allows hash and https', function () {
    T.eq(h('a', { href: 'javascript:alert(1)' }).hasAttribute('href'), false);
    T.eq(h('a', { href: ' JaVa\nScRiPt:alert(1)' }).hasAttribute('href'), false);
    T.eq(h('a', { href: 'data:text/html,x' }).hasAttribute('href'), false);
    T.eq(h('a', { href: '#/map' }).getAttribute('href'), '#/map');
    T.eq(h('a', { href: 'https://example.com/' }).getAttribute('href'), 'https://example.com/');
  });

  T.test('dom.h refuses style attributes and malformed attribute names', function () {
    T.eq(h('div', { style: 'color:red' }).hasAttribute('style'), false);
    T.eq(h('div', { 'a b': 'x' }).attributes.length, 0);
  });
})();
