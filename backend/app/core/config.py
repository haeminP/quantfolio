import os
from pathlib import Path

ML4T_DATA_DIR = Path(os.getenv(
    "ML4T_DATA_DIR",
    str(Path.home() / "Desktop" / "OMSCS" / "ML4T_2026Spring" / "data"),
))
