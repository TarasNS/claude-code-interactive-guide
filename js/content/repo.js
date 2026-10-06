(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.content = Lab.content || {};

  // All file contents are fictional (spec 13). No real hostnames, keys or customer data.
  Lab.content.trees = {
    claimsportal: {
      name: 'claims-portal', type: 'dir',
      purpose: 'ClaimsPortal: the fictional customer self-service claims portal used in every mission.',
      children: [
        { name: 'CLAUDE.md', type: 'file', purpose: 'The repository onboarding document that Claude reads. Absent in the "without" replay in Mission 4.',
          sample: '# ClaimsPortal\n\n## Commands\n- Test: npm test\n- Build: npm run build\n\n## Conventions\n- API responses use camelCase.\n\n## Important rules\n- Never log customer personal data.' },
        { name: 'package.json', type: 'file', purpose: 'Scripts and metadata. The project uses npm.',
          sample: '{\n  "name": "claims-portal",\n  "scripts": {\n    "test": "node tests/run.js",\n    "build": "node build.js"\n  }\n}' },
        { name: 'src', type: 'dir', purpose: 'Application code.', children: [
          { name: 'api', type: 'dir', purpose: 'HTTP routes and middleware.', children: [
            { name: 'routes', type: 'dir', purpose: 'One file per resource.', children: [
              { name: 'claims.js', type: 'file', purpose: 'Routes for claims.',
                sample: 'router.get("/claims/:id", auth, async (req, res) => {\n  const claim = await getClaim(req.params.id);\n  res.json(claim);\n});' }
            ] },
            { name: 'middleware', type: 'dir', purpose: 'Code shared by routes.', children: [
              { name: 'auth.js', type: 'file', purpose: 'Authentication, shared by every route. A change here affects the whole API.',
                sample: 'function auth(req, res, next) {\n  if (!req.session) return res.status(401).end();\n  next();\n}' }
            ] }
          ] },
          { name: 'services', type: 'dir', purpose: 'Business logic.', children: [
            { name: 'claimService.js', type: 'file', purpose: 'Reads claims. getClaim(id) returns one claim.',
              sample: 'async function getClaim(id) {\n  return db.claims.find(id);\n}' }
          ] },
          { name: 'lib', type: 'dir', purpose: 'Small shared helpers.', children: [
            { name: 'logger.js', type: 'file', purpose: 'Logging helper.',
              sample: 'function log(message) {\n  console.log(message);\n}' }
          ] }
        ] },
        { name: 'tests', type: 'dir', purpose: 'Automated tests.', children: [
          { name: 'claimService.test.js', type: 'file', purpose: 'Tests for the claim service.',
            sample: 'test("getClaim returns a claim", async () => {\n  const claim = await getClaim("c-100");\n  expect(claim.id).toBe("c-100");\n});' },
          { name: 'claims.status.test.js', type: 'file', purpose: 'Tests for the status endpoint. It is the failing test in Missions 8 and 14.',
            sample: 'test("status returns nextStep", async () => {\n  const res = await get("/claims/c-100/status");\n  expect(res.body.nextStep).toBeDefined();\n});' }
        ] },
        { name: '.claude', type: 'dir', purpose: 'Claude Code settings and Skills for this repository.', children: [
          { name: 'skills', type: 'dir', purpose: 'Skills shared with the team.', children: [
            { name: 'secure-api-review', type: 'dir', purpose: 'A Skill for reviewing API endpoints.', children: [
              { name: 'SKILL.md', type: 'file', purpose: 'The Skill itself. Its description tells Claude when to use it.',
                sample: '---\nname: secure-api-review\ndescription: "Reviews API endpoints for security problems. Use when ..."\n---\n\n# Secure API review\n...' }
            ] }
          ] }
        ] }
      ]
    },

    skill: {
      name: 'secure-api-review', type: 'dir',
      purpose: 'A Skill is a folder, built once, that teaches Claude a repeatable kind of work. The folder name is kebab-case.',
      children: [
        { name: 'SKILL.md', type: 'file', required: true, purpose: 'Required. The file name must be exactly SKILL.md. The frontmatter holds the name and description, and the body holds the instructions.',
          sample: '---\nname: secure-api-review\ndescription: "Reviews new API endpoints for security problems. Use when the user says \\"review this endpoint\\"."\n---\n\n# Secure API review\n\n1. Check authentication.\n2. Check what the response returns.\n3. Check the logs for personal data.' },
        { name: 'scripts', type: 'dir', optional: true, purpose: 'Optional. Scripts that the instructions can run for checks that must be exact.', children: [
          { name: 'check-endpoint.sh', type: 'file', purpose: 'An example check script.', sample: '#!/bin/sh\n# Fails if a route has no auth middleware.\ngrep -L "auth" "$1"' }
        ] },
        { name: 'references', type: 'dir', optional: true, purpose: 'Optional. Longer documents that load only when needed.', children: [
          { name: 'api-rules.md', type: 'file', purpose: 'The team\'s API rules.', sample: '# API rules\n\n- Every route requires authentication.\n- Responses never include personal data.' }
        ] },
        { name: 'assets', type: 'dir', optional: true, purpose: 'Optional. Templates and other files the Skill produces output from.', children: [
          { name: 'report-template.md', type: 'file', purpose: 'A template for the review report.', sample: '# Review report\n\n## Findings\n\n## Suggested fixes' }
        ] }
      ]
    }
  };
})();
