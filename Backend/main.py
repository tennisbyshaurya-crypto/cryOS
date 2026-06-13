from fastapi import FastAPI, UploadFile, File
import io, numpy as np, librosa, joblib

app = FastAPI()
model = joblib.load("advanced_cry_model.pkl")
CATEGORIES = ["hungry", "tired", "belly_pain", "burping", "discomfort", "not_crying"]

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        data, sr = librosa.load(io.BytesIO(contents), sr=16000, mono=True, duration=4)
        data = librosa.util.normalize(data)
        
        # Extract features
        mfccs = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=13)
        delta_mfccs = librosa.feature.delta(mfccs)
        bw = np.mean(librosa.feature.spectral_bandwidth(y=data, sr=sr))
        features = np.hstack([np.mean(mfccs, axis=1), np.mean(delta_mfccs, axis=1), bw]).reshape(1, -1)
        
        # Calculate Probabilities
        probs = model.predict_proba(features)[0]
        probs[:5] *= 1.2
        probs /= probs.sum()
        
        score_map = {CATEGORIES[i]: round(float(probs[i]), 3) for i in range(len(CATEGORIES))}
        sorted_scores = sorted(score_map.items(), key=lambda item: item[1], reverse=True)
        best_label, confidence = sorted_scores[0]
        
        # Logic: If uncertain, rank all relevant options
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