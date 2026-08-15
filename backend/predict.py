import joblib
import pandas as pd
from pydantic import BaseModel
from pathlib import Path
import shutil
import uuid

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO


# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best.pt"
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)


# --------------------------------------------------
# LOAD OUR TRAINED 5-CLASS YOLO MODEL
# --------------------------------------------------

model = YOLO(str(MODEL_PATH))

RISK_MODEL_PATH = BASE_DIR / "risk_model.pkl"

risk_model = joblib.load(RISK_MODEL_PATH)

print("✅ Risk ML model loaded successfully!")


# --------------------------------------------------
# MAP RAW MODEL CLASS NAMES -> FRONTEND SPECIES LABELS
# The frontend (KavachApp.jsx SPECIES_LIST / ZONES) expects these
# exact display names. The underlying trained classes are kept
# untouched in `class_name` for reference.
# --------------------------------------------------

SPECIES_DISPLAY_MAP = {
    "elephant": "Asian Elephant",
    "leopard": "Leopard",
    "wildboar": "Wild Boar",
    "Tiger": "Tiger",
    "Lion": "Lion",  # not present in frontend's zone list, passed through as-is
}


# --------------------------------------------------
# FASTAPI APP
# --------------------------------------------------

app = FastAPI(title="KAVACH Wildlife Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "status": "online",
        "model": "KAVACH Wildlife YOLO",
        "classes": [
            "Lion",
            "Tiger",
            "elephant",
            "leopard",
            "wildboar"
        ]
    }


# --------------------------------------------------
# WILDLIFE DETECTION
# --------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Create unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    image_path = UPLOAD_DIR / filename

    # Save uploaded image
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run YOLO
    results = model(
        str(image_path),
        conf=0.25,
        verbose=False
    )

    detections = []

    for result in results:

        boxes = result.boxes

        for box in boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            raw_name = model.names[class_id]

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "species": SPECIES_DISPLAY_MAP.get(raw_name, raw_name),
                "class_name": raw_name,
                "confidence": round(confidence * 100, 2),
                "bbox": [
                    round(x1, 2),
                    round(y1, 2),
                    round(x2, 2),
                    round(y2, 2)
                ]
            })

    # Sort by confidence, highest first, so the frontend can just take
    # detections[0] as the primary result for its single-result display.
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    # Remove temporary image
    try:
        image_path.unlink()
    except:
        pass

    return {
        "success": True,
        "count": len(detections),
        "detections": detections
    }

class RiskRequest(BaseModel):
    species: str
    yolo_confidence: float
    recent_detections: int
    historical_conflicts: int
    settlement_proximity: int
    temporal_pattern: int
    environmental_context: int
    spatial_relationship: int


@app.post("/risk")
def predict_risk(data: RiskRequest):

    input_data = pd.DataFrame([{
        "species": data.species,
        "yolo_confidence": data.yolo_confidence,
        "recent_detections": data.recent_detections,
        "historical_conflicts": data.historical_conflicts,
        "settlement_proximity": data.settlement_proximity,
        "temporal_pattern": data.temporal_pattern,
        "environmental_context": data.environmental_context,
        "spatial_relationship": data.spatial_relationship
    }])

    prediction = risk_model.predict(input_data)[0]

    risk_score = float(max(0, min(100, prediction)))

    if risk_score < 40:
        risk_level = "LOW"
    elif risk_score < 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "success": True,
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level
    }