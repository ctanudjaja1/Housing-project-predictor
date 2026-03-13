from pydantic import BaseModel
from datetime import datetime

class PredictionBase(BaseModel):
    gr_liv_area: float
    bedrooms: int
    overall_qual: int

class PredictionCreate(PredictionBase):
    pass

class PredictionResponse(PredictionBase):
    id: int
    predicted_price: float
    created_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True

