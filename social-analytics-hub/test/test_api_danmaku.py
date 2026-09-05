import pytest
from fastapi.testclient import TestClient

from src.deps.container import AppContainer

# Define the actual route path
analysis_url = "/danmakus/analysis/generate"


def create_test_app():
    """Create a test app with the danmaku router"""
    from fastapi import FastAPI

    from src.api.routes.danmaku import router

    app = FastAPI()
    app.include_router(router, prefix="/danmakus", tags=["danmakus"])
    return app


@pytest.fixture
def test_client(mocker):
    """Create a test client with mocked dependencies"""
    # Create a real container instance
    container = AppContainer()

    # Mock the dependencies
    mock_repo = mocker.Mock()
    mock_analyzer = mocker.Mock()
    mock_cache_session = mocker.AsyncMock()

    # Override the providers with our mocks
    container.danmaku_repository.override(mock_repo)
    container.danmaku_analyzer.override(mock_analyzer)
    container.cache_session.override(mock_cache_session)

    # Initialize the container
    container.wire(modules=["src.api.routes.danmaku"])

    # Create app with container already wired
    app = create_test_app()

    return TestClient(app), mock_repo, mock_analyzer, mock_cache_session


class TestDanmakuAPI:
    @pytest.mark.asyncio
    async def test_generate_analysis_success(self, test_client, mocker):
        # Arrange
        client, _, mock_analyzer, _ = test_client
        mock_analyzer.precompute_analyses = mocker.AsyncMock(return_value=None)

        # Act
        response = client.post(
            analysis_url,
            json={
                "start_time": "2023-01-01T00:00:00Z",
                "end_time": "2023-01-02T00:00:00Z",
                "room_id": 123456,
            },
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Analysis generated"

    @pytest.mark.asyncio
    async def test_generate_analysis_without_room_id(self, test_client, mocker):
        # Arrange
        client, _, mock_analyzer, _ = test_client
        mock_analyzer.precompute_for_all_rooms = mocker.AsyncMock(return_value=None)

        # Act
        response = client.post(
            analysis_url,
            json={
                "start_time": "2023-01-01T00:00:00Z",
                "end_time": "2023-01-02T00:00:00Z",
            },
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Analysis generated"

    def test_generate_analysis_missing_required_fields(self, test_client, mocker):
        # Arrange
        client, _, _, _ = test_client

        # Act - missing start_time
        response = client.post(analysis_url, json={"end_time": "2023-01-02T00:00:00Z"})

        # Assert
        assert response.status_code == 422

    def test_generate_analysis_invalid_date_format(self, test_client, mocker):
        # Arrange
        client, _, _, _ = test_client

        # Act - invalid date format
        response = client.post(
            analysis_url,
            json={
                "start_time": "invalid_date",
                "end_time": "2023-01-02T00:00:00Z",
            },
        )

        # Assert
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_api_handles_analyzer_error(self, test_client, mocker):
        # Arrange
        client, _, mock_analyzer, _ = test_client
        mock_analyzer.precompute_analyses = mocker.AsyncMock(
            side_effect=Exception("Analysis error")
        )

        # Act & Assert
        response = client.post(
            analysis_url,
            json={
                "start_time": "2023-01-01T00:00:00Z",
                "end_time": "2023-01-02T00:00:00Z",
                "room_id": 123456,
            },
        )
        # The API should catch the exception and return a 500 error
        assert response.status_code == 500
