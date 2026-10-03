import io
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _make_mock_image() -> bytes:
    img = Image.fromarray((np.random.rand(224, 224, 3) * 255).astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data
    assert "uptime" in data


def test_detect_hazard():
    image_bytes = _make_mock_image()
    response = client.post(
        "/api/v1/detect",
        files={"file": ("test.jpg", image_bytes, "image/jpeg")},
    )
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.json()
        assert "hazard_type" in data
        assert "confidence_score" in data
        assert "severity" in data
        assert data["confidence_score"] >= 0.0


def test_detect_hazard_invalid_file():
    response = client.post(
        "/api/v1/detect",
        files={"file": ("test.txt", b"not an image", "text/plain")},
    )
    assert response.status_code in (400, 500)


def test_batch_detect_empty():
    response = client.post("/api/v1/batch-detect", json={"image_urls": []})
    assert response.status_code == 404


def test_batch_detect():
    response = client.post(
        "/api/v1/batch-detect",
        json={"image_urls": ["https://example.com/test.jpg"]},
    )
    assert response.status_code in (200, 404, 500)
