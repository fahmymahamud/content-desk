# usage: python3 transcribe.py <any audio/video file> out.json [language]
# Free offline speech-to-text (Whisper base via sherpa-onnx, models from GitHub). Writes
# {"text":..., "seconds":..., "words":[{"w","s","e"}...]} with word times in seconds (estimated inside each spoken phrase).
import sys, os, json, subprocess, tempfile, numpy as np, soundfile as sf
src, out = sys.argv[1], sys.argv[2]; lang = sys.argv[3] if len(sys.argv) > 3 else ""
M = os.environ.get("ASR", "models/sherpa-onnx-whisper-base")
os.makedirs("models", exist_ok=True)
if not os.path.exists(M + "/base-tokens.txt"):
    subprocess.run("curl -sSL -o models/w.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-base.tar.bz2 && tar xjf models/w.tar.bz2 -C models && rm models/w.tar.bz2", shell=True, check=True)
VAD = "models/silero_vad.onnx"
if not os.path.exists(VAD):
    subprocess.run(["curl", "-sSL", "-o", VAD, "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx"], check=True)
import sherpa_onnx
wav = tempfile.mktemp(suffix=".wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
x, sr = sf.read(wav, dtype="float32"); os.remove(wav)
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + "/base-encoder.int8.onnx", decoder=M + "/base-decoder.int8.onnx", tokens=M + "/base-tokens.txt", language=lang, task="transcribe", num_threads=2)
cfg = sherpa_onnx.VadModelConfig(); cfg.silero_vad.model = VAD; cfg.silero_vad.min_silence_duration = 0.25; cfg.silero_vad.min_speech_duration = 0.2; cfg.silero_vad.max_speech_duration = 20; cfg.sample_rate = 16000
vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=600)
segs = []; w = cfg.silero_vad.window_size
for i in range(0, len(x), w):
    vad.accept_waveform(x[i:i + w])
    while not vad.empty(): segs.append((vad.front.start, np.array(vad.front.samples))); vad.pop()
vad.flush()
while not vad.empty(): segs.append((vad.front.start, np.array(vad.front.samples))); vad.pop()
words = []; texts = []
for start, s in segs:
    st = rec.create_stream(); st.accept_waveform(16000, s); rec.decode_stream(st)
    t = st.result.text.strip()
    if not t: continue
    texts.append(t); ws = t.split(); s0 = start / 16000; d = len(s) / 16000
    tot = sum(len(v) + 1 for v in ws); pos = 0
    for v in ws:
        a = s0 + pos / tot * d; pos += len(v) + 1; words.append({"w": v, "s": round(a, 3), "e": round(s0 + pos / tot * d, 3)})
json.dump({"text": " ".join(texts), "seconds": round(len(x) / 16000, 2), "words": words}, open(out, "w"), ensure_ascii=False)
print("transcript:", " ".join(texts)[:3000])
