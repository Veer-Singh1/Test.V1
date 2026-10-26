"""Find, review and download licensed stock media for the shots in scenes.ASSETS.

Sources: Pexels API, Pixabay API and Wikimedia Commons (CC0 / CC BY / public domain only).
Needs PEXELS_API_KEY and PIXABAY_API_KEY in the environment (Commons needs no key).

    python -m pipeline.fetch_assets --candidates            # search; contact sheets in build/candidates/
    python -m pipeline.fetch_assets --pick lightning=3      # download candidate #3 for "lightning"
    python -m pipeline.fetch_assets --auto                  # download the top-ranked candidate for every
                                                            # key that has no pick yet

Every download is logged in assets/credits.csv (file, source, page URL, author, licence) and the
choice is recorded in assets/selected.json so the selection is reproducible.
"""
import argparse
import csv
import datetime as dt
import html
import io
import json
import os
import re

import requests
from PIL import Image, ImageDraw

from . import timeline
from .config import ASSETS, BUILD, FONT
from .scenes import ASSETS as WANTED

UA = {"User-Agent": "ohms-law-video/1.0 (educational explainer; https://github.com/veer-singh1/test.v1)"}
CAND = BUILD / "candidates"
CREDITS = ASSETS / "credits.csv"
SELECTED = ASSETS / "selected.json"
FIELDS = ["file", "key", "source", "source_url", "author", "author_url", "license", "license_url", "downloaded"]
COMMONS_OK = re.compile(r"^(CC0|Public domain|PD\b|PD-|CC BY \d(\.\d)?$|CC-BY-\d(\.\d)?$)", re.I)
PEXELS_LICENSE = ("Pexels License", "https://www.pexels.com/license/")
PIXABAY_LICENSE = ("Pixabay Content License", "https://pixabay.com/service/license-summary/")


def _get(url, **kw):
    r = requests.get(url, headers={**UA, **kw.pop("headers", {})}, timeout=30, **kw)
    r.raise_for_status()
    return r


def need_seconds():
    """Longest on-screen time each asset key is used for (shot + crossfade tail)."""
    out = {}
    for sh in timeline.load()["shots"]:
        if sh["kind"] in ("footage", "photo"):
            out[sh["key"]] = max(out.get(sh["key"], 0), sh["duration"] + sh["tail"])
    return out


# ---------- searches: each returns a list of candidate dicts ----------
def pexels(query, kind):
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        return []
    hdr = {"Authorization": key}
    if kind == "video":
        data = _get("https://api.pexels.com/videos/search", headers=hdr,
                    params={"query": query, "orientation": "landscape", "size": "large", "per_page": 15}).json()
        out = []
        for v in data.get("videos", []):
            files = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4" and f.get("width")]
            hd = sorted([f for f in files if f["width"] >= 1920], key=lambda f: f["width"]) or \
                sorted(files, key=lambda f: -f["width"])
            if not hd:
                continue
            pic = (v.get("video_pictures") or [{}])[0].get("picture") or v.get("image")
            out.append({"source": "Pexels", "id": v["id"], "page": v["url"], "author": v["user"]["name"],
                        "author_url": v["user"]["url"], "license": PEXELS_LICENSE, "download": hd[0]["link"],
                        "ext": ".mp4", "width": hd[0]["width"], "height": hd[0]["height"],
                        "duration": v.get("duration", 0), "thumb": pic, "title": query})
        return out
    data = _get("https://api.pexels.com/v1/search", headers=hdr,
                params={"query": query, "orientation": "landscape", "size": "large", "per_page": 15}).json()
    return [{"source": "Pexels", "id": p["id"], "page": p["url"], "author": p["photographer"],
             "author_url": p["photographer_url"], "license": PEXELS_LICENSE,
             "download": p["src"]["original"] + "?auto=compress&cs=tinysrgb&w=2800", "ext": ".jpg",
             "width": min(p["width"], 2800), "height": int(p["height"] * min(1, 2800 / p["width"])), "duration": 0,
             "thumb": p["src"]["medium"], "title": p.get("alt") or query} for p in data.get("photos", [])]


