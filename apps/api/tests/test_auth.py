def test_auth_token_rejects_invalid_password(client):
    response = client.post(
        "/api/v1/auth/token",
        json={"email": "admin@prism.dev", "password": "wrong"},
    )
    assert response.status_code == 401


def test_auth_token_accepts_dev_password(client):
    response = client.post(
        "/api/v1/auth/token",
        json={"email": "admin@prism.dev", "password": "prism"},
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"] == "dev-token"


def test_auth_me(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "admin@prism.dev"
