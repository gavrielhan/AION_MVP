from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="OREN API")

# Mount static files
app.mount("/static", StaticFiles(directory="oren/static"), name="static")

# Initialize templates
templates = Jinja2Templates(directory="oren/templates")

# API configuration
API_KEY = os.getenv("API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL")

if not API_KEY or not API_BASE_URL:
    raise ValueError("API_KEY and API_BASE_URL must be set in .env file")

# Request/Response models
class TargetPairRequest(BaseModel):
    indication: str
    patient_population: str
    clinical_phenotype: str
    targeting_strategy: str

class TargetPair(BaseModel):
    target1: str
    target2: str
    synergy_score: float
    toxicity_score: float

class TargetPairResponse(BaseModel):
    target_pairs: list[TargetPair]

class ExplanationRequest(BaseModel):
    target1: str
    target2: str
    indication: str
    patient_population: str
    clinical_phenotype: str

# Mock data for demonstration
MOCK_TARGET_PAIRS = [
    TargetPair(
        target1="PD-1",
        target2="CTLA-4",
        synergy_score=0.85,
        toxicity_score=0.35
    ),
    TargetPair(
        target1="PD-L1",
        target2="LAG-3",
        synergy_score=0.78,
        toxicity_score=0.42
    ),
    TargetPair(
        target1="TIM-3",
        target2="TIGIT",
        synergy_score=0.72,
        toxicity_score=0.28
    )
]

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/rank_target_pairs", response_model=TargetPairResponse)
async def rank_target_pairs(request: TargetPairRequest):
    # In a real implementation, this would use the ML model
    # For now, return mock data
    return TargetPairResponse(target_pairs=MOCK_TARGET_PAIRS)

@app.post("/api/explain")
async def explain_target_pair(request: ExplanationRequest):
    try:
        # Prepare the prompt for the LLM
        prompt = f"""Explain why the target pair {request.target1} and {request.target2} 
        would be effective for treating {request.indication} in {request.patient_population} 
        patients with {request.clinical_phenotype}. Include mechanistic rationale and 
        potential benefits. Explain clearly teh pathways involved and teh possible downstream effects, clealry defining the main advantages of using these 2 targets"""

        # Prepare the API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }
        
        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": "You are a biomedical expert explaining drug target pairs."},
                {"role": "user", "content": prompt}
            ]
        }

        # Make the API request
        response = requests.post(
            f"{API_BASE_URL}/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60  # Set a longer timeout (60 seconds)
        )
        
        # Check if the response is successful
        if response.status_code != 200:
            error_detail = f"LLM API request failed with status code {response.status_code}"
            try:
                error_json = response.json()
                if "error" in error_json:
                    error_detail += f": {error_json['error']}"
            except:
                pass
            raise HTTPException(status_code=response.status_code, detail=error_detail)
        
        # Extract the explanation from the response
        explanation = response.json()["choices"][0]["message"]["content"]
        return {"explanation": explanation}

    except requests.exceptions.Timeout:
        # Handle timeout specifically
        return {
            "explanation": f"The request to generate an explanation for {request.target1} and {request.target2} timed out. Please try again later."
        }
    except Exception as e:
        # Log the error for debugging
        print(f"Error generating explanation: {str(e)}")
        # Return a more informative error message
        return {
            "explanation": f"An error occurred while generating the explanation: {str(e)}"
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 