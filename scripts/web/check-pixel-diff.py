from pathlib import Path
from PIL import Image, ImageChops, ImageStat


ROOT = Path(".")
DARK = ROOT / "дизайн" / "темная"
BASELINES = ROOT / "docs" / "project" / "web-visual-baselines"
REPORT = ROOT / "docs" / "project" / "WEB_PIXEL_DIFF.md"
VIEW = "mobile-ref-390"
SCREEN_MAP = {
    "01": "onboarding",
    "02": "login",
    "03": "register",
    "04": "otp",
    "05": "biometric",
    "06": "home",
    "07": "newCase",
    "08": "category",
    "09": "documentCheck",
    "10": "documentUpload",
    "11": "analysis",
    "12": "claim",
    "13": "claimDraft",
    "14": "claimSend",
    "15": "cases",
    "16": "case",
    "17": "chat",
    "18": "deadlines",
    "19": "legal",
    "20": "legalSearch",
    "21": "documents",
    "22": "profile",
    "23": "settings",
    "24": "subscription",
    "25": "help",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def mse_percent(reference: Image.Image, actual: Image.Image) -> float:
    diff = ImageChops.difference(reference.convert("RGB"), actual.convert("RGB"))
    stat = ImageStat.Stat(diff)
    mse = sum(value ** 2 for value in stat.rms) / 3
    return mse / (255 ** 2) * 100


rows: list[tuple[str, str, float]] = []
for number, view in SCREEN_MAP.items():
    matches = sorted(DARK.glob(f"{number}_*.png"))
    if not matches:
        fail(f"missing dark reference for screen {number}")
    baseline = BASELINES / f"{VIEW}-dark-{number}-{view}.png"
    if not baseline.exists():
        fail(f"missing web baseline: {baseline}")
    actual = Image.open(baseline).convert("RGB")
    reference = Image.open(matches[0]).convert("RGB").resize(actual.size, Image.Resampling.LANCZOS)
    rows.append((number, view, mse_percent(reference, actual)))

worst = sorted(rows, key=lambda item: item[2], reverse=True)[:8]
closed = [(number, view, score) for number, view, score in rows if score <= 4]
open_screens = [(number, view, score) for number, view, score in rows if score > 4]
REPORT.write_text(
    "\n".join(
        [
            "# Web Pixel Diff",
            "",
            "Generated from dark PNG references and web `mobile-ref-390` baselines.",
            "",
            "| Screen | View | MSE % |",
            "|---|---|---:|",
            *[f"| {number} | `{view}` | {score:.2f} |" for number, view, score in rows],
            "",
            "## Closed Screens",
            "",
            *[f"- {number} `{view}`: {score:.2f}%" for number, view, score in closed],
            "",
            "## Next Screen Queue",
            "",
            *[f"- {number} `{view}`: {score:.2f}%" for number, view, score in worst],
            "",
            f"Note: {len(open_screens)} screens remain above the 4% release threshold.",
        ]
    )
    + "\n",
    encoding="utf-8",
)

print(f"web pixel diff report written: {REPORT}")
