from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
import joblib
import pandas as pd
import numpy as np
import os
from .database import engine, Base, get_db
from sqlalchemy.orm import Session
from . import models, schemas

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

# Get the directory where main.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODELS_PATH = os.path.join(BASE_DIR, "..", "..", "models")

try:
    lasso = joblib.load(os.path.join(MODELS_PATH, "lasso_model.pkl"))
    ridge = joblib.load(os.path.join(MODELS_PATH, "ridge_model.pkl"))
    xgb = joblib.load(os.path.join(MODELS_PATH, "xgb_model.pkl"))
    scaler = joblib.load(os.path.join(MODELS_PATH, "scaler.pkl"))
    model_columns = joblib.load(os.path.join(MODELS_PATH, "model_columns.pkl"))
    column_means = joblib.load(os.path.join(MODELS_PATH, "column_means.pkl"))
    skewed_features = joblib.load(os.path.join(MODELS_PATH, "skewed_features.pkl"))
    
    print("AI Ensemble & Preprocessors Loaded Successfully")
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    
# You can add more endpoints as needed for your application

def apply_preprocessing(request: schemas.PredictionCreate):
    # 1. Start with a DataFrame of the column means (the "Baseline")
    final_df = pd.DataFrame([column_means.values], columns=model_columns)

    # 2. Map Schema Names -> Ames Dataset Names
    # This is the "Translation" step.
    user_input_mapped = {
        "GrLivArea": request.gr_liv_area,
        "BedroomAbvGr": request.bedrooms,
        "OverallQual": request.overall_qual
    }

    # 3. Overwrite the averages with the User's Data
    for col, val in user_input_mapped.items():
        if col in model_columns:
            # Apply log transformation IF it was a skewed feature in training
            if col in skewed_features:
                # We use float() because Pydantic already guaranteed it's a number
                val = np.log1p(float(val))
            
            final_df[col] = val
            
    return final_df

# We have the model, so now lets put it here
@app.post("/predict", response_model=schemas.PredictionResponse)
async def predict(request: schemas.PredictionCreate, db: Session = Depends(get_db)):
    # 1. Preprocess
    processed_df = apply_preprocessing(request)
    
    # 2. Predict (Same logic as yours)
    scaled_data = scaler.transform(processed_df)
    lasso_pred = lasso.predict(scaled_data)
    ridge_pred = ridge.predict(scaled_data)
    xgb_pred = xgb.predict(scaled_data)
    
    final_log_price = (0.4 * lasso_pred) + (0.3 * ridge_pred) + (0.3 * xgb_pred)
    actual_price = float(np.expm1(final_log_price)[0])
    
    # 3. SAVE TO DB (The step needed for your comparison goal!)
    new_prediction = models.Prediction(
        gr_liv_area=request.gr_liv_area,
        bedrooms=request.bedrooms,
        overall_qual=request.overall_qual,
        predicted_price=round(actual_price, 2),
        user_id=1 # Temporary
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return new_prediction
    

@app.get("/")
async def root():
    return {"message": "Welcome to the Boston Housing Price Prediction API!"}
    
@app.get("/db-test")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Execute the query
        query_result = db.execute(text("SELECT 1")).fetchone()
        
        # Defensive Check: Ensure query_result is NOT None
        if query_result is None:
            raise HTTPException(status_code=500, detail="Database returned no data.")
            
        return {
            "status": "online", 
            "message": "Database connection successful!",
            "result": query_result[0]  # Now Pylance knows this is safe
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.get("/history", response_model=list[schemas.PredictionResponse])
def get_prediction_history(db: Session = Depends(get_db)):
    # 1. Query the database for all predictions
    # 2. Sort by 'created_at' descending so the newest ones are at the top
    history = db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).all()
    
    return history