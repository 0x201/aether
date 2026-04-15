import pytest
from app.database.session_factory import SessionFactory
from sqlalchemy.orm import Session


class TestSessionFactory:
    def setup_method(self):
        pass  # No initialization needed anymore

    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        """Setup mocks automatically for all tests in this class"""
        self.session_factory = SessionFactory()

        # Mock the _get_database method to return a mocked database instance
        self.db_mock = mocker.Mock()
        mocker.patch.object(
            self.session_factory, "_get_database", return_value=self.db_mock
        )

    def test_get_session_context_manager(self, mocker):
        # Arrange
        session_mock = mocker.Mock(spec=Session)
        session_context_mock = mocker.Mock()
        session_context_mock.__enter__ = mocker.Mock(return_value=session_mock)
        session_context_mock.__exit__ = mocker.Mock(return_value=None)

        # Make the database mock return our session context when get_session is called
        self.db_mock.get_session.return_value = session_context_mock

        # Act
        with self.session_factory.get_session() as session:
            # Assert
            assert session == session_mock
            session_context_mock.__enter__.assert_called_once()

    def test_get_transaction_with_autocommit_default(self, mocker):
        # Create a custom context manager that properly mimics the real behavior
        class TransactionContextManager:
            def __init__(self, session, autocommit=True):
                self.session = session
                self.autocommit = autocommit

            def __enter__(self):
                return self.session

            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type is None and self.autocommit:
                    self.session.commit()
                self.session.close()

        # Mock the session
        session_mock = mocker.Mock(spec=Session)

        # Mock the database's get_transaction to return our custom context manager
        def get_transaction_mock(autocommit=True):
            return TransactionContextManager(session_mock, autocommit)

        self.db_mock.get_transaction.side_effect = get_transaction_mock

        # Act
        with self.session_factory.get_transaction() as transaction:
            # Assert inside the context - commit should not be called yet
            assert transaction == session_mock
            session_mock.commit.assert_not_called()

        # After the context exits, check that commit was called on the session
        # Since get_transaction with autocommit=True should call commit when exiting context
        session_mock.commit.assert_called_once()

    def test_get_transaction_with_autocommit_false(self, mocker):
        # Create a custom context manager that properly mimics the real behavior
        class TransactionContextManager:
            def __init__(self, session, autocommit=True):
                self.session = session
                self.autocommit = autocommit

            def __enter__(self):
                return self.session

            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type is None and self.autocommit:
                    self.session.commit()
                self.session.close()

        # Mock the session
        session_mock = mocker.Mock(spec=Session)

        # Mock the database's get_transaction to return our custom context manager
        def get_transaction_mock(autocommit=True):
            return TransactionContextManager(session_mock, autocommit)

        self.db_mock.get_transaction.side_effect = get_transaction_mock

        # Act
        with self.session_factory.get_transaction(autocommit=False) as transaction:
            # Assert
            assert transaction == session_mock
            session_mock.commit.assert_not_called()  # Should not auto-commit

    def test_get_transaction_with_autocommit_false_manual_commit(self, mocker):
        # Create a custom context manager that properly mimics the real behavior
        class TransactionContextManager:
            def __init__(self, session, autocommit=True):
                self.session = session
                self.autocommit = autocommit

            def __enter__(self):
                return self.session

            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type is None and self.autocommit:
                    self.session.commit()
                self.session.close()

        # Mock the session
        session_mock = mocker.Mock(spec=Session)

        # Mock the database's get_transaction to return our custom context manager
        def get_transaction_mock(autocommit=True):
            return TransactionContextManager(session_mock, autocommit)

        self.db_mock.get_transaction.side_effect = get_transaction_mock

        # Act
        with self.session_factory.get_transaction(autocommit=False) as transaction:
            transaction.commit()  # Manual commit

            # Exit happens after this line
            # At exit, commit should not be called again since we already did it manually
            pass

        # Assert
        session_mock.commit.assert_called_once()
