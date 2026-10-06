# Mission file format

Each mission is one file, `js/content/missions/mNN-<id>.js` (for example `m06-hooks.js`). The file calls `Lab.content.registerMission` with a single object. **The object must be strict JSON**: double-quoted keys and strings, no comments, no trailing commas, no functions. That lets CI and `validate_mission.py` parse it without a JavaScript engine.

```js
Lab.content.registerMission({
  "id": "hooks",
  ...
});
```

Nothing else may appear in the file except a single optional first-line comment with the file name.

## Mission object

| Field | Type | Rule |
|---|---|---|
| `id` | string | The id from spec §9.1 (`orientation`, `intent`, `spec`, `plan`, `context`, `skills`, `hooks`, `agents`, `feedback`, `evals`, `review`, `gates`, `pipeline`, `loop`, `final`) |
| `number` | integer | 0 to 14, from §9.1 |
| `stage` | string | `start`, `plan`, `design`, `build`, `test`, `deploy` or `maintain` |
| `title` | string | The mission name from §9.1 |
| `minutes` | integer | Estimated minutes to complete |
| `xp` | integer | The mission's XP from §9.1; must equal the sum of its required activities' `maxXp` |
| `reviewedBy` | string or null | Named human reviewer (GOV-08). `null` in drafts |
| `reviewedOn` | string or null | `YYYY-MM-DD`. `null` in drafts |
| `beats` | array | Ordered beats, see below |
| `links` | array | `{ "label": "...", "linkId": "..." }`; `linkId` refers to an entry in `js/content/links.js` |
| `claims` | array | `{ "text": "...", "verified": null or "YYYY-MM-DD", "source": null or "docs page title" }` |

## Beat object

| Field | Type | Rule |
|---|---|---|
| `type` | string | `explain`, `show`, `try`, `debrief` or `deeper` |
| `heading` | string | One key message, as a short sentence or phrase |
| `simple` | string | Plain-English text, at most 60 words. Required except on `deeper` beats |
| `deeper` | string | Optional extra precision for Go deeper mode, at most 60 words. Required on `deeper` beats |
| `component` | string | Optional for `explain`; required for `show` and `try`: `choice`, `classifier`, `compare`, `stepper`, `terminal`, `pipeline`, `builder`, `tree` |
| `config` | object | Component configuration (steps, views, script, scenario, tree) |
| `simulated` | boolean | `true` on any beat whose `config.script` contains `"who": "claude"` lines |
| `caption` | string | Optional; use it to say "illustrative" where behaviour is not typical |
| `activity` | object | Required on `try` beats, see below |
| `required` | boolean | Default `true`. Set `false` for optional activities; `deeper` beats are never required |
| `humanDecides` | string | Required on `debrief` beats: what the human still decides |
| `addsNode` | string | Required on `debrief` beats: the Your System node id this mission adds (§12) |

## Activity object

| Field | Type | Rule |
|---|---|---|
| `id` | string | `<missionId>.<name>`, for example `hooks.build` |
| `maxXp` | integer | From the mission's section in the spec |
| `completion` | string | Plain description of the completion rule from the spec, for example `"all items correctly placed"` |
| `buckets` | array of strings | For classifiers: the bucket labels, in display order |
| `items` | array | See below; may be empty for activities whose content is in `config` (for example a terminal run) |

## Item object

| Field | Type | Rule |
|---|---|---|
| `id` | string | Unique within the activity |
| `text` | string | What the learner sees |
| `answer` | string | The correct bucket, option or flag |
| `acceptable` | array of strings | Optional: other defensible answers |
| `explanation` | string | Required: why the answer is right. Shown after every placement |
| `note` | string | Optional nuance, for example "but knowing is not enforcing; see Hooks" |

## Simulated script lines (inside `config.script`)

`{ "who": "cmd" | "out" | "claude", "text": "...", "status": "ok" | "fail" | "info" }`. `who: "claude"` lines make the beat simulated.

## Minimal example

```js
// m06-hooks.js
Lab.content.registerMission({
  "id": "hooks",
  "number": 6,
  "stage": "build",
  "title": "Hooks",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "Instructions guide; hooks enforce",
      "simple": "A hook is an automatic rule that runs when Claude tries to do something. If the rule fails, the action is blocked and Claude is told why.",
      "deeper": "Hooks run deterministic commands around tool-use events. They can allow an action, ask a human, or deny it with a reason that is returned to Claude."
    },
    {
      "type": "try",
      "heading": "Skill or hook?",
      "simple": "Decide which rules only need guidance and which must always hold.",
      "component": "classifier",
      "activity": {
        "id": "hooks.choose",
        "maxXp": 10,
        "completion": "all items correctly placed",
        "buckets": ["Skill", "Hook"],
        "items": [
          {
            "id": "prod",
            "text": "Never deploy to production without approval.",
            "answer": "Hook",
            "explanation": "It must hold every time, so it needs a check that runs whether or not Claude remembers the rule."
          }
        ]
      }
    }
  ],
  "links": [],
  "claims": [
    { "text": "Hooks can allow, ask or deny an action, and the denial reason is returned to Claude.", "verified": null, "source": null }
  ]
});
```

(The example is shortened: a real Hooks mission has all the beats and both activities from spec §9.9, and its activity XP adds up to 30.)
