async def test_search_by_exact_name_returns_saint(client, registered_saint):
    resp = await client.get("/saints/search", params={"first_name": "John", "last_name": "Doe"})
    assert resp.status_code == 200
    assert resp.json()["id"] == registered_saint["id"]


async def test_search_case_insensitive_via_normalization(client, registered_saint):
    resp = await client.get("/saints/search", params={"first_name": "JOHN", "last_name": "doe"})
    assert resp.status_code == 200
    assert resp.json()["id"] == registered_saint["id"]


async def test_search_with_whitespace_finds_saint(client, registered_saint):
    resp = await client.get("/saints/search", params={"first_name": "  John  ", "last_name": "  Doe  "})
    assert resp.status_code == 200
    assert resp.json()["id"] == registered_saint["id"]


async def test_search_reversed_name_order_finds_saint(client, registered_saint):
    resp = await client.get("/saints/search", params={"first_name": "Doe", "last_name": "John"})
    assert resp.status_code == 200
    assert resp.json()["id"] == registered_saint["id"]


async def test_search_not_found_returns_404(client):
    resp = await client.get("/saints/search", params={"first_name": "Nobody", "last_name": "Here"})
    assert resp.status_code == 404


async def test_search_missing_first_name_returns_422(client):
    resp = await client.get("/saints/search", params={"last_name": "Doe"})
    assert resp.status_code == 422


async def test_search_missing_last_name_returns_422(client):
    resp = await client.get("/saints/search", params={"first_name": "John"})
    assert resp.status_code == 422
