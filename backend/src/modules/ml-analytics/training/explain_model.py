"""
SHAP Model Explainer Script
Generates local and global explanations using SHAP library

Usage:
    python explain_model.py --model_type waste_predictor --model_path model.onnx --input_data '{"feature1": 1.0}'

Output:
    Prints JSON with SHAP values and feature importance
"""

import argparse
import json
import sys
import os
import numpy as np

# Graceful fallback if SHAP not installed
SHAP_AVAILABLE = False
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    pass

ONNX_AVAILABLE = False
try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    pass


def load_onnx_model(model_path: str):
    """Load ONNX model for inference"""
    if not ONNX_AVAILABLE:
        return None
    session = ort.InferenceSession(model_path)
    return session


def create_prediction_function(session):
    """Create a prediction function wrapper for SHAP"""
    input_name = session.get_inputs()[0].name
    
    def predict(X):
        if len(X.shape) == 1:
            X = X.reshape(1, -1)
        X = X.astype(np.float32)
        result = session.run(None, {input_name: X})
        return result[0]
    
    return predict


def generate_shap_explanation(session, input_data: dict, background_data: np.ndarray = None):
    """Generate SHAP local explanation for a single prediction"""
    
    # Convert input dict to numpy array (ordered by keys)
    feature_names = sorted(input_data.keys())
    input_array = np.array([[input_data[k] for k in feature_names]], dtype=np.float32)
    
    # Create background data if not provided
    if background_data is None:
        # Use zeros as fallback background (not ideal but works)
        background_data = np.zeros((10, len(feature_names)), dtype=np.float32)
    
    # Create prediction function
    predict_fn = create_prediction_function(session)
    
    # Create SHAP explainer
    try:
        # Try KernelExplainer (works with any model)
        explainer = shap.KernelExplainer(predict_fn, background_data)
        shap_values = explainer.shap_values(input_array, nsamples=100)
    except Exception as e:
        return None, str(e)
    
    # Get expected value (base value)
    expected_value = float(explainer.expected_value) if hasattr(explainer.expected_value, '__float__') else float(explainer.expected_value[0])
    
    # Build explanation result
    if isinstance(shap_values, list):
        shap_values = shap_values[0]  # For single output
    
    shap_values_flat = shap_values.flatten().tolist()
    
    # Calculate feature importance (absolute mean)
    feature_importance = {}
    for i, name in enumerate(feature_names):
        feature_importance[name] = abs(shap_values_flat[i])
    
    # Sort by importance
    sorted_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "featureNames": feature_names,
        "shapValues": shap_values_flat,
        "expectedValue": expected_value,
        "prediction": float(predict_fn(input_array).flatten()[0]),
        "featureImportance": [
            {"feature": name, "importance": importance, "value": float(input_data[name])}
            for name, importance in sorted_importance
        ],
        "topContributors": {
            "positive": [
                {"feature": feature_names[i], "contribution": shap_values_flat[i]}
                for i in range(len(shap_values_flat)) if shap_values_flat[i] > 0
            ][:5],
            "negative": [
                {"feature": feature_names[i], "contribution": shap_values_flat[i]}
                for i in range(len(shap_values_flat)) if shap_values_flat[i] < 0
            ][:5]
        }
    }, None


def generate_mock_explanation(model_type: str, input_data: dict):
    """Fallback mock explanation when SHAP is not available"""
    feature_names = sorted(input_data.keys())
    
    # Generate mock contributions based on simple heuristics
    contributions = {}
    baseline = 0.5
    
    if model_type == 'waste_predictor':
        baseline = 15.0  # 15% waste baseline
        for name in feature_names:
            val = float(input_data[name])
            # Simple mock: larger values = more contribution
            contributions[name] = val * 0.01 if val > 0 else 0.0
    elif model_type == 'time_estimator':
        baseline = 30.0  # 30 minutes baseline
        for name in feature_names:
            contributions[name] = float(input_data[name]) * 0.05
    else:
        for name in feature_names:
            contributions[name] = float(input_data[name]) * 0.02
    
    # Build result
    sorted_contribs = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
    
    return {
        "featureNames": feature_names,
        "shapValues": [contributions[n] for n in feature_names],
        "expectedValue": baseline,
        "prediction": baseline + sum(contributions.values()),
        "featureImportance": [
            {"feature": name, "importance": abs(contrib), "value": float(input_data[name])}
            for name, contrib in sorted_contribs
        ],
        "topContributors": {
            "positive": [
                {"feature": name, "contribution": contrib}
                for name, contrib in sorted_contribs if contrib > 0
            ][:5],
            "negative": [
                {"feature": name, "contribution": contrib}
                for name, contrib in sorted_contribs if contrib < 0
            ][:5]
        },
        "isMock": True
    }


def load_background_data(path: str) -> np.ndarray:
    """Load background data from CSV file"""
    try:
        import pandas as pd
        df = pd.read_csv(path)
        return df.values.astype(np.float32)
    except Exception as e:
        print(f"Warning: Could not load background data: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description='SHAP Model Explainer')
    parser.add_argument('--model_type', type=str, required=True, help='Model type')
    parser.add_argument('--model_path', type=str, required=True, help='Path to ONNX model')
    parser.add_argument('--input_data', type=str, required=True, help='JSON input features')
    parser.add_argument('--background_data', type=str, help='Path to background data CSV')
    
    args = parser.parse_args()
    
    try:
        # Parse input data
        input_data = json.loads(args.input_data)
        
        result = None
        
        # Try SHAP if available and model exists
        if SHAP_AVAILABLE and ONNX_AVAILABLE and os.path.exists(args.model_path):
            session = load_onnx_model(args.model_path)
            
            # Load background data if provided
            background = None
            if args.background_data and os.path.exists(args.background_data):
                background = load_background_data(args.background_data)
            
            # Generate SHAP explanation
            result, error = generate_shap_explanation(session, input_data, background)
            if error:
                print(f"SHAP failed, using mock: {error}", file=sys.stderr)
                result = None
        
        # Fallback to mock
        if result is None:
            result = generate_mock_explanation(args.model_type, input_data)
        
        # Add metadata
        result["modelType"] = args.model_type
        result["modelPath"] = args.model_path
        
        # Print JSON result
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Explanation failed: {str(e)}"}))
        sys.exit(1)


if __name__ == '__main__':
    main()
