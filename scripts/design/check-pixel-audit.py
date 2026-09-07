from pathlib import Path
from PIL import Image


ROOT = Path(".")
DARK = ROOT / "дизайн" / "темная"
LIGHT = ROOT / "дизайн" / "светлая "
AUDIT = ROOT / "docs" / "project" / "DESIGN_PIXEL_AUDIT.md"


def fail(message: str) -> None:
    raise SystemExit(message)


def hex_at(image: Image.Image, xy: tuple[int, int]) -> str:
    r, g, b = image.convert("RGB").getpixel(xy)
    return f"#{r:02x}{g:02x}{b:02x}"


def files(path: Path) -> list[Path]:
    return sorted(path.glob("*.png"))


dark_files = files(DARK)
light_files = files(LIGHT)
if len(dark_files) != 25:
    fail(f"dark pixel audit expected 25 PNG files, found {len(dark_files)}")
if len(light_files) != 20:
    fail(f"light pixel audit expected 20 PNG files, found {len(light_files)}")
if not AUDIT.exists():
    fail(f"missing pixel audit document: {AUDIT}")

audit = AUDIT.read_text(encoding="utf-8")

for path in dark_files:
    image = Image.open(path)
    expected_size = (1080, 1920) if path.name[:2] in {"21", "22", "23", "24", "25"} else (941, 1672)
    if image.size != expected_size:
        fail(f"{path} has {image.size}, expected {expected_size}")
    if path.name[:2] not in audit:
        fail(f"pixel audit missing dark screen {path.name[:2]}")

for path in light_files:
    image = Image.open(path)
    if image.size != (941, 1672):
        fail(f"{path} has {image.size}, expected (941, 1672)")

required_audit_terms = [
    "45 PNG references",
    "Dark compact: 941x1672",
    "Dark full: 1080x1920",
    "Light: 941x1672",
    "background samples",
    "center samples",
    "Visual Baselines",
    "390x844",
    "430x932",
    "1440x900",
    "Priority gaps",
]

for term in required_audit_terms:
    if term not in audit:
        fail(f"pixel audit missing term: {term}")

first_dark = Image.open(dark_files[0])
if hex_at(first_dark, (8, 8)) != "#030710":
    fail("dark onboarding top-left sample changed; refresh pixel audit")

print("design pixel audit ok")
