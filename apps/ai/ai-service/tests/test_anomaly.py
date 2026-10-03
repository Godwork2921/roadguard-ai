from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_anomaly_sudden_brake():
    payload = {
        "sensor_data": {
            "accelerometer": {"x": -8.0, "y": 0.1, "z": 9.8},
            "gyroscope": {"x": 0.0, "y": 0.0, "z": 0.0},
        },
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 60.0,
        "heading": 90.0,
    }
    response = client.post("/api/v1/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["anomaly_type"] == "SUDDEN_BRAKE"


def test_anomaly_no_anomaly():
    payload = {
        "sensor_data": {
            "accelerometer": {"x": 0.0, "y": 0.0, "z": 9.8},
            "gyroscope": {"x": 0.0, "y": 0.0, "z": 0.0},
        },
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 30.0,
        "heading": 90.0,
    }
    response = client.post("/api/v1/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is False


def test_anomaly_hard_acceleration():
    payload = {
        "sensor_data": {
            "accelerometer": {"x": 6.0, "y": 0.0, "z": 9.8},
            "gyroscope": {"x": 0.0, "y": 0.0, "z": 0.0},
        },
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 40.0,
        "heading": 0.0,
    }
    response = client.post("/api/v1/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["anomaly_type"] == "HARD_ACCELERATION"


def test_anomaly_sharp_turn():
    payload = {
        "sensor_data": {
            "accelerometer": {"x": 0.0, "y": 2.0, "z": 9.8},
            "gyroscope": {"x": 0.0, "y": 0.0, "z": 0.5},
        },
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 50.0,
        "heading": 10.0,
    }
    response = client.post("/api/v1/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["anomaly_type"] == "SHARP_TURN"


def test_anomaly_rough_road():
    payload = {
        "sensor_data": {
            "accelerometer": {"x": 1.5, "y": 2.0, "z": 15.0},
            "gyroscope": {"x": 0.1, "y": 0.2, "z": 0.1},
        },
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 25.0,
        "heading": 180.0,
    }
    response = client.post("/api/v1/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["anomaly_type"] == "ROUGH_ROAD"


def test_anomaly_missing_sensor_data():
    payload = {
        "sensor_data": {},
        "latitude": 40.7128,
        "longitude": -74.0060,
    }
    response = client.post("/api/v1/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is False
