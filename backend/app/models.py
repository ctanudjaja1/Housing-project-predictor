from .database import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Relationship: One user can have many saved predictions
    predictions = relationship("Prediction", back_populates="owner")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    
    # These match the key features found in your housing.ipynb
    gr_liv_area = Column(Float)      # "GrLivArea" from your notebook
    bedrooms = Column(Integer)       # "BedroomAbvGr" from your notebook
    overall_qual = Column(Integer)   # A top feature in housing models
    year_built = Column(Integer)
    total_bsmt_sf = Column(Float)
    garage_cars = Column(Integer)
    
    # The result of your AI model
    predicted_price = Column(Float)
    
    # This allows users to see WHEN they made the prediction
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Key: Links this prediction to a specific User ID
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="predictions")