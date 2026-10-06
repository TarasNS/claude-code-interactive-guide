(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // config.root: { name, type: 'dir', purpose, children: [{ name, type: 'dir' | 'file', purpose, sample, children }] }
  // config.highlight: array of paths ("src/api/routes/claims.js") shown as "Read by Claude".

  function flatten(node, path, depth, out, openMap) {
    var full = path ? path + '/' + node.name : node.name;
    out.push({ node: node, path: full, depth: depth });
    if (node.type === 'dir' && node.children && openMap[full] !== false) {
      node.children.forEach(function (c) { flatten(c, full, depth + 1, out, openMap); });
    }
  }

  // Pure: the rows currently visible, given which directories are collapsed.
  function visibleRows(root, openMap) {
    var out = [];
    flatten(root, '', 0, out, openMap || {});
    return out;
  }

  function create(ctx) {
    var cfg = ctx.config || {};
    var root = typeof cfg.root === 'string' ? Lab.content.trees[cfg.root] : cfg.root;
    var state = { open: {}, selected: root.name, focus: root.name, highlight: (cfg.highlight || []).slice() };
    if (ctx.initialState) {
      state.open = ctx.initialState.open || {};
      state.selected = ctx.initialState.selected || state.selected;
    }
    var box = h('div', { class: 'tree-box' });

    function rows() { return visibleRows(root, state.open); }

    function focusRow(path) {
      state.focus = path;
      var el = box.querySelector('[data-path="' + path + '"]');
      if (el) el.focus();
    }

    function emit() { if (ctx.onState) ctx.onState({ open: state.open, selected: state.selected }); }

    function toggle(path, open) {
      state.open[path] = open;
      emit();
      render();
      focusRow(path);
    }

    function select(path) {
      state.selected = path;
      state.focus = path;
      emit();
      render();
      focusRow(path);
    }

    function onKey(e, row) {
      var list = rows();
      var i = list.map(function (r) { return r.path; }).indexOf(row.path);
      var isDir = row.node.type === 'dir';
      var isOpen = state.open[row.path] !== false;
      var key = e.key;
      if (key === 'ArrowDown') { e.preventDefault(); if (list[i + 1]) focusRow(list[i + 1].path); }
      else if (key === 'ArrowUp') { e.preventDefault(); if (list[i - 1]) focusRow(list[i - 1].path); }
      else if (key === 'Home') { e.preventDefault(); focusRow(list[0].path); }
      else if (key === 'End') { e.preventDefault(); focusRow(list[list.length - 1].path); }
      else if (key === 'ArrowRight') {
        e.preventDefault();
        if (isDir && !isOpen) toggle(row.path, true);
        else if (isDir && list[i + 1] && list[i + 1].depth > row.depth) focusRow(list[i + 1].path);
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (isDir && isOpen) toggle(row.path, false);
        else {
          for (var k = i - 1; k >= 0; k--) if (list[k].depth < row.depth) { focusRow(list[k].path); break; }
        }
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        if (isDir) state.open[row.path] = !isOpen;
        select(row.path);
      }
    }

    function render() {
      var list = rows();
      var items = list.map(function (row) {
        var isDir = row.node.type === 'dir';
        var isOpen = state.open[row.path] !== false;
        var rel = row.path.indexOf('/') >= 0 ? row.path.slice(row.path.indexOf('/') + 1) : '';
        var hl = state.highlight.indexOf(row.path) >= 0 || (rel !== '' && state.highlight.indexOf(rel) >= 0);
        var el = h('li', {
          role: 'treeitem',
          class: 'tree-item' + (state.selected === row.path ? ' tree-selected' : '') + (hl ? ' tree-read' : ''),
          'data-path': row.path,
          'data-type': row.node.type,
          'aria-level': row.depth + 1,
          'aria-selected': state.selected === row.path ? 'true' : 'false',
          'aria-expanded': isDir ? (isOpen ? 'true' : 'false') : null,
          tabindex: state.focus === row.path ? '0' : '-1'
        },
          h('span', { class: 'tree-indent', 'data-depth': row.depth }),
          h('span', { class: 'tree-name' }, (isDir ? (isOpen ? '[-] ' : '[+] ') : '') + row.node.name + (isDir ? '/' : '')),
          hl ? h('span', { class: 'tree-flag' }, ' Read by Claude') : null
        );
        el.style.paddingLeft = (row.depth * 20 + 8) + 'px';
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (isDir) state.open[row.path] = !isOpen;
          select(row.path);
        });
        el.addEventListener('keydown', function (e) { e.stopPropagation(); onKey(e, row); });
        return el;
      });

      var current = list.filter(function (r) { return r.path === state.selected; })[0] || list[0];
      var info = [h('h3', { class: 'tree-title' }, current.node.name + (current.node.type === 'dir' ? '/' : ''))];
      if (current.node.purpose) info.push(h('p', null, current.node.purpose));
      if (current.node.optional) info.push(h('p', { class: 'tree-optional' }, h('strong', null, 'Optional')));
      if (current.node.required) info.push(h('p', { class: 'tree-optional' }, h('strong', null, 'Required')));
      if (current.node.sample) info.push(h('pre', { class: 'tree-sample', tabindex: '0', 'aria-label': 'Contents of ' + current.node.name }, current.node.sample));

      mount(box, [
        h('ul', { class: 'tree', role: 'tree', 'aria-label': cfg.label || 'Files' }, items),
        h('div', { class: 'tree-info' }, info)
      ]);
    }

    render();
    return {
      el: box,
      getState: function () { return { open: state.open, selected: state.selected }; },
      setHighlight: function (paths) { state.highlight = paths.slice(); render(); }
    };
  }

  Lab.ui.register('tree', create);
  Lab.ui.tree = { visibleRows: visibleRows };
})();
