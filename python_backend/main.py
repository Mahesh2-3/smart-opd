from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from groq import Groq
from dotenv import load_dotenv
import logging
import time
from starlette.requests import Request

load_dotenv()

app = FastAPI(title="SOQMS AI Backend", version="1.0.0")

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("fastapi_backend")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"\n[FastAPI Logs] Incoming Request: {request.method} {request.url.path}")
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"[FastAPI Logs] Completed Request: {request.method} {request.url.path} with status {response.status_code} in {process_time:.4f}s\n")
    return response

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
    disease_avg_time: int
    doctor_avg_time: int
    patient_history_avg_time: int

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SOQMS AI Backend is running"}

@app.post("/api/predict-wait-time")
def predict_wait_time(request: WaitTimeRequest):
    # Determine wait time using weighted averages
    base_time = request.doctor_avg_time
    
    if request.disease_avg_time > 0:
        base_time = (base_time + request.disease_avg_time) / 2.0
    
    if request.patient_history_avg_time > 0:
        # Give some weight to how long this specific patient typically takes
        base_time = (base_time * 0.7) + (request.patient_history_avg_time * 0.3)
        
    wait_time_minutes = round(request.queue_length * base_time)
    
    return {"estimated_wait_time_minutes": wait_time_minutes}

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
