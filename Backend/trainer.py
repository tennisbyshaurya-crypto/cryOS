import os
import librosa
import numpy as np
import joblib
from collections import Counter
from sklearn.utils import resample
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
from tqdm import tqdm

try:
    from xgboost import XGBClassifier
    USE_XGBOOST = True
except ImportError:
    from sklearn.ensemble import RandomForestClassifier
    USE_XGBOOST = False
    print("⚠️  XGBoost not found, falling back to RandomForest. Run: pip install xgboost")

CATEGORIES = ["hungry", "tired", "belly_pain", "burping", "discomfort", "not_crying"]
X, y = [], []
skipped = 0

# ── Feature Extraction ──────────────────────────────────────────────────────
def extract_features(data, sr):
    # MFCCs — 40 coefficients + std
    mfccs        = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=40)
    delta_mfccs  = librosa.feature.delta(mfccs)
    delta2_mfccs = librosa.feature.delta(mfccs, order=2)

    # Pitch (highly discriminative for cry types)
    f0, voiced_flag, _ = librosa.pyin(data, fmin=200, fmax=600, sr=sr)
    mean_f0      = np.nanmean(f0) if np.any(voiced_flag) else 0.0
    voiced_ratio = np.mean(voiced_flag)

    # Spectral shape
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

# ── Augmentation ─────────────────────────────────────────────────────────────
def augment(data, sr):
    variants = [data]
    # Noise injection
    variants.append(data + np.random.normal(0, 0.005, len(data)))
    # Time stretch
    rate = np.random.uniform(0.85, 1.15)
    stretched = librosa.effects.time_stretch(data, rate=rate)
    stretched = librosa.util.fix_length(stretched, size=len(data))
    variants.append(stretched)
    # Pitch shift
    steps = np.random.uniform(-2, 2)
    variants.append(librosa.effects.pitch_shift(data, sr=sr, n_steps=steps))
    # Volume change
    variants.append(data * np.random.uniform(0.7, 1.3))
    # Time shift
    shift = np.random.randint(sr // 4)
    variants.append(np.roll(data, shift))
    return variants

# ── Collect Files ─────────────────────────────────────────────────────────────
all_files = []
for cat_idx, cat in enumerate(CATEGORIES):
    folder = os.path.join("dataset", cat)
    if os.path.exists(folder):
        for file in os.listdir(folder):
            if file.endswith(('.wav', '.mp3', '.m4a')):
                all_files.append((os.path.join(folder, file), cat_idx))

print(f"--- Starting Training Pipeline ---")
print(f"Found {len(all_files)} audio files across {len(CATEGORIES)} categories\n")

# ── Process Audio ─────────────────────────────────────────────────────────────
for file_path, cat_idx in tqdm(all_files, desc="Processing Audio"):
    try:
        data, sr = librosa.load(file_path, sr=16000, mono=True, duration=4)
        data = librosa.util.normalize(data)
        for variant in augment(data, sr):
            X.append(extract_features(variant, sr))
            y.append(cat_idx)
    except Exception as e:
        skipped += 1
        print(f"⚠️  Skipping {file_path}: {e}")

X_arr, y_arr = np.array(X), np.array(y)

# ── Dataset Summary ───────────────────────────────────────────────────────────
print(f"\n📊 Dataset Summary (before balancing):")
print(f"   Total samples (with augmentation): {len(X_arr)}")
print(f"   Skipped files: {skipped}")
counts = Counter(y_arr)
for idx, cat in enumerate(CATEGORIES):
    print(f"   {cat}: {counts.get(idx, 0)} samples")

# ── Balance Dataset ───────────────────────────────────────────────────────────
print("\n⚖️  Balancing dataset...")
min_count = min(Counter(y_arr).values())
X_bal, y_bal = [], []
for cat_idx in range(len(CATEGORIES)):
    mask  = y_arr == cat_idx
    X_cat = X_arr[mask]
    y_cat = y_arr[mask]
    X_down, y_down = resample(X_cat, y_cat, n_samples=min_count, random_state=42)
    X_bal.append(X_down)
    y_bal.append(y_down)

X_arr = np.vstack(X_bal)
y_arr = np.hstack(y_bal)
print(f"   Balanced: {len(X_arr)} samples ({min_count} per category)")

# ── Feature Scaling ───────────────────────────────────────────────────────────
scaler = StandardScaler()
X_arr  = scaler.fit_transform(X_arr)

# ── Train Model ───────────────────────────────────────────────────────────────
print("\nTraining model...")
if USE_XGBOOST:
    print("   Using XGBoost ✅")
    model = XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='mlogloss',
        n_jobs=-1,
        random_state=42
    )
    model.fit(X_arr, y_arr)
    print(f"\n✅ Training Accuracy: {model.score(X_arr, y_arr):.3f}")
else:
    print("   Using RandomForest ✅")
    model = RandomForestClassifier(
        n_estimators=500,
        max_depth=10,
        class_weight='balanced',
        criterion='entropy',
        oob_score=True,
        n_jobs=-1,
        random_state=42
    )
    model.fit(X_arr, y_arr)
    print(f"\n✅ OOB Accuracy: {model.oob_score_:.3f}")

# ── Accuracy Report ───────────────────────────────────────────────────────────
print("\n📋 Per-Category Report (on training data):")
y_pred = model.predict(X_arr)
print(classification_report(y_arr, y_pred, target_names=CATEGORIES))

# ── Save Model ────────────────────────────────────────────────────────────────
joblib.dump({
    "model"     : model,
    "scaler"    : scaler,
    "categories": CATEGORIES,
    "use_xgboost": USE_XGBOOST
}, "advanced_cry_model.pkl")
print("✅ Model saved as advanced_cry_model.pkl")
