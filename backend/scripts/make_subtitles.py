"""
Creates real, timed subtitles from your voice recording — automatically.

It listens to the recording with Whisper (free speech recognition that runs
on your own computer — no account, no upload), writes down what you say,
and records when every word starts and ends. The result is saved into
backend/content/voice.json, so the voice note's subtitles follow your voice.

Run from the backend folder:

    python -m scripts.make_subtitles

Options:
    --model small       more accurate (default). "base" is faster, "medium" is best but slow.
    --language en       force a language (default: detected automatically, e.g. "ta" for Tamil)
    --file voice/x.m4a  a different recording inside backend/media/

The first run downloads the model once (~500 MB for "small").
Afterwards, open content/voice.json and fix any word it misheard —
the timings stay correct.
"""
import argparse
import json
import shutil
import sys

from app.config import CONTENT_DIR, MEDIA_DIR

VOICE_JSON = CONTENT_DIR / "voice.json"

# A new subtitle line starts after a sentence ends, after a pause,
# or when the line gets too long to read comfortably on a phone.
MAX_WORDS = 10
MAX_SECONDS = 5.5
PAUSE_SECONDS = 0.7


def group_into_cues(words: list[dict]) -> list[dict]:
    cues: list[dict] = []
    current: list[dict] = []

    def emit(chunk: list[dict]) -> None:
        cues.append(
            {
                "start": chunk[0]["start"],
                "end": chunk[-1]["end"],
                "text": " ".join(w["text"] for w in chunk),
                "words": chunk,
            }
        )

    def flush() -> None:
        if current:
            emit(list(current))
            current.clear()

    def split_at_comma() -> None:
        """Line too long: break after the last comma (reads naturally); otherwise break here."""
        cut = max((i for i, w in enumerate(current) if w["text"].endswith((",", ";", ":"))), default=-1)
        if cut >= 1:
            emit(current[: cut + 1])
            del current[: cut + 1]
        else:
            flush()

    for w in words:
        if current:
            pause = w["start"] - current[-1]["end"]
            if pause >= PAUSE_SECONDS:
                flush()
            elif len(current) >= MAX_WORDS or w["end"] - current[0]["start"] > MAX_SECONDS:
                split_at_comma()
        current.append(w)
        if w["text"].endswith((".", "!", "?")):
            flush()
    flush()
    return cues


def load_audio(path: str):
    """
    Decodes the recording to 16 kHz mono — what Whisper expects.
    Done here (instead of inside faster-whisper) so it works with any
    version of the PyAV audio library, old or new.
    """
    import av
    import numpy as np

    chunks = []
    with av.open(path) as container:
        stream = container.streams.audio[0]
        resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
        for frame in container.decode(stream):
            for out in resampler.resample(frame) or []:
                chunks.append(out.to_ndarray().reshape(-1))
        for out in resampler.resample(None) or []:  # flush what's left
            chunks.append(out.to_ndarray().reshape(-1))
    if not chunks:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate(chunks).astype(np.float32) / 32768.0


def transcribe(audio_path: str, model_size: str, language: str | None) -> tuple[list[dict], str]:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("✗ Whisper isn't installed. Run:  pip install faster-whisper")

    print(f"Loading the '{model_size}' model (first time downloads it — please wait)…")
    model = WhisperModel(model_size, device="auto", compute_type="int8")
    print("Listening to your recording…")
    audio = load_audio(audio_path)
    if audio.size == 0:
        sys.exit("✗ Couldn't read any sound from the recording. Is the file complete?")
    segments, info = model.transcribe(audio, language=language, word_timestamps=True, vad_filter=True)

    words = [
        {"start": round(w.start, 2), "end": round(w.end, 2), "text": w.word.strip()}
        for seg in segments
        for w in (seg.words or [])
        if w.word.strip()
    ]
    return words, info.language


def main() -> None:
    parser = argparse.ArgumentParser(description="Make timed subtitles for the voice note.")
    parser.add_argument("--model", default="small")
    parser.add_argument("--language", default=None)
    parser.add_argument("--file", default=None, help="path inside backend/media, e.g. voice/for-you.m4a")
    args = parser.parse_args()

    voice = json.loads(VOICE_JSON.read_text(encoding="utf-8")) if VOICE_JSON.exists() else {}
    rel = args.file or voice.get("src") or "voice/for-you.m4a"
    audio = MEDIA_DIR / rel
    if not audio.is_file():
        sys.exit(f"✗ Recording not found: {audio}")

    words, lang = transcribe(str(audio), args.model, args.language)
    if not words:
        sys.exit("✗ No speech was recognised. Is the recording silent or very quiet?")

    cues = group_into_cues(words)

    if VOICE_JSON.exists():
        shutil.copy(VOICE_JSON, VOICE_JSON.with_suffix(".backup.json"))
    voice.update({"src": rel, "cues": cues})
    voice.setdefault("title", "Before you blow out the candles")
    VOICE_JSON.write_text(json.dumps(voice, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\n✓ {len(cues)} subtitle lines ({len(words)} words, language: {lang}) saved to {VOICE_JSON}\n")
    for c in cues:
        print(f"  {c['start']:6.2f}s → {c['end']:6.2f}s   {c['text']}")
    print("\nIf a word is wrong, fix it in content/voice.json (in both \"text\" and \"words\").")
    print("No restart needed — reload the page and enter the voice code again.\n")


if __name__ == "__main__":
    main()