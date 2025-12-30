#!/usr/bin/env python3
"""
Time Estimator Training Script - Production Grade
Features: GPU support, early stopping, LR scheduler, reproducibility
"""

import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent))
from utils.data_loader import load_training_data, normalize_features
from utils.trainer import ProductionTrainer

# ==================== MODEL DEFINITION ====================

class TimeEstimatorNN(nn.Module):
    """
    Neural network for production time estimation
    Output: Normalized time (0-1, scaled to minutes)
    """
    
    def __init__(self, input_size: int = 12):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.LeakyReLU(0.1),
            nn.BatchNorm1d(64),
            nn.Dropout(0.2),
            
            nn.Linear(64, 32),
            nn.LeakyReLU(0.1),
            nn.BatchNorm1d(32),
            
            nn.Linear(32, 16),
            nn.ReLU(),
            
            nn.Linear(16, 1),
            nn.ReLU()  # Time is always positive
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


# ==================== DATA GENERATION ====================

def generate_synthetic_data(n: int = 2000, seed: int = 42) -> tuple:
    """Generate realistic time estimation data using modern numpy.random.Generator"""
    rng = np.random.default_rng(seed)
    
    features = np.zeros((n, 12), dtype=np.float32)
    
    # Core features
    features[:, 0] = rng.integers(10, 500, n)  # totalPieces
    features[:, 1] = features[:, 0] * rng.uniform(2, 6, n)  # totalCuts
    features[:, 2] = rng.uniform(5, 30, n)  # wastePercentage
    features[:, 3] = rng.integers(1, 30, n)  # stockUsedCount
    
    # Machine info
    features[:, 4] = rng.integers(0, 3, n)  # machineType
    features[:, 5] = rng.uniform(0.5, 2.0, n)  # machineSpeed
    
    # Material
    features[:, 6] = rng.integers(0, 10, n)  # materialTypeIndex
    features[:, 7] = rng.uniform(1, 25, n)  # thickness
    
    # Piece info
    features[:, 8] = rng.uniform(5000, 100000, n)  # averagePieceArea
    features[:, 9] = features[:, 8] * rng.uniform(1.5, 4, n)  # maxPieceArea
    
    # Historical
    features[:, 10] = rng.uniform(30, 120, n)  # operatorAvgTime
    features[:, 11] = rng.uniform(20, 90, n)  # machineAvgTime
    
    # Calculate realistic time
    base_time = features[:, 0] * 0.5
    cut_time = features[:, 1] * 0.05
    setup_time = features[:, 3] * 2.0
    machine_mod = 1.0 - features[:, 4] * 0.15
    thickness_mod = 1.0 + features[:, 7] / 50
    
    total_time = (base_time + cut_time + setup_time) * machine_mod * thickness_mod / features[:, 5]
    labels = np.clip(total_time / 180.0, 0, 1).astype(np.float32)
    
    return features, labels


# ==================== MAIN ====================

def main() -> None:
    print("=" * 60)
    print("⏱️  TIME ESTIMATOR - Production Training")
    print("=" * 60)
    
    root_dir = Path(__file__).parent.parent.parent.parent.parent
    data_path = root_dir / 'modules' / 'ml-analytics' / 'training' / 'data' / 'time_training_data.json'
    models_dir = root_dir / 'models' / 'onnx'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📂 Checking for data at: {data_path}")
    raw_data = load_training_data(str(data_path))
    
    if raw_data and len(raw_data) >= 100:
        print(f"✅ Loaded {len(raw_data)} real training records")
        
        feature_keys = [
            'totalPieces', 'totalCuts', 'wastePercentage', 'stockUsedCount', 'machineType',
            'machineSpeed', 'materialTypeIndex', 'thickness', 'averagePieceArea',
            'maxPieceArea', 'operatorAvgTime', 'machineAvgTime'
        ]
        
        features = np.array([[r.get(k, 0) for k in feature_keys] for r in raw_data], dtype=np.float32)
        labels = np.array([min(r.get('actualTimeMinutes', 0) / 180.0, 1.0) for r in raw_data], dtype=np.float32)
    else:
        print("⚠️  Insufficient real data, using synthetic data")
        features, labels = generate_synthetic_data(2000)
    
    print(f"📊 Dataset shape: X={features.shape}, y={labels.shape}")
    
    features_norm, norm_params = normalize_features(features)
    
    model = TimeEstimatorNN(input_size=12)
    
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
    
    train_loader, val_loader = trainer.prepare_data(features_norm, labels, val_split=0.2)
    trainer.train(train_loader, val_loader, is_classification=False)
    
    output_path = str(models_dir / 'time_estimator.onnx')
    trainer.export_onnx(output_path, input_size=12, model_name='time_estimator', norm_params=norm_params)
    
    print("\n✅ Time Estimator training complete!")


if __name__ == '__main__':
    main()
