from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
import joblib
import pandas as pd
import numpy as np
import os
from .database import engine, Base, get_db
from sqlalchemy.orm import Session
from . import models

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../models")
lasso = joblib.load(os.path.join(MODEL_DIR, "lasso_model.pkl"))
ridge = joblib.load(os.path.join(MODEL_DIR, "ridge_model.pkl"))
xgb = joblib.load(os.path.join(MODEL_DIR, "xgb_model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
model_columns = joblib.load(os.path.join(MODEL_DIR, "model_columns.pkl"))
skewed_features = joblib.load(os.path.join(MODEL_DIR, "skewed_features.pkl"))
column_means = joblib.load(os.path.join(MODEL_DIR, "column_means.pkl"))

# You can add more endpoints as needed for your application

def apply_preprocessing(user_input_dict):
    df = pd.DataFrame([user_input_dict])
    
    # Instead of zeros, we start with the mean values of the entire dataset
    final_df = pd.DataFrame([column_means.values], columns=model_columns)

    # Now, overwrite the means with the user's specific input
    # (e.g. if the user provides GrLivArea, it replaces the average)
    for col in user_input_dict.keys():
        if col in model_columns:
            val = user_input_dict[col]
            # Apply log1p if it's a skewed feature
            if col in skewed_features:
                val = np.log1p(pd.to_numeric(val, errors='coerce'))
            final_df[col] = val
            
    return final_df

# We have the model, so now lets put it here
@app.post("/predict")
async def predict(data: dict):
    processed_df = apply_preprocessing(data)
    scaled_data = scaler.transform(processed_df)
    
    # Get predictions from each model
    lasso_pred = lasso.predict(scaled_data)
    ridge_pred = ridge.predict(scaled_data)
    xgb_pred = xgb.predict(scaled_data)
    
    # Combine predictions (you can use a weighted average or any other method)
    final_log_price = (0.4 * lasso_pred) + (0.3 * ridge_pred) + (0.3 * xgb_pred)
    
    # reverse the log
    actual_price = np.expm1(final_log_price)[0]
    
    return {
        "prediction_used" : round(float(actual_price), 2),
        "individual_predictions": {
            "lasso": round(float(np.expm1(lasso_pred)[0]), 2),
            "ridge": round(float(np.expm1(ridge_pred)[0]), 2),
            "xgb": round(float(np.expm1(xgb_pred)[0]), 2)
        }
    }
    

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