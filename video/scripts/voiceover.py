"""Generate the voiceover for each scene with Microsoft's neural "Andrew" voice (edge-tts),
plus word timings for the captions.

Writes public/voiceover/<id>.mp3 and src/voiceover.json ([{id, durationMs, words:[{text,startMs,endMs}]}]).
Run from video/:  python scripts/voiceover.py
"""
import asyncio
import json
import pathlib
import subprocess

VOICE = "en-US-BrianMultilingualNeural"  # "approachable, casual"
RATE = "+7%"   # a touch quicker = more upbeat
PITCH = "+2Hz"

SCENES = [
    ("hook", "Okay, real talk. You know exactly what you want to say... until the camera turns on."),
    ("problem", "Read from another window, and your eyes drift right off the lens. Worse, your notes end up in your screen recording. Oops."),
    ("origin", "So here's how this started. A job application asked me to walk them through my AI agent workflow. There was a lot to cover, and I really didn't want to ramble. So I built a tool!"),
    ("reveal", "Say hi to Unseen Cue! A teleprompter that sits right under your webcam, so your eyes stay on the lens."),
    ("hidden", "And here's the magic: it stays out of your recordings. OBS, Loom, and screen sharing in Zoom, Meet and Teams see right through it. You see your script. Your video doesn't."),
    ("script", "Paste your script, type it, or just drop in a file. Headings, colours and cue boxes make every section super easy to find."),
    ("follow", "Voice follow scrolls while you talk, and pauses when you stop. Head follow waits whenever you look away. Pretty neat, right?"),
    ("custom", "Make it yours! Pick any font, size, colour and reading marker, and watch every change in a live preview."),
    ("responsible", "Quick note: it's made for creating. Videos, demos and presentations. Not for interviews or exams."),
    ("cta", "Unseen Cue. Free and open source, for Windows. Stay on script, and look at the lens!"),
]

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "voiceover"
OUT.mkdir(parents=True, exist_ok=True)


def duration_ms(path: pathlib.Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return round(float(out) * 1000)


async def make(scene_id: str, text: str) -> dict:
    import edge_tts

    comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    words = []
    path = OUT / f"{scene_id}.mp3"
    with open(path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000  # 100 ns ticks -> ms
                words.append({"text": chunk["text"], "startMs": round(start), "endMs": round(start + chunk["duration"] / 10_000)})
    # Spoken as "Unseen Cue" for a clear pronunciation; captions show the product name as one word.
    merged = []
    for w in words:
        if merged and merged[-1]["text"] == "Unseen" and w["text"].startswith("Cue"):
            merged[-1] = {"text": "Unseencue", "startMs": merged[-1]["startMs"], "endMs": w["endMs"]}
        else:
            merged.append(w)
    return {"id": scene_id, "text": text.replace("Unseen Cue", "Unseencue"), "durationMs": duration_ms(path), "words": merged}


async def main():
    result = [await make(i, t) for i, t in SCENES]
    (ROOT / "src" / "voiceover.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    for r in result:
        print(f"{r['id']:<12} {r['durationMs'] / 1000:5.2f}s  {len(r['words'])} words")
    print(f"total {sum(r['durationMs'] for r in result) / 1000:.1f}s")


asyncio.run(main())
