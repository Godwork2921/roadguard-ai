# AI

Reserved for model and inference documentation.

The inference service is `apps/ai/ai-service` (FastAPI), exposing hazard detection
and anomaly detection under `/api/v1`. Model artifacts live in object storage or
a model registry rather than in Git; see [`ml/README.md`](../../ml/README.md).

Material to add here: model versions and their evaluation metrics, confidence
thresholds and their effect on false positives, and the route/hazard scoring
methodology.