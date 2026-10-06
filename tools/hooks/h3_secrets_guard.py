"""H3 secrets guard (UserPromptSubmit, and PreToolUse: Edit|Write|MultiEdit|NotebookEdit).

  - A prompt that contains a credential is blocked before it reaches the model
    (SEC-18, GOV-10: no credentials or confidential data in AI tools).
  - A write of a credential-type file (.env, private keys, .npmrc ...) or of text that looks
    like a credential is blocked (SEC-05).

The credential patterns are deliberately specific to keep false alarms rare. A pattern that
fires on something harmless should be tightened in common.py, not worked around.
"""
import common


def main():
    data = common.payload()
    event = data.get("hook_event_name")
    prompt = data.get("prompt") or data.get("user_prompt")
    if prompt is not None and event in (None, "UserPromptSubmit"):
        found = common.find_secrets(prompt)
        if found:
            common.block("Secrets guard (H3): the prompt looks like it contains a credential (%s). It was not sent. "
                         "Remove it and describe the value instead (SEC-18, GOV-10)." % ", ".join(found))
        return
    if data.get("tool_name") in common.WRITE_TOOLS:
        rel = common.rel_path(common.file_path(data), data) or str(common.file_path(data) or "")
        base = rel.replace("\\", "/")
        if common.SECRET_FILE.search(base) and not base.endswith((".example", ".sample")):
            common.block("Secrets guard (H3): %s is a credential-type file and must not be written into this repository (SEC-05). "
                         "Use .example with obviously fake values if a template is needed." % base)
        found = common.find_secrets(common.written_text(data))
        if found:
            common.block("Secrets guard (H3): the text being written looks like it contains a credential (%s) (SEC-05). "
                         "Use an obviously fictional placeholder." % ", ".join(found))


if __name__ == "__main__":
    common.guarded(main)
