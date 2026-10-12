"""Report provider readiness without exposing credentials or environment values."""
import json
import pathlib
import subprocess

for unit in ("ai-lawyer-api", "ai-lawyer-ai"):
    pid = subprocess.check_output(
        ["systemctl", "show", unit, "--property=MainPID", "--value"], text=True
    ).strip()
    values = {}
    try:
        items = pathlib.Path(f"/proc/{pid}/environ").read_bytes().split(b"\0") if pid.isdigit() and pid != "0" else []
    except (PermissionError, FileNotFoundError):
        print("AIZAN_AI_CONFIG " + json.dumps({"service": unit, "status": "unavailable"}))
        continue
    for item in items:
        key, _, value = item.partition(b"=")
        values[key.decode(errors="replace")] = value.decode(errors="replace")
    print("AIZAN_AI_CONFIG " + json.dumps({
        "service": unit,
        "openai_selected": values.get("AI_PROVIDER", "").lower() == "openai",
        "key_configured": bool(values.get("AI_API_KEY") or values.get("OPENAI_API_KEY")),
        "model_configured": bool(values.get("OPENAI_MODEL") or any(
            values.get(name, "") and not values[name].startswith("stub-")
            for name in ("AI_COMPLEX_MODEL", "AI_MEDIUM_MODEL")
        )),
    }))
