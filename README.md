# Boston Housing Price Predictor

A full-stack machine learning web application that predicts housing prices using an ensemble of Lasso, Ridge, and XGBoost models. Built with a focus on real-world deployment practices including Docker, cloud hosting, and JWT authentication.

**Live Demo:** [housing-project-predictor-e8mg.vercel.app](https://housing-project-predictor-e8mg.vercel.app)

---

## Why I Built This

Most machine learning projects stop at the Jupyter notebook. I wanted to go further — to take a trained model and deploy it as a production-ready application that anyone can use. This project taught me how the full stack fits together: from preprocessing and model training, to building a REST API, containerizing it with Docker, and deploying it to the cloud with a real database and authentication system.

---

## Features

- **ML Ensemble Model** — Combines Lasso, Ridge, and XGBoost predictions for improved accuracy
- **JWT Authentication** — Secure user registration and login with token-based auth
- **Prediction History** — Every prediction is saved to the database per user
- **Soft Delete & Trash** — Users can delete, restore, and permanently purge predictions
- **Dockerized Backend** — Fully containerized for consistent and reproducible deployments
- **Cloud Deployed** — Frontend on Vercel, backend on Render, database on Supabase

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Axios |
| Backend | FastAPI, SQLAlchemy, Python 3.11 |
| ML Models | scikit-learn, XGBoost, pandas, numpy |
| Auth | JWT (python-jose), bcrypt, passlib |
| Database | PostgreSQL (Supabase) |
| Container | Docker |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
Housing-project-predictor/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   └── Predictor.jsx
│   │   └── App.jsx
│   └── .env
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── main.py         # API routes & CORS
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT auth logic
│   │   └── database.py     # DB connection
│   ├── models/             # Trained ML model files
│   ├── Dockerfile
│   └── requirements.txt
```

---

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker
- PostgreSQL database (or a free [Supabase](https://supabase.com) project)

### Backend

```bash
cd backend
python -m venv myenv
source myenv/bin/activate  # Windows: myenv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
DATABASE_URL=postgresql://user:password@host:5432/postgres
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_ORIGIN=http://localhost:5173
```

Run the backend:
```bash
uvicorn app.main:app --reload
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

### Docker

```bash
cd backend
docker build -t house-backend .
docker run -p 8000:8000 --env-file .env house-backend
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Set `VITE_API_URL` in environment variables |
| Backend | Render | Set all `.env` variables in Render dashboard |
| Database | Supabase | Use the Transaction Pooler connection string |
