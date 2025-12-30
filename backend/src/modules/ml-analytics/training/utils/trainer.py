"""
Production-Grade Trainer Utility
Provides GPU support, early stopping, LR scheduling, and reproducibility
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from torch.optim.lr_scheduler import ReduceLROnPlateau
import numpy as np
from typing import Optional, Tuple
import json
from datetime import datetime
import os


def get_num_workers() -> int:
    """Get optimal number of workers for DataLoader"""
    # Use 0 on Windows to avoid multiprocessing issues, otherwise use CPU count
    if os.name == 'nt':
        return 0
    cpu_count = os.cpu_count()
    return min(4, cpu_count) if cpu_count else 0


class EarlyStopping:
    """Early stopping to stop training when validation loss doesn't improve."""
    
    def __init__(self, patience: int = 10, min_delta: float = 0.0001, mode: str = 'min'):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.counter = 0
        self.best_score: Optional[float] = None
        self.should_stop = False
        self.best_state: Optional[dict] = None
        
    def __call__(self, score: float, model: nn.Module) -> bool:
        if self.best_score is None:
            self.best_score = score
            self.best_state = model.state_dict().copy()
            return False
            
        improved = self._is_improved(score)
            
        if improved:
            self.best_score = score
            self.best_state = model.state_dict().copy()
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
                
        return self.should_stop
    
    def _is_improved(self, score: float) -> bool:
        """Check if score improved based on mode"""
        if self.best_score is None:
            return True
        if self.mode == 'min':
            return score < self.best_score - self.min_delta
        return score > self.best_score + self.min_delta


