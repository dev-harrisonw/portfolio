#!/usr/bin/env python3
"""Stitch viewport JPEG/CDP captures into a 1440x2400 live seed."""
import json
import sys
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

WIDTH, HEIGHT = 1440, 2400


def load_image(path: Path) -> Image.Image:
    raw = path.read_bytes()
    if path.suffix == ".json":
        data = json.loads(raw)
        b64 = data.get("data")
        if not isinstance(b64, str) or len(b64) < 1000:

            def find(obj):
                if isinstance(obj, dict):
                    val = obj.get("data")
                    if isinstance(val, str) and len(val) > 1000:
                        return val
                    for child in obj.values():
                        found = find(child)
                        if found:
                            return found
                if isinstance(obj, list):
                    for child in obj:
                        found = find(child)
                        if found:
                            return found
                return None

            b64 = find(data)
        raw = base64.b64decode(b64)
    return Image.open(BytesIO(raw)).convert("RGB")


def stitch(pairs: list[tuple[int, Path]], dest: Path, sticky: int = 80) -> None:
    frames = [(y, load_image(path)) for y, path in pairs]
    width = frames[0][1].width
    out = Image.new("RGB", (width, HEIGHT), (12, 12, 12))
    dest_y = 0
    for index, (_y0, image) in enumerate(frames):
        skip = sticky if index > 0 else 0
        height = min(image.height - skip, HEIGHT - dest_y)
        if height <= 0:
            continue
        crop = image.crop((0, skip, width, skip + height))
        out.paste(crop, (0, dest_y))
        dest_y += height
    if width != WIDTH:
        out = out.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "JPEG", quality=86, optimize=True)
    print(f"wrote {dest} {out.size} {dest.stat().st_size}")


if __name__ == "__main__":
    # args: dest y:path y:path ...
    dest = Path(sys.argv[1])
    pairs = []
    for item in sys.argv[2:]:
        y, path = item.split(":", 1)
        pairs.append((int(float(y)), Path(path)))
    stitch(pairs, dest)
