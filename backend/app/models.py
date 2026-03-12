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
    area = Column(Float, nullable=False)
    bedrooms = Column(Integer)
    predicted_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Key: Links this prediction to a specific User ID
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="predictions")