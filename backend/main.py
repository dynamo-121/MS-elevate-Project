from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

app = FastAPI()

# Enable CORS so React can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB Compass
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.moviedb 

class UserSchema(BaseModel):
    username: str
    email: str
    password: str

@app.post("/api/register")
async def register_user(user: UserSchema):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Insert into MongoDB
    user_data = user.dict()
    result = await db.users.insert_one(user_data)
    
    return {"message": "Success", "user_id": str(result.inserted_id)}