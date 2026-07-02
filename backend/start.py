"""Startup helper — loads .env (UTF-8 with BOM) then runs uvicorn in-process."""
import os
from pathlib import Path

env_path = Path(__file__).parent / ".env"
# utf-8-sig strips the UTF-8 BOM automatically
for line in env_path.read_text(encoding="utf-8-sig").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, val = line.partition("=")
    key = key.strip()
    val = val.strip().strip('"').strip("'")
    os.environ[key] = val  # always override

import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=8001)
