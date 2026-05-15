"""Tests for Pagos router"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestPagosRouter:
    """Test suite for Pagos router endpoints"""

    @pytest.fixture
    def client(self):
        """Provide test client"""
        from backend.main import app
        return TestClient(app)

    def test_webhook_verification_get(self, client):
        """Test GET /pagos/webhook returns ok"""
        response = client.get("/pagos/webhook")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    @patch('backend.pagos.router.PagosService')
    def test_crear_preferencia_requires_auth(self, mock_service, client):
        """Test /crear-preferencia requires authentication"""
        # Create mock service instance
        mock_instance = MagicMock()
        mock_service.return_value = mock_instance

        response = client.post(
            "/pagos/crear-preferencia",
            json={"pedido_id": 1}
        )

        # Should fail without auth (401)
        assert response.status_code in [401, 422]

    @patch('backend.pagos.router.PagosService')
    def test_get_pago_requires_auth(self, mock_service, client):
        """Test GET /pagos/{pedido_id} requires authentication"""
        response = client.get("/pagos/1")
        # Should fail without auth
        assert response.status_code in [401, 422]


class TestWebhookEndpoint:
    """Test suite for webhook endpoint"""

    def test_webhook_post_without_auth(self):
        """Test webhook accepts requests without authentication (public endpoint)"""
        from backend.main import app
        client = TestClient(app)

        # Webhook should be public (no auth required)
        response = client.post(
            "/pagos/webhook",
            json={"action": "payment.created", "data": {"id": 12345}}
        )

        # Should return 200 regardless (handles the notification)
        assert response.status_code == 200