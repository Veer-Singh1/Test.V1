"""Download artwork from Wikimedia Commons with its licence and credit.

  python pipeline/fetch_commons.py stories/dragons/art_picks.json public/dragons/art

The picks file is a list of {"slug": ..., "title": "File:..."}. Each file's licence is checked (public
domain, CC0, CC BY or CC BY-SA only: nothing non-commercial or no-derivatives), a 1920 px version is
saved as <slug>.jpg, and credits.json in the output folder gets an entry. Requests go one at a time, with
waits that respect Wikimedia's rate limits. Already downloaded slugs are skipped, so it can be re-run.
"""
import html
import io
import json
import re
import sys
import time
from pathlib import Path

import requests
from PIL import Image

UA = "lowpoly-explainer-research/1.0 (educational documentary; https://github.com/Veer-Singh1/Test.V1)"
API = "https://commons.wikimedia.org/w/api.php"
S = requests.Session()
S.headers["User-Agent"] = UA
OK_LICENCE = re.compile(r"public domain|^pd|cc0|cc[- ]by(?!.*\b(nc|nd)\b)", re.I)


def get(url, **kw):
    for attempt in range(8):
        r = S.get(url, timeout=120, **kw)
        if r.status_code == 200:
            return r
        if r.status_code in (429, 503):
            wait = int(r.headers.get("Retry-After", 0) or 0) or 20 * (attempt + 1)
            print(f"  {r.status_code}, waiting {wait} s", flush=True)
            time.sleep(min(wait, 900))
            continue
        r.raise_for_status()
    raise RuntimeError(f"gave up on {url}")


def text(meta, key):
    v = meta.get(key, {}).get("value", "")
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", str(v)))).strip()


def main():
    picks = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    cred_path = out / "credits.json"
    credits = json.loads(cred_path.read_text()) if cred_path.exists() else []
    have = {c["slug"] for c in credits}
    for p in picks:
        slug, title = p["slug"], p["title"]
        if slug in have and (out / f"{slug}.jpg").exists():
            continue
        info = get(API, params={"action": "query", "format": "json", "titles": title, "prop": "imageinfo",
                                "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1920}).json()
        page = next(iter(info["query"]["pages"].values()))
        if "imageinfo" not in page:
            print(f"MISSING {slug}: {title}", flush=True)
            continue
        ii = page["imageinfo"][0]
        meta = ii.get("extmetadata", {})
        lic = text(meta, "LicenseShortName") or text(meta, "License")
        if not OK_LICENCE.search(lic):
            print(f"SKIP {slug}: licence {lic!r}", flush=True)
            continue
        url = ii.get("thumburl") if ii.get("width", 0) > 1920 or ii.get("mime") != "image/jpeg" else ii["url"]
        time.sleep(3)
        img = Image.open(io.BytesIO(get(url).content)).convert("RGB")
        img.save(out / f"{slug}.jpg", quality=92)
        artist = text(meta, "Artist") or "Unknown"
        credits = [c for c in credits if c["slug"] != slug] + [{
            "slug": slug, "file": f"{slug}.jpg", "title": title.removeprefix("File:"),
            "creator": artist[:160], "date": text(meta, "DateTimeOriginal")[:80],
            "description": text(meta, "ImageDescription")[:300], "licence": lic,
            "attribution": f"{artist[:120]}, {lic}, via Wikimedia Commons",
            "commons_page": ii.get("descriptionurl", ""), "width": img.width, "height": img.height}]
        cred_path.write_text(json.dumps(credits, indent=1, ensure_ascii=False))
        print(f"OK {slug} {img.size} {lic}", flush=True)
        time.sleep(3)


if __name__ == "__main__":
    main()
