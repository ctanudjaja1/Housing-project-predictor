from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import joblib
import pandas as pd
import numpy as np
import os
from .database import SessionLocal, engine, Base, get_db
from sqlalchemy.orm import Session
from . import models, schemas, auth
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from .auth import SECRET_KEY, ALGORITHM

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory where main.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODELS_PATH = os.path.join(BASE_DIR, "..", "models")

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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 1. Decode the token using your Secret Key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # 2. Find the user in Postgres
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def apply_preprocessing(request: schemas.PredictionCreate):
    #Start with baseline averages
    final_df = pd.DataFrame([column_means.values], columns=model_columns)

    # Standard garage is ~250 sq ft per car slot
    estimated_area = float(request.garage_cars * 250)

    user_input_mapped = {
        "GrLivArea": request.gr_liv_area,
        "BedroomAbvGr": request.bedrooms,
        "OverallQual": request.overall_qual,
        "YearBuilt": request.year_built,      
        "TotalBsmtSF": request.total_bsmt_sf,
        "GarageCars": request.garage_cars,
        "GarageArea": estimated_area 
    }

    #Apply transformations (including log if needed)
    for col, val in user_input_mapped.items():
        if col in model_columns:
            # If the model expects a log-transformed version, apply it
            if col in skewed_features:
                val = np.log1p(float(val))
            
            final_df[col] = val
            
    return final_df

# We have the model, so now lets put it here
@app.post("/predict", response_model=schemas.PredictionResponse)
async def predict(request: schemas.PredictionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
        year_built=request.year_built,         
        total_bsmt_sf=request.total_bsmt_sf,   
        garage_cars=request.garage_cars,       
        predicted_price=round(actual_price, 2),
        user_id= current_user.id 
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
def get_prediction_history(
    trash: bool = False, # Default to showing LIVE records
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id)
    
    if trash:
        # Show ONLY deleted items
        query = query.filter(models.Prediction.deleted_at != None)
    else:
        # Show ONLY active items
        query = query.filter(models.Prediction.deleted_at == None)
        
    return query.order_by(models.Prediction.created_at.desc()).all()

@app.post("/register")
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Access username via user_data.username
    db_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # 2. Access password via user_data.password
    hashed_pwd = auth.hash_password(user_data.password)
    
    # 3. Create the user using the extracted data
    new_user = models.User(
        username=user_data.username, 
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # Create the JWT token
    access_token = auth.create_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.delete("/history/clear")
def clear_user_history(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Filter by user_id so users can't delete each other's data!
    deleted_count = db.query(models.Prediction).filter(
        models.Prediction.user_id == current_user.id
    ).delete()
    
    db.commit()
    return {"message": f"Successfully cleared {deleted_count} records."}

@app.delete("/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Add ": models.Prediction | None" so the editor knows exactly what this is
    prediction: models.Prediction | None = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id,
        models.Prediction.user_id == current_user.id
    ).first()

    if not prediction:
        raise HTTPException(status_code=404, detail="Not found")

    prediction.deleted_at = datetime.now(timezone.utc) # type: ignore #
    
    db.commit()
    return {"message": "Soft deleted"}

@app.post("/predictions/{prediction_id}/restore")
def restore_prediction(
    prediction_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # We look specifically for the record belonging to this user
    prediction = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id,
        models.Prediction.user_id == current_user.id
    ).first()

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Bring it back to life!
    prediction.deleted_at = None # type: ignore
    db.commit()
    
    return {"message": "Prediction restored successfully"}

@app.delete("/predictions/{prediction_id}/permanent")
def permanent_delete(prediction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    prediction = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id,
        models.Prediction.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    db.delete(prediction) # This is a HARD delete
    db.commit()
    return {"message": "Permanently deleted"}


@app.delete("/history/clear-soft")
def clear_history_soft(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Update all records for this user that aren't already deleted
    db.query(models.Prediction).filter(
        models.Prediction.user_id == current_user.id,
        models.Prediction.deleted_at == None
    ).update({models.Prediction.deleted_at: datetime.now(timezone.utc)}, synchronize_session=False)
    
    db.commit()
    return {"message": "All items moved to trash"}

@app.delete("/history/purge")
def purge_trash(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Prediction).filter(
        models.Prediction.user_id == current_user.id,
        models.Prediction.deleted_at != None
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"message": "Trash purged permanently"}