# ML

Reserved for the hazard-detection and anomaly-detection models.

Expected contents as the AI work advances:

```
ml/
├── datasets/        versioned training data + dataset cards
├── notebooks/       exploratory analysis
├── training/        reproducible training entrypoints
├── evaluation/      metrics, confusion matrices, error analysis
└── registry/        model versions and their lineage
```

Models themselves are **not** stored here. Trained artifacts belong in object
storage (`roadguard-ai` bucket) or a model registry, because Git is the wrong
place for binary blobs and `.gitignore` already excludes `*.tflite`, `*.onnx`,
`*.h5`, and `*.pkl` from the AI service for that reason.