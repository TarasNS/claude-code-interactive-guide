#!/usr/bin/env python3
"""Validate Claude Engineering Lab mission files against spec.md §9 and §11.

Usage:
    python validate_mission.py FILE [FILE ...]

Exit code 0 when every file has no errors (warnings allowed), 1 otherwise.
"""
import io
import json
import re
import sys

# spec §9.1: id -> (number, stage, mission XP)
MISSIONS = {
    "orientation": (0, "start", 10),
    "intent": (1, "plan", 30),
    "spec": (2, "design", 30),
    "plan": (3, "build", 40),
    "context": (4, "build", 30),
    "skills": (5, "build", 60),
    "hooks": (6, "build", 30),
    "agents": (7, "build", 40),
    "feedback": (8, "test", 30),
    "evals": (9, "test", 30),
    "review": (10, "deploy", 30),
    "gates": (11, "deploy", 30),
    "pipeline": (12, "deploy", 30),
    "loop": (13, "maintain", 30),
    "final": (14, "maintain", 50),
}

# spec §9.3-§9.17: required activity id -> maxXp
ACTIVITIES = {
    "orientation.where": 10,
    "intent.sort": 30,
    "spec.trace": 15, "spec.which": 15,
    "plan.review": 25, "plan.when": 15,
    "context.classify": 20, "context.build": 10,
    "skills.description": 25, "skills.inspect": 20, "skills.classify": 15,
    "hooks.build": 20, "hooks.choose": 10,
    "agents.choose": 40,
    "feedback.arrange": 15, "feedback.run": 15,
    "evals.classify": 10, "evals.gate": 20,
    "review.triage": 20, "review.who": 10,
    "gates.policy": 10, "gates.detect": 20,
    "pipeline.happy": 10, "pipeline.incident": 20,
    "loop.intent": 30,
    "final.workflow": 50,
}

BEAT_TYPES = {"explain", "show", "try", "debrief", "deeper"}
COMPONENTS = {"choice", "classifier", "compare", "stepper", "terminal", "pipeline", "builder", "tree", "flagger", "textlab"}
STAGES = {"start", "plan", "design", "build", "test", "deploy", "maintain"}
MAX_WORDS = 60
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️]")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load(path):
    text = io.open(path, encoding="utf-8").read()
    start = text.find("Lab.content.registerMission(")
    end = text.rfind(");")
    if start < 0 or end < 0:
        raise ValueError("file must contain Lab.content.registerMission({...});")
    before = text[:start].strip()
    if before and not (before.startswith("//") and "\n" not in before):
        raise ValueError("only a single first-line // comment may precede registerMission")
    if text[end + 2:].strip():
        raise ValueError("nothing may follow the closing ');'")
    body = text[start + len("Lab.content.registerMission("):end]
    try:
        return json.loads(body), text
    except json.JSONDecodeError as e:
        raise ValueError("mission object is not strict JSON: %s" % e)


def words(s):
    return len(re.findall(r"\S+", s or ""))


def walk_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from walk_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_strings(v)


def has_claude_lines(cfg):
    if not isinstance(cfg, dict):
        return False
    script = cfg.get("script") or []
    return any(isinstance(l, dict) and l.get("who") == "claude" for l in script)


