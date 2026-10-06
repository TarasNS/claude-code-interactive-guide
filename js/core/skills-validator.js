(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  var START = 'Helps with APIs.';
  var SKILL_NAME = 'secure-api-review';
  var BROAD = ['anything', 'all tasks', 'any code', 'everything', 'helps with'];
  var GOOD_EXAMPLE = 'Reviews new or changed API endpoints for security problems. Use when the user says "review this endpoint", "check this route for security", or "add an external API endpoint".';

  function clean(text) { return String(text == null ? '' : text); }

  function lower(text) { return clean(text).toLowerCase(); }

  function afterWhen(text) {
    var l = lower(text);
    var a = l.indexOf('use when');
    var b = l.indexOf('when the user');
    var at = -1;
    var len = 0;
    if (a >= 0 && (b < 0 || a <= b)) { at = a; len = 8; }
    else if (b >= 0) { at = b; len = 13; }
    return at < 0 ? '' : clean(text).slice(at + len);
  }

  function quotedPhrases(text) {
    var found = clean(text).match(/"[^"]+"|“[^”]+”/g);
    return found ? found.length : 0;
  }

  function commaTerms(text) {
    return afterWhen(text).split(',').map(function (t) { return t.trim(); }).filter(Boolean).length;
  }

  // Each rule: { id, label, pass, message }
  function validate(description) {
    var d = clean(description).trim();
    var l = d.toLowerCase();
    var hasWhen = /use when|when the user/.test(l);
    var rules = [];

    var okLength = d.length >= 60 && d.length <= 1024;
    rules.push({
      id: 'length', label: 'Length (60 to 1024 characters)', pass: okLength,
      message: okLength ? 'Length is fine (' + d.length + ' characters).'
        : (d.length < 60 ? 'Too short (' + d.length + ' characters) to tell Claude when to load the Skill.' : 'Over the 1024 character limit.')
    });

    var okTags = d.indexOf('<') < 0 && d.indexOf('>') < 0;
    rules.push({
      id: 'tags', label: 'No angle brackets', pass: okTags,
      message: okTags ? 'No angle brackets.' : 'Frontmatter appears in Claude\'s context, so angle brackets are not allowed.'
    });

    var okWhat = /review|security|endpoint|api/.test(l);
    rules.push({
      id: 'what', label: 'Says what the Skill does', pass: okWhat,
      message: okWhat ? 'It says what the Skill does.' : 'Say what the Skill does, for example reviewing API endpoints for security.'
    });

    rules.push({
      id: 'when', label: 'Has a "use when" clause', pass: hasWhen,
      message: hasWhen ? 'It says when to use the Skill.' : 'Add a "use when" clause that says when Claude should load it.'
    });

    var okTriggers = quotedPhrases(d) >= 2 || (hasWhen && commaTerms(d) >= 3);
    rules.push({
      id: 'triggers', label: 'Includes real trigger phrases', pass: okTriggers,
      message: okTriggers ? 'It includes phrases a user would really say.'
        : 'Include phrases a user would really say: at least two quoted phrases, or three comma-separated terms after "use when".'
    });

    var hit = BROAD.filter(function (w) { return l.indexOf(w) >= 0; });
    rules.push({
      id: 'broad', label: 'Not too broad', pass: hit.length === 0,
      message: hit.length === 0 ? 'It is narrow enough not to fire on unrelated work.'
        : 'Too broad (' + hit.join(', ') + '). It will fire on unrelated work, so narrow the scope.'
    });

    return {
      rules: rules,
      allPass: rules.every(function (r) { return r.pass; })
    };
  }

  function rule(result, id) {
    return result.rules.filter(function (r) { return r.id === id; })[0];
  }

  // Simulated heuristic (spec 9.8.1): four prompts, two that should trigger and two that must not.
  function triggerTest(description) {
    var v = validate(description);
    var l = lower(description);
    var what = rule(v, 'what').pass;
    var when = rule(v, 'when').pass;
    var narrow = rule(v, 'broad').pass;

    var t1 = (/endpoint|api/.test(l)) && what && when;
    var t2 = (/review|security/.test(l)) && when;
    var t3 = !narrow;

    return [
      { prompt: 'Add an external API endpoint for claim status', expected: 'triggers', triggered: t1, pass: t1,
        reason: t1 ? 'The description names endpoints or APIs and says when to use it.' : 'The description does not clearly cover this request. Mention endpoints or APIs and add a "use when" clause.' },
      { prompt: 'Review this new route for security problems', expected: 'triggers', triggered: t2, pass: t2,
        reason: t2 ? 'The description mentions review or security and says when to use it.' : 'Mention review or security, and add a "use when" clause.' },
      { prompt: 'Change the button colour to blue', expected: 'does not trigger', triggered: t3, pass: !t3,
        reason: !t3 ? 'The description is narrow, so unrelated work does not trigger it.' : 'The description is so broad that it would fire on unrelated work.' },
      { prompt: 'Explain how our CI pipeline works', expected: 'does not trigger', triggered: t3, pass: !t3,
        reason: !t3 ? 'The description is narrow, so unrelated work does not trigger it.' : 'The description is so broad that it would fire on unrelated work.' }
    ];
  }

  function evaluate(description) {
    var v = validate(description);
    var t = triggerTest(description);
    return { rules: v.rules, tests: t, allPass: v.allPass && t.every(function (x) { return x.pass; }) };
  }

  function yamlQuote(text) {
    return '"' + clean(text).replace(/\s+/g, ' ').trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  function buildSkillMd(description) {
    return [
      '---',
      'name: ' + SKILL_NAME,
      'description: ' + yamlQuote(description),
      '---',
      '',
      '# Secure API review',
      '',
      '## Instructions',
      '',
      '1. Confirm the endpoint requires authentication and uses the shared auth middleware.',
      '2. Check that the response returns only the fields the specification names.',
      '3. Confirm no personal data is written to logs.',
      '4. Check for a test that covers an unauthorised request.',
      '5. Report each finding with the file, the line and a suggested fix.',
      '',
      '## Notes',
      '',
      'This is an example Skill from the Claude Engineering Lab. It uses the fictional ClaimsPortal project.',
      ''
    ].join('\n');
  }

  // Checks a SKILL.md text: delimiters, kebab-case name, description present, no angle brackets in frontmatter.
  function checkSkillMd(text) {
    var problems = [];
    var t = clean(text).replace(/\r\n/g, '\n');
    if (t.indexOf('---\n') !== 0) problems.push('frontmatter must start with ---');
    var end = t.indexOf('\n---', 4);
    if (end < 0) problems.push('frontmatter is missing the closing ---');
    var front = end < 0 ? '' : t.slice(4, end);
    var name = /^name: (.*)$/m.exec(front);
    if (!name) problems.push('missing name');
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name[1])) problems.push('name is not kebab-case');
    if (!/^description: .+$/m.test(front)) problems.push('missing description');
    if (/[<>]/.test(front)) problems.push('angle brackets in frontmatter');
    return problems;
  }

  Lab.skills = {
    START: START,
    SKILL_NAME: SKILL_NAME,
    GOOD_EXAMPLE: GOOD_EXAMPLE,
    validate: validate,
    triggerTest: triggerTest,
    evaluate: evaluate,
    buildSkillMd: buildSkillMd,
    checkSkillMd: checkSkillMd
  };
})();
