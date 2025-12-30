#!/usr/bin/env python3
"""
Anomaly Predictor Training Script - Production Grade
Multi-output model: Risk score + 4 anomaly type probabilities
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

class AnomalyPredictorNN(nn.Module):
    """
    Multi-head network for anomaly prediction
    Output: [RiskScore, P(HighWaste), P(SlowProd), P(MachineIssue), P(QualityProblem)]
    """
    
    def __init__(self, input_size: int = 12):
        super().__init__()
        
        # Shared feature extractor
        self.shared = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Dropout(0.2),
            
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32)
        )
        
        # Risk score head (regression 0-1)
        self.risk_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
        
        # Anomaly types head (multi-label classification)
        self.type_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 4),
            nn.Sigmoid()
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.shared(x)
        risk = self.risk_head(features)
        types = self.type_head(features)
        return torch.cat([risk, types], dim=1)


# ==================== DATA GENERATION ====================

ANOMALY_TYPES = ['high_waste', 'slow_production', 'machine_issue', 'quality_problem']

def generate_synthetic_data(n: int = 2000, seed: int = 42) -> tuple:
    """Generate realistic anomaly detection data using modern numpy.random.Generator"""
    rng = np.random.default_rng(seed)
    
    features = np.zeros((n, 12), dtype=np.float32)
    
    # Current metrics
    features[:, 0] = rng.uniform(5, 35, n)  # currentWaste
    features[:, 1] = rng.uniform(20, 120, n)  # currentTime
    features[:, 2] = rng.uniform(0.5, 1.0, n)  # currentEfficiency
    
    # Deviations from historical
    features[:, 3] = rng.uniform(-2, 3, n)  # wasteDeviation
    features[:, 4] = rng.uniform(-1, 2, n)  # timeDeviation
    features[:, 5] = rng.uniform(-1.5, 1, n)  # efficiencyDeviation
    
    # Context
    features[:, 6] = rng.integers(0, 5, n)  # recentAnomalyCount
    features[:, 7] = rng.uniform(10, 20, n)  # avgHistoricalWaste
    features[:, 8] = rng.uniform(40, 80, n)  # avgHistoricalTime
    
    # Time features
    features[:, 9] = rng.integers(0, 7, n)  # dayOfWeek
    features[:, 10] = rng.integers(6, 22, n)  # hourOfDay
    features[:, 11] = (features[:, 9] >= 5).astype(np.float32)  # isWeekend
    
    # Generate labels: [Risk, HighWaste, SlowProd, MachineIssue, Quality]
    labels = np.zeros((n, 5), dtype=np.float32)
    
    for i in range(n):
        risk = 0.0
        
        if features[i, 3] > 1.5:
            labels[i, 1] = min(0.9, features[i, 3] / 3)
            risk += 0.3
        
        if features[i, 4] > 1.0:
            labels[i, 2] = min(0.9, features[i, 4] / 2)
            risk += 0.25
        
        if features[i, 5] < -1.0:
            labels[i, 3] = min(0.9, abs(features[i, 5]) / 2)
            risk += 0.25
        
        if features[i, 6] >= 3:
            risk += 0.15
            labels[i, 4] = 0.3
        
        if features[i, 11] == 1 or features[i, 10] > 20 or features[i, 10] < 7:
            risk += 0.05
        
        labels[i, 0] = min(1.0, risk)
    
    return features, labels


# ==================== MAIN ====================

def main() -> None:
    print("=" * 60)
    print("🔍 ANOMALY PREDICTOR - Production Training")
    print("=" * 60)
    
    root_dir = Path(__file__).parent.parent.parent.parent.parent
    data_path = root_dir / 'modules' / 'ml-analytics' / 'training' / 'data' / 'anomaly_training_data.json'
    models_dir = root_dir / 'models' / 'onnx'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📂 Checking for data at: {data_path}")
    raw_data = load_training_data(str(data_path))
    
    if raw_data and len(raw_data) >= 100:
        print(f"✅ Loaded {len(raw_data)} real training records")
        
        feature_keys = [
            'currentWaste', 'currentTime', 'currentEfficiency', 'wasteDeviation',
            'timeDeviation', 'efficiencyDeviation', 'recentAnomalyCount',
            'avgHistoricalWaste', 'avgHistoricalTime', 'dayOfWeek', 'hourOfDay', 'isWeekend'
        ]
        
        features = np.array([[r.get(k, 0) for k in feature_keys] for r in raw_data], dtype=np.float32)
        
        labels_list = []
        for r in raw_data:
            label_vec = [0.0] * 5
            had_anomaly = r.get('hadAnomaly', 0)
            atype = r.get('anomalyType')
            
            if had_anomaly:
                label_vec[0] = 0.8
                if atype == 'high_waste': label_vec[1] = 1.0
                elif atype == 'slow_production': label_vec[2] = 1.0
                elif atype == 'machine_issue': label_vec[3] = 1.0
            else:
                label_vec[0] = 0.1
                
            labels_list.append(label_vec)
        
        labels = np.array(labels_list, dtype=np.float32)
    else:
        print("⚠️  Insufficient real data, using synthetic data")
        features, labels = generate_synthetic_data(2000)
    
    print(f"📊 Dataset shape: X={features.shape}, y={labels.shape}")
    
    features_norm, norm_params = normalize_features(features)
    
    model = AnomalyPredictorNN(input_size=12)
    
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
    
    output_path = str(models_dir / 'anomaly_predictor.onnx')
    trainer.export_onnx(output_path, input_size=12, model_name='anomaly_predictor', norm_params=norm_params)
    
    print("\n✅ Anomaly Predictor training complete!")


if __name__ == '__main__':
    main()
