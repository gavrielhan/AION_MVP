from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import torch
from pathlib import Path

from ..models.target_ranker import TargetRanker
from ..data.processor import DataProcessor

app = FastAPI(
    title="OREN API",
    description="API for the Optimized Research Engine for Novel target pairs platform",
    version="0.1.0"
)

# Initialize models and processors
data_processor = DataProcessor(data_dir="data")
model = TargetRanker(input_dim=128)  # Adjust input dimension based on your features

class TargetPairRequest(BaseModel):
    indication: str
    patient_population: str
    clinical_phenotype: str
    strategy: str
    tissue_specificity: Optional[Dict[str, float]] = None

class TargetPairResponse(BaseModel):
    target_pairs: List[Dict]
    mechanistic_explanations: List[str]
    biomarker_predictions: List[Dict]
    toxicity_predictions: List[Dict]

@app.post("/rank_target_pairs", response_model=TargetPairResponse)
async def rank_target_pairs(request: TargetPairRequest):
    """
    Rank potential target pairs based on given parameters.
    """
    try:
        # Process the request
        target_pairs = model.rank_target_pairs(
            target_features=torch.randn(10, 128),  # Replace with actual features
            indication=request.indication,
            patient_population=request.patient_population,
            clinical_phenotype=request.clinical_phenotype,
            strategy=request.strategy
        )
        
        # Generate explanations and predictions
        mechanistic_explanations = []
        biomarker_predictions = []
        toxicity_predictions = []
        
        for pair in target_pairs:
            # Get mechanistic explanation
            explanation = model.generate_mechanistic_explanation(
                target_pair=(pair["target1"], pair["target2"]),
                indication=request.indication
            )
            mechanistic_explanations.append(explanation)
            
            # Predict biomarkers
            biomarkers = model.predict_biomarkers(
                target_pair=(pair["target1"], pair["target2"]),
                indication=request.indication
            )
            biomarker_predictions.append(biomarkers)
            
            # Predict toxicity
            toxicity = model.predict_toxicity(
                target_pair=(pair["target1"], pair["target2"]),
                tissue_specificity=request.tissue_specificity or {}
            )
            toxicity_predictions.append(toxicity)
        
        return TargetPairResponse(
            target_pairs=target_pairs,
            mechanistic_explanations=mechanistic_explanations,
            biomarker_predictions=biomarker_predictions,
            toxicity_predictions=toxicity_predictions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 