def pixabay(query, kind):
    key = os.environ.get("PIXABAY_API_KEY")
    if not key:
        return []
    if kind == "video":
        data = _get("https://pixabay.com/api/videos/",
                    params={"key": key, "q": query, "per_page": 20, "safesearch": "true"}).json()
        out = []
        for h in data.get("hits", []):
            sizes = [s for s in h.get("videos", {}).values() if s.get("url") and s.get("width")]
            ok = sorted([s for s in sizes if s["width"] >= 1920], key=lambda s: s["width"]) or \
                sorted(sizes, key=lambda s: -s["width"])
            if not ok:
                continue
            out.append({"source": "Pixabay", "id": h["id"], "page": h["pageURL"], "author": h["user"],
                        "author_url": f"https://pixabay.com/users/{h['user']}-{h['user_id']}/",
                        "license": PIXABAY_LICENSE, "download": ok[0]["url"], "ext": ".mp4",
                        "width": ok[0]["width"], "height": ok[0]["height"], "duration": h.get("duration", 0),
                        "thumb": ok[0].get("thumbnail"), "title": h.get("tags", query)})
        return out
    data = _get("https://pixabay.com/api/", params={"key": key, "q": query, "image_type": "photo",
                                                     "orientation": "horizontal", "min_width": 1920,
                                                     "per_page": 20, "safesearch": "true"}).json()
    # without approved full API access Pixabay only serves 1280 px images, so these rank low
    return [{"source": "Pixabay", "id": h["id"], "page": h["pageURL"], "author": h["user"],
             "author_url": f"https://pixabay.com/users/{h['user']}-{h['user_id']}/", "license": PIXABAY_LICENSE,
             "download": h.get("fullHDURL") or h["largeImageURL"], "ext": ".jpg",
             "width": 1920 if h.get("fullHDURL") else 1280, "height": 1080 if h.get("fullHDURL") else 720,
             "duration": 0, "thumb": h["previewURL"], "title": h.get("tags", query)} for h in data.get("hits", [])]


