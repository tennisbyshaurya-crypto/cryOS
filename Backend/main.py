from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import io
import numpy as np
import librosa
import joblib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load Model ────────────────────────────────────────────────────────────────
saved      = joblib.load("advanced_cry_model.pkl")
model      = saved["model"]
scaler     = saved["scaler"]
CATEGORIES = saved["categories"]

# ── Feature Extraction (must match trainer.py exactly) ────────────────────────
def extract_features(data, sr):
    mfccs        = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=40)
    delta_mfccs  = librosa.feature.delta(mfccs)
    delta2_mfccs = librosa.feature.delta(mfccs, order=2)

    f0, voiced_flag, _ = librosa.pyin(data, fmin=200, fmax=600, sr=sr)
    mean_f0      = np.nanmean(f0) if np.any(voiced_flag) else 0.0
    voiced_ratio = np.mean(voiced_flag)

    bw       = np.mean(librosa.feature.spectral_bandwidth(y=data, sr=sr))
    centroid = np.mean(librosa.feature.spectral_centroid(y=data, sr=sr))
    rolloff  = np.mean(librosa.feature.spectral_rolloff(y=data, sr=sr))
    zcr      = np.mean(librosa.feature.zero_crossing_rate(data))
    rms      = np.mean(librosa.feature.rms(y=data))

    return np.hstack([
        np.mean(mfccs, axis=1), np.std(mfccs, axis=1),
        np.mean(delta_mfccs, axis=1),
        np.mean(delta2_mfccs, axis=1),
        bw, centroid, rolloff, zcr, rms, mean_f0, voiced_ratio
    ])

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        data, sr = librosa.load(io.BytesIO(contents), sr=16000, mono=True, duration=4)
        data = librosa.util.normalize(data)

        # Extract & scale features
        features = extract_features(data, sr).reshape(1, -1)
        features = scaler.transform(features)

        # Predict
        probs = model.predict_proba(features)[0]

        # Boost cry categories slightly (suppress not_crying dominance)
        not_crying_idx = CATEGORIES.index("not_crying")
        for i in range(len(probs)):
            if i != not_crying_idx:
                probs[i] *= 1.2
        probs /= probs.sum()

        score_map     = {CATEGORIES[i]: round(float(probs[i]), 3) for i in range(len(CATEGORIES))}
        sorted_scores = sorted(score_map.items(), key=lambda item: item[1], reverse=True)
        best_label, confidence = sorted_scores[0]

        if confidence < 0.30:
            return {
                "status": "uncertain",
                "top_possibilities": [
                    {"label": label, "percentage": f"{score*100:.1f}%"}
                    for label, score in sorted_scores if score > 0.05
                ]
            }

        return {
            "status": "certain",
            "label": best_label,
            "confidence": confidence,
            "all_scores": score_map
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}