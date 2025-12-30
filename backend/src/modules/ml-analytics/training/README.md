# ML Training Pipeline

This directory contains the training infrastructure for Nestra's ML models.

## 📋 Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL** (with production data)

## 🚀 Workflow

### 1. Install Dependencies

```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies (root)
npm install
```

### 2. Export Training Data

Extract real production data from PostgreSQL to JSON format:

```bash
# From backend root
npx ts-node src/modules/ml-analytics/scripts/export-training-data.ts
```
Output: `src/modules/ml-analytics/training/data/*.json`

### 3. Train Models

Run the training scripts (outputs .onnx to `backend/models/onnx/`):

```bash
# Waste Predictor
python train_waste_predictor.py

# Time Estimator
python train_time_estimator.py

# Algorithm Selector
python train_algorithm_selector.py

# Anomaly Predictor
python train_anomaly_predictor.py
```

### 4. GPU Training (Docker)

To use GPU acceleration without local CUDA setup:

```bash
# Build image
docker build -t nestra-ml-training -f ../../../Dockerfile.training .

# Run training
docker run --gpus all -v $(pwd)/data:/app/data -v $(pwd)/../../models:/app/models nestra-ml-training
```

## 📁 Structure

- `data/`: JSON training data (gitignored)
- `utils/`: Shared properies (data loading, normalization)
- `train_*.py`: Model-specific training scripts