def commons(query, kind):
    ftype = "video" if kind == "video" else "bitmap"
    data = _get("https://commons.wikimedia.org/w/api.php", params={
        "action": "query", "format": "json", "generator": "search", "gsrsearch": f"{query} filetype:{ftype}",
        "gsrnamespace": 6, "gsrlimit": 20, "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": 2800}).json()
    out = []
    for page in (data.get("query", {}).get("pages") or {}).values():
        ii = (page.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if not COMMONS_OK.search(lic.strip()) or re.search(r"\b(SA|NC|ND)\b", lic):
            continue
        author = re.sub(r"<[^>]+>", "", html.unescape(meta.get("Artist", {}).get("value", "Unknown"))).strip()
        video = kind == "video"
        out.append({"source": "Wikimedia Commons", "id": page["title"], "page": ii.get("descriptionurl"),
                    "author": author or "Unknown", "author_url": "", "license": (lic, meta.get("LicenseUrl", {}).get("value", "")),
                    "download": ii["url"] if video or ii.get("width", 0) <= 2800 else ii.get("thumburl", ii["url"]),
                    "ext": os.path.splitext(ii["url"])[1].lower() or ".jpg", "width": ii.get("width", 0),
                    "height": ii.get("height", 0), "duration": float(ii.get("duration", 0) or 0),
                    "thumb": ii.get("thumburl"), "title": page["title"]})
    return out


SEARCH = {"pexels": pexels, "pixabay": pixabay, "commons": commons}


def rank(c, kind, need):
    s = 0.0
    if c["width"] >= 1920:
        s += 2
    if c["width"] and c["height"] and abs(c["width"] / c["height"] - 16 / 9) < 0.25:
        s += 1
    if kind == "video":
        s += 1.5 if c["duration"] >= need + 1 else (0.5 if c["duration"] * 1.6 >= need else -3)
        s -= 0.5 if c["duration"] > 40 else 0
    s += {"Pexels": 0.3, "Pixabay": 0.2}.get(c["source"], 0)
    return s


def candidates(key, limit=12):
    spec = WANTED[key]
    need = need_seconds().get(key, 6)
    found, seen = [], set()
    for src in spec.get("sources", ["pexels", "pixabay", "commons"]):
        for q in spec["queries"]:
            try:
                for c in SEARCH[src](q, spec["kind"]):
                    ident = (c["source"], c["id"])
                    if ident not in seen:
                        seen.add(ident)
                        found.append(c)
            except requests.RequestException as e:
                print(f"  {src} '{q}': {e}")
    found.sort(key=lambda c: -rank(c, spec["kind"], need))
    return found[:limit]


def contact_sheet(key, cands):
    tiles = []
    f = ImageFont_safe(26)
    for i, c in enumerate(cands):
        try:
            im = Image.open(io.BytesIO(_get(c["thumb"]).content)).convert("RGB")
        except Exception:  # noqa: BLE001 - a missing thumbnail just leaves a blank tile
            im = Image.new("RGB", (480, 270), (40, 40, 40))
        im.thumbnail((480, 270))
        tile = Image.new("RGB", (480, 320), (11, 26, 51))
        tile.paste(im, ((480 - im.width) // 2, 0))
        d = ImageDraw.Draw(tile)
        info = f"#{i} {c['source']} {c['width']}x{c['height']}" + (f" {c['duration']:.0f}s" if c["duration"] else "")
        d.text((8, 284), info, fill=(241, 245, 249), font=f)
        tiles.append(tile)
    cols = 4
    rows = max(1, (len(tiles) + cols - 1) // cols)
    sheet = Image.new("RGB", (cols * 480, rows * 320), (0, 0, 0))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 480, (i // cols) * 320))
    CAND.mkdir(parents=True, exist_ok=True)
    sheet.save(CAND / f"{key}.jpg", quality=88)


def ImageFont_safe(size):
    from PIL import ImageFont
    return ImageFont.truetype(str(FONT["Medium"]), size)


def download(key, c):
    sub = "footage" if WANTED[key]["kind"] == "video" else "photos"
    (ASSETS / sub).mkdir(parents=True, exist_ok=True)
    for old in (ASSETS / sub).glob(f"{key}.*"):
        old.unlink()
    path = ASSETS / sub / f"{key}{c['ext']}"
    with _get(c["download"], stream=True) as r, open(path, "wb") as f:
        for chunk in r.iter_content(1 << 20):
            f.write(chunk)
    rows = []
    if CREDITS.exists():
        with open(CREDITS, newline="", encoding="utf-8") as fh:
            rows = [r for r in csv.DictReader(fh) if r["key"] != key]
    rows.append({"file": str(path.relative_to(ASSETS.parent)), "key": key, "source": c["source"],
                 "source_url": c["page"], "author": c["author"], "author_url": c["author_url"],
                 "license": c["license"][0], "license_url": c["license"][1], "downloaded": dt.date.today().isoformat()})
    with open(CREDITS, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(sorted(rows, key=lambda r: r["key"]))
    sel = json.loads(SELECTED.read_text()) if SELECTED.exists() else {}
    sel[key] = {k: c[k] for k in ("source", "id", "page", "download", "ext", "width", "height", "duration")}
    SELECTED.write_text(json.dumps(sel, indent=1))
    print(f"  {key}: {c['source']} {c['id']} -> {path.name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", nargs="*", metavar="KEY")
    ap.add_argument("--pick", nargs="*", metavar="KEY=N")
    ap.add_argument("--auto", action="store_true")
    args = ap.parse_args()
    if not (os.environ.get("PEXELS_API_KEY") or os.environ.get("PIXABAY_API_KEY")):
        print("note: PEXELS_API_KEY / PIXABAY_API_KEY not set; only Wikimedia Commons will be searched")
    if args.candidates is not None:
        for key in args.candidates or WANTED:
            cands = candidates(key)
            CAND.mkdir(parents=True, exist_ok=True)
            (CAND / f"{key}.json").write_text(json.dumps(cands, indent=1, default=str))
            contact_sheet(key, cands)
            print(f"{key}: {len(cands)} candidates -> build/candidates/{key}.jpg")
    for item in args.pick or []:
        key, n = item.split("=")
        cands = json.loads((CAND / f"{key}.json").read_text())
        download(key, cands[int(n)])
    if args.auto:
        sel = json.loads(SELECTED.read_text()) if SELECTED.exists() else {}
        for key in WANTED:
            if key in sel:
                continue
            f = CAND / f"{key}.json"
            cands = json.loads(f.read_text()) if f.exists() else candidates(key)
            if cands:
                download(key, cands[0])
            else:
                print(f"  {key}: no licensed candidates found")


if __name__ == "__main__":
    main()
