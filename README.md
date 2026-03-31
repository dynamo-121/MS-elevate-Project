# Movie Recommender System

A complete movie recommendation platform featuring a React frontend, Node.js/Express backend, and a FastAPI-based machine learning recommender service.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB Compass** (Running locally on `mongodb://localhost:27017`)

---

### 2. Backend (Express API)
The primary backend handles authentication, movie data management, and user reviews.
- **Directory**: `backend/`
- **Port**: `5000`
- **Setup**:
  ```bash
  cd backend
  npm install
  cp .env.example .env # Ensure MONGO_URI and JWT_SECRET are set
  npm run dev
  ```

---

### 3. Frontend (React/Vite)
The user interface for browsing movies, managing watchlists, and interacting with the AI Assistant.
- **Directory**: `frontend/`
- **Port**: `5173`
- **Setup**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Gemini AI**: Ensure your API key is set in `src/pages/AIAssistant.jsx`.

---

### 4. Recommender (FastAPI Service)
The machine learning service providing movie recommendations and top picks.
- **Directory**: `recommender/`
- **Port**: `8000`
- **Setup**:
  ```bash
  cd recommender
  # Create a virtual environment (if not using root .venv)
  python -m venv venv
  source venv/bin/activate # Windows: venv\Scripts\activate
  pip install -r requirements.txt
  python app.py
  ```

---

### 5. Summary / ML Pipeline
Run this script to generate or update the recommendation dataset and train the model.
- **Directory**: `recommender/`
- **Setup**:
  ```bash
  cd recommender
  python ml_pipeline.py
  ```
- **Note**: This generates `data.csv` which is required for the Recommender service to function correctly.

---

### 🏎️ Shortcut: Run Frontend & Backend Together
You can run both the Node.js backend and the React frontend simultaneously from the root directory:
```bash
npm install
npm run dev
```

## 🛠️ Project Structure
- `frontend/`: React application using Vite and Tailwind CSS.
- `backend/`: Express.js server with MongoDB integration.
- `recommender/`: FastAPI service for ML-based recommendations.
- `recommender/ml_pipeline.py`: Data generation and model training script (Sentiment Analysis).
