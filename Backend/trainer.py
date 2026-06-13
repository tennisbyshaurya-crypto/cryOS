import os, librosa, numpy as np, joblib
from sklearn.ensemble import RandomForestClassifier
from tqdm import tqdm

CATEGORIES = ["hungry", "tired", "belly_pain", "burping", "discomfort", "not_crying"]
X, y = [], []

def extract_features(data, sr):
    mfccs = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=13)
    delta_mfccs = librosa.feature.delta(mfccs)
    bw = np.mean(librosa.feature.spectral_bandwidth(y=data, sr=sr))
    return np.hstack([np.mean(mfccs, axis=1), np.mean(delta_mfccs, axis=1), bw])

all_files = []
for cat_idx, cat in enumerate(CATEGORIES):
    folder = os.path.join("dataset", cat)
    if os.path.exists(folder):
        for file in os.listdir(folder):
            if file.endswith(('.wav', '.mp3', '.m4a')):
                all_files.append((os.path.join(folder, file), cat_idx))

print(f"--- Starting Training Pipeline ---")
for file_path, cat_idx in tqdm(all_files, desc="Processing Audio"):
    try:
        data, sr = librosa.load(file_path, sr=16000, mono=True, duration=4)
        data = librosa.util.normalize(data)
        
        # Original
        X.append(extract_features(data, sr)); y.append(cat_idx)
        # Augmented (Noise Injection)
        noise = np.random.normal(0, 0.005, len(data))
        X.append(extract_features(data + noise, sr)); y.append(cat_idx)
    except: continue

print("Training model...")
model = RandomForestClassifier(
    n_estimators=500, max_depth=15, class_weight='balanced', 
    criterion='entropy', random_state=42
)
model.fit(np.array(X), np.array(y))
joblib.dump(model, "advanced_cry_model.pkl")
print("✅ Model saved as advanced_cry_model.pkl")