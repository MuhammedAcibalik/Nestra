"""
Data Loading Utilities
Handles loading and preprocessing of matching JSON data for training
"""

import json
import numpy as np
import torch
from pathlib import Path
from typing import Tuple, Dict, Any, List

def load_training_data(file_path: str) -> List[Dict[str, Any]]:
    """Load raw training data from JSON file"""
    path = Path(file_path)
    if not path.exists():
        print(f"Warning: Data file not found at {file_path}")
        return []
        
    with open(path, 'r') as f:
        return json.load(f)

def normalize_features(features: np.ndarray) -> Tuple[np.ndarray, Dict[str, List[float]]]:
    """
    Z-score normalization
    Returns: (normalized_features, params)
    """
    means = features.mean(axis=0).tolist()
    stds = features.std(axis=0).tolist()
    # Avoid division by zero
    stds = [s if s > 1e-6 else 1.0 for s in stds]
    
    normalized = (features - np.array(means)) / np.array(stds)
    
    return normalized, {'means': means, 'stds': stds}

def save_metadata(output_path: str, model_type: str, norm_params: Dict, input_size: int):
    """Save model metadata including normalization parameters"""
    metadata_path = str(output_path).replace('.onnx', '_metadata.json')
    
    metadata = {
        'modelType': model_type,
        'version': '1.0.0',
        'normParams': norm_params,
        'inputSize': input_size,
        'updatedAt': '2025-12-27T16:00:00.000Z' # Simplified
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {metadata_path}")
