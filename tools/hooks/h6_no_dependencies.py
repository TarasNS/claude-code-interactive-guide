"""H6 no new dependencies (PreToolUse: Bash).

The spec requires a product with no runtime or build dependencies (SEC-12, SEC-14, section 4.1).
Installing packages or running a downloaded script is therefore blocked. If a dependency is ever
genuinely needed, that is a spec change first: it needs an SCA tool and an SBOM update.
"""
import re
import common

INSTALL = re.compile(
    r"(\b(npm|pnpm|yarn|bun)\s+(install|i|add|ci|update|upgrade)\b"
    r"|\bnpx\s+(?!--no-install\b)"
    r"|\bpip3?\s+install\b|\bpython[0-9.]*\s+-m\s+pip\s+install\b|\buv\s+(pip\s+install|add)\b"
    r"|\bpoetry\s+add\b|\bgem\s+install\b|\bcargo\s+(add|install)\b|\bgo\s+(get|install)\b"
    r"|\bchoco(latey)?\s+install\b|\bwinget\s+install\b)", re.I)
PIPE_TO_SHELL = re.compile(r"(curl|wget|iwr|Invoke-WebRequest|irm|Invoke-RestMethod)[^|\n]*\|\s*(sh|bash|zsh|iex|Invoke-Expression|python[0-9.]*)\b", re.I)


def main():
    data = common.payload()
    if data.get("tool_name") != "Bash":
        return
    cmd = common.command(data)
    if INSTALL.search(cmd):
        common.block("No-dependencies guard (H6): installing packages is blocked. This product has no dependencies by design "
                     "(SEC-12, SEC-14). If one is truly needed, change the spec first (SCA and SBOM), then ask the owner.")
    if PIPE_TO_SHELL.search(cmd):
        common.block("No-dependencies guard (H6): downloading and running a script in one step is blocked (untrusted code, SEC-12).")


if __name__ == "__main__":
    common.guarded(main)
