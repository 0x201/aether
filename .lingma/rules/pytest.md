---
trigger: manual
---

## Unit Test
Use pytest to generate unit test for python project.

## Mock
Use pytest-mock to mock up dependencies

```python

@pytest.fixture
def test(mocker):
    # normal Mock object
    service_a = mocker.Mock()

    # async Mock object
    service_b = mocker.AsyncMock()
```

## Async IO

Use pytest-asyncio to generate async IO related testing

```python
@pytest.mark.asyncio
def test(mocker):
    
```