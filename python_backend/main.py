from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SOQMS AI Backend", version="1.0.0")

# Enable CORS for Next.js frontend (default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
# Fallback to empty string to avoid crash if key is missing during startup
client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

class WaitTimeRequest(BaseModel):
    queue_length: int
    average_consultation_time: int # in minutes

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SOQMS AI Backend is running"}

@app.post("/api/predict-wait-time")
def predict_wait_time(request: WaitTimeRequest):
    # Determine wait time (queue_length * average_consultation_time)
    wait_time = request.queue_length * request.average_consultation_time
    return {"estimated_wait_time_minutes": wait_time}

@app.post("/api/chat")
def chat_with_assistant(request: ChatRequest):
    if not os.environ.get("GROQ_API_KEY"):
        # Mock response if no API key
        return {"response": "I am MedQueue Assistant (Mock mode - GROQ_API_KEY not set). How can I help you regarding your queue status?"}
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are MedQueue Assistant, a helpful AI for a hospital OPD Queue Management System. Keep your answers brief and relevant to queue times, directions, and hospital procedures. You can explain that wait times depend on the queue length and average consultation time."
                },
                {
                    "role": "user",
                    "content": request.message,
                }
            ],
            model="llama3-8b-8192",
        )
        return {"response": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
