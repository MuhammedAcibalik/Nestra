#!/usr/bin/env python3
"""
Algorithm Selector Training Script - Production Grade
Classification model to recommend best cutting algorithm
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

class AlgorithmSelectorNN(nn.Module):
    """
    Classifier for selecting best cutting algorithm
    Output: 3 classes (BOTTOM_LEFT, GUILLOTINE, MAXRECTS)
    """
    
    def __init__(self, input_size: int = 14):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Dropout(0.3),
            
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32),
            nn.Dropout(0.2),
            
            nn.Linear(32, 16),
            nn.ReLU(),
            
            nn.Linear(16, 3)  # 3 algorithm classes
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


# ==================== DATA GENERATION ====================

ALGORITHMS = ['BOTTOM_LEFT', 'GUILLOTINE', 'MAXRECTS']

def generate_synthetic_data(n: int = 2000, seed: int = 42) -> tuple:
    """Generate realistic algorithm selection data using modern numpy.random.Generator"""
    rng = np.random.default_rng(seed)
    
    features = np.zeros((n, 14), dtype=np.float32)
    
    # Piece characteristics
    features[:, 0] = rng.uniform(0, 1, n)  # pieceSizeVariance
    features[:, 1] = rng.uniform(0, 1, n)  # smallPieceRatio
    features[:, 2] = rng.uniform(0, 1, n)  # largePieceRatio
    features[:, 3] = rng.uniform(0, 1, n)  # squarePieceRatio
    features[:, 4] = rng.integers(1, 50, n)  # uniqueShapeCount
    
    # Constraints
    features[:, 5] = rng.integers(0, 2, n)  # rotationAllowed
    features[:, 6] = rng.uniform(0, 1, n)  # grainConstraintRatio
    features[:, 7] = rng.integers(1, 10, n)  # stockVariety
    features[:, 8] = rng.uniform(0, 1, n)  # standardSizeRatio
    
    # Historical performance
    features[:, 9] = rng.uniform(8, 25, n)  # bottomLeftHistoricalWaste
    features[:, 10] = rng.uniform(8, 25, n)  # guillotineHistoricalWaste
    features[:, 11] = rng.uniform(8, 25, n)  # maxrectsHistoricalWaste
    
    # Counts
    features[:, 12] = rng.integers(10, 500, n)  # totalPieceCount
    features[:, 13] = rng.integers(1, 30, n)  # totalStockCount
    
    # Assign labels based on domain rules
    labels = np.zeros(n, dtype=np.int64)
    
    for i in range(n):
        if features[i, 0] > 0.7:
            labels[i] = 2  # MAXRECTS for high variance
        elif features[i, 6] > 0.5:
            labels[i] = 1  # GUILLOTINE for grain constraints
        elif features[i, 1] > 0.6:
            labels[i] = 0  # BOTTOM_LEFT for small pieces
        else:
            hist_waste = [features[i, 9], features[i, 10], features[i, 11]]
            labels[i] = int(np.argmin(hist_waste))
    
    return features, labels


# ==================== MAIN ====================

def main() -> None:
    print("=" * 60)
    print("🎯 ALGORITHM SELECTOR - Production Training")
    print("=" * 60)
    
    root_dir = Path(__file__).parent.parent.parent.parent.parent
    data_path = root_dir / 'modules' / 'ml-analytics' / 'training' / 'data' / 'algorithm_training_data.json'
    models_dir = root_dir / 'models' / 'onnx'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📂 Checking for data at: {data_path}")
    raw_data = load_training_data(str(data_path))
    
    if raw_data and len(raw_data) >= 100:
        print(f"✅ Loaded {len(raw_data)} real training records")
        
        feature_keys = [
            'pieceSizeVariance', 'smallPieceRatio', 'largePieceRatio', 'squarePieceRatio',
            'uniqueShapeCount', 'rotationAllowed', 'grainConstraintRatio', 'stockVariety',
            'standardSizeRatio', 'bottomLeftHistoricalWaste', 'guillotineHistoricalWaste',
            'maxrectsHistoricalWaste', 'totalPieceCount', 'totalStockCount'
        ]
        
        features = np.array([[r.get(k, 0) for k in feature_keys] for r in raw_data], dtype=np.float32)
        
        algo_map = {a: i for i, a in enumerate(ALGORITHMS)}
        labels = np.array([algo_map.get(r.get('bestAlgorithm', 'BOTTOM_LEFT'), 0) for r in raw_data], dtype=np.int64)
    else:
        print("⚠️  Insufficient real data, using synthetic data")
        features, labels = generate_synthetic_data(2000)
    
    print(f"📊 Dataset shape: X={features.shape}, y={labels.shape}")
    print(f"📊 Class distribution: {np.bincount(labels)}")
    
    features_norm, norm_params = normalize_features(features)
    
    model = AlgorithmSelectorNN(input_size=14)
    
    trainer = ProductionTrainer(
        model=model,
        criterion=nn.CrossEntropyLoss(),
        learning_rate=0.001,
        batch_size=32,
        epochs=150,
        patience=20,
        seed=42,
        verbose=True
    )
    
    train_loader, val_loader = trainer.prepare_data(features_norm, labels.astype(np.float32), val_split=0.2)
    trainer.train(train_loader, val_loader, is_classification=True)
    
    output_path = str(models_dir / 'algorithm_selector.onnx')
    trainer.export_onnx(output_path, input_size=14, model_name='algorithm_selector', norm_params=norm_params)
    
    print("\n✅ Algorithm Selector training complete!")


if __name__ == '__main__':
    main()