def validate(path):
    errors, warnings = [], []
    try:
        m, raw = load(path)
    except (ValueError, OSError) as e:
        return [str(e)], []

    mid = m.get("id")
    if mid not in MISSIONS:
        return ["unknown mission id %r; expected one of %s" % (mid, ", ".join(MISSIONS))], []
    number, stage, xp = MISSIONS[mid]
    expect = {"number": number, "stage": stage, "xp": xp}
    for k, v in expect.items():
        if m.get(k) != v:
            errors.append("%s should be %r (spec §9.1), found %r" % (k, v, m.get(k)))
    for k in ("title", "minutes", "beats", "links", "claims"):
        if k not in m:
            errors.append("missing field %r" % k)
    if m.get("stage") not in STAGES:
        errors.append("stage must be one of %s" % sorted(STAGES))

    for k in ("reviewedBy", "reviewedOn"):
        if k not in m:
            errors.append("missing field %r (use null in drafts)" % k)
    if m.get("reviewedBy") is None or m.get("reviewedOn") is None:
        warnings.append("not yet reviewed by a named human (GOV-08): reviewedBy/reviewedOn are null")
    elif not DATE.match(str(m.get("reviewedOn"))):
        errors.append("reviewedOn must be YYYY-MM-DD")

    beats = m.get("beats") or []
    if not beats:
        errors.append("beats is empty")
    if beats and beats[-1].get("type") != "debrief":
        errors.append("the last beat must be a debrief (spec §9.2)")

    required_ids, seen_ids = {}, set()
    for i, b in enumerate(beats, 1):
        where = "beat %d (%s)" % (i, b.get("heading", "no heading"))
        t = b.get("type")
        if t not in BEAT_TYPES:
            errors.append("%s: type must be one of %s" % (where, sorted(BEAT_TYPES)))
            continue
        if not b.get("heading"):
            errors.append("%s: heading is required" % where)
        if t != "deeper" and not b.get("simple"):
            errors.append("%s: simple text is required" % where)
        if t == "deeper" and not b.get("deeper"):
            errors.append("%s: deeper beats need deeper text" % where)
        for field in ("simple", "deeper"):
            n = words(b.get(field))
            if n > MAX_WORDS:
                errors.append("%s: %s text has %d words; the limit is %d (spec §5.3, §14.7)" % (where, field, n, MAX_WORDS))
        comp = b.get("component")
        if t in ("show", "try") and comp not in COMPONENTS:
            errors.append("%s: component must be one of %s" % (where, sorted(COMPONENTS)))
        if has_claude_lines(b.get("config")) and b.get("simulated") is not True:
            errors.append("%s: contains scripted Claude lines but simulated is not true (GOV-09)" % where)
        if t == "debrief":
            for field in ("humanDecides", "addsNode"):
                if not b.get(field):
                    errors.append("%s: debrief needs %s" % (where, field))
        if t == "try":
            a = b.get("activity")
            if not isinstance(a, dict):
                errors.append("%s: try beats need an activity" % where)
                continue
            aid = a.get("id", "")
            if not aid.startswith(mid + "."):
                errors.append("%s: activity id %r must start with %r" % (where, aid, mid + "."))
            if aid in seen_ids:
                errors.append("%s: duplicate activity id %r" % (where, aid))
            seen_ids.add(aid)
            if not isinstance(a.get("maxXp"), int):
                errors.append("%s: activity maxXp must be an integer" % where)
            if not a.get("completion"):
                errors.append("%s: activity needs a completion rule" % where)
            item_ids = set()
            for it in a.get("items") or []:
                iid = it.get("id")
                if not iid or iid in item_ids:
                    errors.append("%s: item ids must be present and unique (%r)" % (where, iid))
                item_ids.add(iid)
                for field in ("text", "answer", "explanation"):
                    if not it.get(field):
                        errors.append("%s: item %r is missing %s" % (where, iid, field))
                expl = (it.get("explanation") or "").strip().lower().rstrip(".!")
                if expl in ("correct", "right", "yes", "no", "wrong", "incorrect"):
                    errors.append("%s: item %r explanation must say why, not just %r" % (where, iid, it.get("explanation")))
                buckets = a.get("buckets")
                if buckets:
                    for ans in [it.get("answer")] + list(it.get("acceptable") or []):
                        if ans and ans not in buckets:
                            errors.append("%s: item %r answer %r is not one of the buckets" % (where, iid, ans))
            if b.get("required", True):
                required_ids[aid] = a.get("maxXp")

    expected = {k: v for k, v in ACTIVITIES.items() if k.startswith(mid + ".")}
    for aid, mx in expected.items():
        if aid not in required_ids:
            errors.append("required activity %r (maxXp %d) is missing" % (aid, mx))
        elif required_ids[aid] != mx:
            errors.append("activity %r maxXp should be %d (spec §9), found %r" % (aid, mx, required_ids[aid]))
    for aid in required_ids:
        if aid not in expected:
            errors.append("activity %r is not in the spec; mark it \"required\": false or change the spec first" % aid)
    total = sum(v for v in required_ids.values() if isinstance(v, int))
    if total != xp:
        errors.append("required activities total %d XP; mission XP is %d (spec §9.1)" % (total, xp))

    for c in m.get("claims") or []:
        if not c.get("text"):
            errors.append("claim without text")
        elif not c.get("verified"):
            warnings.append("unverified claim (spec §16.4): %s" % c["text"][:80])
        elif not DATE.match(str(c["verified"])):
            errors.append("claim verified date must be YYYY-MM-DD")
    for l in m.get("links") or []:
        if not l.get("label") or not l.get("linkId"):
            errors.append("links need label and linkId (URLs live in links.js, SEC-03)")

    for s in walk_strings(m):
        if EMOJI.search(s):
            errors.append("emoji or symbol character found in: %r" % s[:60])
            break
    if re.search(r"https?://", raw):
        errors.append("raw URL found; put URLs in js/content/links.js and reference them by linkId (SEC-03)")

    return errors, warnings


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    failed = False
    for path in argv:
        errors, warnings = validate(path)
        status = "FAIL" if errors else "PASS"
        print("%s %s" % (status, path))
        for e in errors:
            print("  error:   " + e)
        for w in warnings:
            print("  warning: " + w)
        failed = failed or bool(errors)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
