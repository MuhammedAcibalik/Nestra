#!/usr/bin/env python3
"""
Waste Predictor Training Script - Production Grade
Features: GPU support, early stopping, LR scheduler, reproducibility
"""

import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
import sys

# Add parent to path for imports
sys.path.append(str(Path(__file__).parent))
from utils.data_loader import load_training_data, normalize_features
from utils.trainer import ProductionTrainer

# ==================== MODEL DEFINITION ====================

class WastePredictorNN(nn.Module):
    """
    Neural network for waste percentage prediction
    Architecture: MLP with BatchNorm and Dropout for tabular regression
    """
    
    def __init__(self, input_size: int = 19):
        super().__init__()
        self.network = nn.Sequential(
            # Input layer
            nn.Linear(input_size, 128),
            nn.LeakyReLU(0.1),
            nn.BatchNorm1d(128),
            nn.Dropout(0.3),
            
            # Hidden layer 1
            nn.Linear(128, 64),
            nn.LeakyReLU(0.1),
            nn.BatchNorm1d(64),
            nn.Dropout(0.2),
            
            # Hidden layer 2
            nn.Linear(64, 32),
            nn.LeakyReLU(0.1),
            nn.BatchNorm1d(32),
            
            # Hidden layer 3
            nn.Linear(32, 16),
            nn.ReLU(),
            
            # Output layer
            nn.Linear(16, 1),
            nn.Sigmoid()  # Output: 0-1 (waste percentage as fraction)
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


# ==================== DATA GENERATION ====================

def generate_synthetic_data(n: int = 2000, seed: int = 42) -> tuple:
    """
    Generate realistic synthetic data for training
    Uses modern numpy.random.Generator API (SonarQube S6711 compliant)
    """
    rng = np.random.default_rng(seed)
    
    # Generate correlated features that mimic real cutting scenarios
    features = np.zeros((n, 19), dtype=np.float32)
    
    # Piece counts (correlated)
    features[:, 0] = rng.integers(10, 500, n)  # totalPieceCount
    features[:, 1] = np.clip(features[:, 0] * rng.uniform(0.1, 0.5, n), 1, 100)  # uniquePieceCount
    
    # Piece areas
    features[:, 2] = rng.uniform(1000, 50000, n)  # avgPieceArea
    features[:, 3] = features[:, 2] * rng.uniform(0.1, 0.5, n)  # pieceAreaStdDev
    features[:, 4] = features[:, 2] * rng.uniform(0.2, 0.8, n)  # minPieceArea
    features[:, 5] = features[:, 2] * rng.uniform(1.2, 3.0, n)  # maxPieceArea
    
    # Aspect ratios
    features[:, 6] = rng.uniform(1.0, 4.0, n)  # pieceAspectRatioMean
    features[:, 7] = rng.uniform(0.1, 1.0, n)  # pieceAspectRatioStdDev
    
    # Stock info
    features[:, 8] = rng.uniform(1e6, 1e8, n)  # totalStockArea
    features[:, 9] = rng.integers(1, 50, n)  # stockSheetCount
    features[:, 10] = features[:, 8] / features[:, 9]  # avgStockArea
    features[:, 11] = rng.uniform(1.5, 2.5, n)  # stockAspectRatio
    
    # Ratios
    features[:, 12] = rng.uniform(0.3, 0.95, n)  # totalDemandToStockRatio
    features[:, 13] = rng.uniform(0.01, 0.3, n)  # pieceToStockSizeRatio
    
    # Parameters
    features[:, 14] = rng.uniform(1, 5, n)  # kerf
    features[:, 15] = rng.integers(0, 2, n)  # allowRotation
    features[:, 16] = rng.integers(0, 10, n)  # materialTypeIndex
    
    # Historical
    features[:, 17] = rng.uniform(5, 25, n)  # historicalAvgWaste
    features[:, 18] = features[:, 17] * rng.uniform(0.8, 1.2, n)  # lastJobWaste
    
    # Generate labels based on realistic waste model
    base_waste = 0.10
    demand_factor = -0.15 * (features[:, 12] - 0.5)
    variety_factor = 0.05 * (features[:, 1] / features[:, 0])
    aspect_factor = 0.03 * features[:, 7]
    kerf_factor = 0.01 * features[:, 14]
    rotation_factor = -0.02 * features[:, 15]
    historical_factor = 0.3 * (features[:, 17] / 100)
    
    waste = (base_waste + demand_factor + variety_factor + 
             aspect_factor + kerf_factor + rotation_factor + 
             historical_factor + rng.normal(0, 0.02, n))
    
    waste = np.clip(waste, 0.02, 0.50).astype(np.float32)
    
    return features, waste


# ==================== MAIN ====================

def main() -> None:
    print("=" * 60)
    print("🗑️  WASTE PREDICTOR - Production Training")
    print("=" * 60)
    
    # Paths
    root_dir = Path(__file__).parent.parent.parent.parent.parent
    data_path = root_dir / 'modules' / 'ml-analytics' / 'training' / 'data' / 'waste_training_data.json'
    models_dir = root_dir / 'models' / 'onnx'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Load or generate data
    print(f"\n📂 Checking for data at: {data_path}")
    raw_data = load_training_data(str(data_path))
    
    if raw_data and len(raw_data) >= 100:
        print(f"✅ Loaded {len(raw_data)} real training records")
        
        feature_keys = [
            'totalPieceCount', 'uniquePieceCount', 'avgPieceArea', 'pieceAreaStdDev',
            'minPieceArea', 'maxPieceArea', 'pieceAspectRatioMean', 'pieceAspectRatioStdDev',
            'totalStockArea', 'stockSheetCount', 'avgStockArea', 'stockAspectRatio',
            'totalDemandToStockRatio', 'pieceToStockSizeRatio', 'kerf', 'allowRotation',
            'materialTypeIndex', 'historicalAvgWaste', 'lastJobWaste'
        ]
        
        features = np.array([[r.get(k, 0) for k in feature_keys] for r in raw_data], dtype=np.float32)
        labels = np.array([r.get('actualWastePercent', 0) / 100.0 for r in raw_data], dtype=np.float32)
    else:
        print("⚠️  Insufficient real data, using synthetic data")
        features, labels = generate_synthetic_data(2000)
    
    print(f"📊 Dataset shape: X={features.shape}, y={labels.shape}")
    
    # Normalize features
    features_norm, norm_params = normalize_features(features)
    
    # Create model and trainer
    model = WastePredictorNN(input_size=19)
    
    trainer = ProductionTrainer(
        model=model,
        criterion=nn.MSELoss(),
        learning_rate=0.001,
        batch_size=32,
        epochs=150,
        patience=20,
        seed=42,
        verbose=True
    )
    
    # Prepare data loaders
    train_loader, val_loader = trainer.prepare_data(features_norm, labels, val_split=0.2)
    
    # Train
    trainer.train(train_loader, val_loader, is_classification=False)
    
    # Export
    output_path = str(models_dir / 'waste_predictor.onnx')
    trainer.export_onnx(output_path, input_size=19, model_name='waste_predictor', norm_params=norm_params)
    
    print("\n✅ Waste Predictor training complete!")


if __name__ == '__main__':
    main()
