from pydantic import BaseModel
from datetime import datetime

class PredictionBase(BaseModel):
    gr_liv_area: float
    bedrooms: int
    overall_qual: int
    year_built: int
    total_bsmt_sf: float
    garage_cars: int

class PredictionCreate(PredictionBase):
    pass

class PredictionResponse(PredictionBase):
    id: int
    predicted_price: float
    created_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True

# For the registration request (what React sends)
class UserCreate(BaseModel):
    username: str
    password: str

# For the user response (if you want to return user info later)
class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
