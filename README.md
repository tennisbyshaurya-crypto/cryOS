# cryOS – Intelligent Baby Nursery Operating System

## Setup

1. Install dependencies: `npm install`
2. Start backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
3. Start frontend: `npm run dev`
4. Login with any email/password to access the dashboard.
5. Upload a baby cry audio file and see real‑time classification.

## Model Training

Run `python backend/trainer.py` to train the Random Forest model. You need to place audio samples in `backend/dataset/<category>/`.

## Technologies

- React + TypeScript + Tailwind CSS
- FastAPI + Librosa + scikit‑learn
- Vite