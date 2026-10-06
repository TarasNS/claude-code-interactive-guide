(function () {
  'use strict';
  var results = window.LabTests.run();
  var failed = results.filter(function (r) { return !r.pass; });
  var lines = results.map(function (r) {
    return (r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' -- ' + r.error);
  });
  lines.push(results.length - failed.length + ' of ' + results.length + ' passed');
  lines.push(failed.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
  document.getElementById('output').textContent = lines.join('\n');
  document.title = failed.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL';
})();