class ProductionTrainer:
    """
    Production-grade model trainer with:
    - Automatic GPU/CPU device selection
    - Early stopping
    - Learning rate scheduling
    - Reproducibility
    - Training history logging
    """
    
    def __init__(
        self,
        model: nn.Module,
        criterion: nn.Module,
        optimizer_class: type = optim.Adam,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        epochs: int = 100,
        patience: int = 15,
        seed: int = 42,
        verbose: bool = True
    ):
        self.seed = seed
        self._set_seeds()
        
        self.rng = np.random.default_rng(seed)
        self.device = self._get_device()
        self.verbose = verbose
        
        if verbose:
            print(f"🖥️  Using device: {self.device}")
            if self.device.type == 'cuda':
                print(f"   GPU: {torch.cuda.get_device_name(0)}")
        
        self.model = model.to(self.device)
        self.criterion = criterion
        self.optimizer = optimizer_class(model.parameters(), lr=learning_rate)
        
        self.scheduler = ReduceLROnPlateau(
            self.optimizer, mode='min', factor=0.5, patience=5, min_lr=1e-6
        )
        
        self.early_stopping = EarlyStopping(patience=patience, mode='min')
        self.batch_size = batch_size
        self.epochs = epochs
        
        self.history: dict = {'train_loss': [], 'val_loss': [], 'learning_rate': []}
        
    def _set_seeds(self) -> None:
        """Set all seeds for reproducibility"""
        torch.manual_seed(self.seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(self.seed)
            torch.cuda.manual_seed_all(self.seed)
            torch.backends.cudnn.deterministic = True
            torch.backends.cudnn.benchmark = False
            
    def _get_device(self) -> torch.device:
        """Get best available device"""
        if torch.cuda.is_available():
            return torch.device('cuda')
        return torch.device('cpu')
    
    def prepare_data(
        self, 
        features: np.ndarray, 
        labels: np.ndarray, 
        val_split: float = 0.2
    ) -> Tuple[DataLoader, DataLoader]:
        """Prepare train and validation data loaders"""
        indices = self.rng.permutation(len(features))
        features = features[indices]
        labels = labels[indices]
        
        split_idx = int(len(features) * (1 - val_split))
        x_train, x_val = features[:split_idx], features[split_idx:]
        y_train, y_val = labels[:split_idx], labels[split_idx:]
        
        train_ds = TensorDataset(torch.FloatTensor(x_train), torch.FloatTensor(y_train))
        val_ds = TensorDataset(torch.FloatTensor(x_val), torch.FloatTensor(y_val))
        
        num_workers = get_num_workers()
        train_loader = DataLoader(train_ds, batch_size=self.batch_size, shuffle=True, num_workers=num_workers)
        val_loader = DataLoader(val_ds, batch_size=self.batch_size, num_workers=num_workers)
        
        return train_loader, val_loader
    
    def train(
        self, 
        train_loader: DataLoader, 
        val_loader: DataLoader,
        is_classification: bool = False
    ) -> nn.Module:
        """Main training loop with all production features"""
        self._log_training_start()
        
        for epoch in range(self.epochs):
            train_loss = self._train_epoch(train_loader, is_classification)
            val_loss = self._validate_epoch(val_loader, is_classification)
            
            should_stop = self._update_training_state(epoch, train_loss, val_loss)
            if should_stop:
                break
        
        self._finalize_training()
        return self.model
    
    def _log_training_start(self) -> None:
        """Log training start message"""
        if self.verbose:
            print(f"\n{'='*50}")
            print(f"Starting training: {self.epochs} max epochs, patience={self.early_stopping.patience}")
            print(f"{'='*50}\n")
    
    def _train_epoch(self, train_loader: DataLoader, is_classification: bool) -> float:
        """Run one training epoch"""
        self.model.train()
        total_loss = 0.0
        
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(self.device), batch_y.to(self.device)
            
            self.optimizer.zero_grad()
            outputs = self.model(batch_x)
            
            loss = self._compute_loss(outputs, batch_y, is_classification)
            loss.backward()
            
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()
            total_loss += loss.item()
        
        return total_loss / len(train_loader)
    
    def _validate_epoch(self, val_loader: DataLoader, is_classification: bool) -> float:
        """Run one validation epoch"""
        self.model.eval()
        total_loss = 0.0
        
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(self.device), batch_y.to(self.device)
                outputs = self.model(batch_x)
                loss = self._compute_loss(outputs, batch_y, is_classification)
                total_loss += loss.item()
        
        return total_loss / len(val_loader)
    
    def _compute_loss(self, outputs: torch.Tensor, targets: torch.Tensor, is_classification: bool) -> torch.Tensor:
        """Compute loss based on task type"""
        if is_classification:
            return self.criterion(outputs, targets.long())
        return self.criterion(outputs.squeeze(), targets)
    
    def _update_training_state(self, epoch: int, train_loss: float, val_loss: float) -> bool:
        """Update history, scheduler, and check early stopping"""
        current_lr = self.optimizer.param_groups[0]['lr']
        self.history['train_loss'].append(train_loss)
        self.history['val_loss'].append(val_loss)
        self.history['learning_rate'].append(current_lr)
        
        self.scheduler.step(val_loss)
        
        if self.early_stopping(val_loss, self.model):
            if self.verbose:
                print(f"\n⏹️  Early stopping at epoch {epoch+1}")
            return True
        
        if self.verbose and (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1:3d}/{self.epochs} | Train: {train_loss:.4f} | Val: {val_loss:.4f} | LR: {current_lr:.2e}")
        
        return False
    
    def _finalize_training(self) -> None:
        """Load best model and log completion"""
        if self.early_stopping.best_state:
            self.model.load_state_dict(self.early_stopping.best_state)
            
        if self.verbose and self.early_stopping.best_score is not None:
            print(f"\n✅ Training complete. Best val loss: {self.early_stopping.best_score:.4f}")
    
    def export_onnx(
        self, 
        output_path: str, 
        input_size: int,
        model_name: str,
        norm_params: dict
    ) -> None:
        """Export model to ONNX format with metadata"""
        self.model.eval()
        self.model.cpu()
        
        dummy_input = torch.randn(1, input_size)
        
        torch.onnx.export(
            self.model,
            dummy_input,
            output_path,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
            opset_version=17,
            dynamo=False  # Use legacy export, not TorchDynamo
        )
        
        self._save_metadata(output_path, model_name, norm_params, input_size)
    
    def _save_metadata(self, output_path: str, model_name: str, norm_params: dict, input_size: int) -> None:
        """Save model metadata to JSON"""
        metadata_path = output_path.replace('.onnx', '_metadata.json')
        metadata = {
            'modelType': model_name,
            'version': '2.0.0',
            'normParams': norm_params,
            'inputSize': input_size,
            'trainHistory': {
                'finalTrainLoss': self.history['train_loss'][-1] if self.history['train_loss'] else None,
                'finalValLoss': self.history['val_loss'][-1] if self.history['val_loss'] else None,
                'epochs': len(self.history['train_loss'])
            },
            'exportedAt': datetime.now().isoformat(),
            'device': str(self.device)
        }
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
            
        print(f"📦 Model exported: {output_path}")
        print(f"📋 Metadata saved: {metadata_path}")
