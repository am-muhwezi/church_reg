# FastAPI Development Guide
### Church Registration Backend

A practical reference for adding endpoints to this project.
Written for developers with Flask or DRF experience.

---

## How FastAPI compares to what you know

| Concept | Flask | DRF | FastAPI (this project) |
|---|---|---|---|
| URL definition | `@app.route` | `urls.py` + `ViewSet` | `@router.get/post/...` |
| Request body | `request.get_json()` | `Serializer` | Pydantic schema (auto-parsed) |
| DB access | `db.session` | `queryset` | `repo.add/get/list` via `AsyncSession` |
| Validation | manual or WTForms | Serializer `.is_valid()` | automatic — 422 if schema fails |
| Async | no (by default) | no (by default) | yes — always use `async def` + `await` |

---

## Project structure

```
src/
  db/
    models/         <- SQLAlchemy models (database table columns)
    repositories/   <- Database query methods (add, get, list, update, delete)
    routes/         <- URL definitions and HTTP methods
  schemas/          <- Pydantic schemas (request/response shape)
  services/         <- Business logic (sits between routes and repositories)
main.py             <- App entry point, router registration
```

---

## How a request flows

```
Insomnia / Browser
    -> main.py              (app setup, router registered with prefix)
        -> routes/saints.py (URL + HTTP method matched)
            -> services/    (business logic runs)
                -> repositories/ (database query executes)
```

---

## The 4-file checklist for every new endpoint

Work top to bottom when adding, bottom to top when debugging.

```
1. src/db/models/saints.py           Is the column in the database?
2. src/schemas/saints.py             What shape does the JSON have?
3. src/services/saints_service.py    What is the business logic?
4. src/db/routes/saints.py           What URL and HTTP method triggers it?
```

---

## The 5 standard endpoints

### 1. POST /saints/register — Create (already built)

```python
# routes/saints.py
@saints_router.post("/register")
async def register_saint_route(data: SaintCreate, db: AsyncSession = Depends(get_session)):
    return await register_saint(db, data)

# services/saints_service.py
async def register_saint(db: AsyncSession, saint_create: SaintCreate):
    repo = SaintsRepository(session=db)
    saint = Saint(**saint_create.model_dump())  # Pydantic schema -> SQLAlchemy model
    return await repo.add(saint)               # save to database
```

---

### 2. GET /saints — List all

```python
# services/saints_service.py
async def list_saints_service(db: AsyncSession):
    repo = SaintsRepository(session=db)
    return await repo.list()

# routes/saints.py
@saints_router.get("/")
async def list_saints_route(db: AsyncSession = Depends(get_session)):
    return await list_saints_service(db)
```

No request body. GET requests never have a body — data comes from the URL only.

---

### 3. GET /saints/{saint_id} — Get one

```python
# services/saints_service.py
async def get_saint_service(db: AsyncSession, saint_id):
    repo = SaintsRepository(session=db)
    return await repo.get(saint_id)   # returns None if not found

# routes/saints.py
import uuid
from fastapi import HTTPException

@saints_router.get("/{saint_id}")
async def get_saint_route(saint_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    saint = await get_saint_service(db, saint_id)
    if not saint:
        raise HTTPException(status_code=404, detail="Saint not found")
    return saint
```

`{saint_id}` in the URL becomes a function parameter automatically.
`HTTPException(404)` is the FastAPI equivalent of DRF's `Http404`.

---

### 4. PATCH /saints/{saint_id} — Update

First add a schema for partial updates in `src/schemas/saints.py`:

```python
class SaintUpdate(BaseModel):
    # All fields are optional — user only sends what they want to change
    first_name: str | None = None
    last_name: str | None = None
    occupation: str | None = None
    gender: bool | None = None
    first_time: bool | None = None
    whatsApp_group_consent: bool | None = None
    consent_to_share_info: bool | None = None
```

Then add the service and route:

```python
# services/saints_service.py
async def update_saint_service(db: AsyncSession, saint_id, data: SaintUpdate):
    repo = SaintsRepository(session=db)
    saint = await repo.get(saint_id)
    if not saint:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(saint, field, value)   # only update fields that were sent
    return await repo.update(saint)

# routes/saints.py
@saints_router.patch("/{saint_id}")
async def update_saint_route(
    saint_id: uuid.UUID,
    data: SaintUpdate,
    db: AsyncSession = Depends(get_session)
):
    saint = await update_saint_service(db, saint_id, data)
    if not saint:
        raise HTTPException(status_code=404, detail="Saint not found")
    return saint
```

`exclude_none=True` skips fields the user did not send.
This is the FastAPI equivalent of DRF's `partial=True` on a serializer.

---

### 5. DELETE /saints/{saint_id} — Delete

```python
# services/saints_service.py
async def delete_saint_service(db: AsyncSession, saint_id):
    repo = SaintsRepository(session=db)
    await repo.delete(saint_id)

# routes/saints.py
@saints_router.delete("/{saint_id}", status_code=204)
async def delete_saint_route(saint_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    await delete_saint_service(db, saint_id)
```

`status_code=204` means "success, no content to return" — the standard HTTP response for deletes.

---

## Rules to avoid common bugs

| Rule | Why |
|---|---|
| Never name a route handler the same as an imported function | Causes infinite recursion — the function calls itself instead of the import |
| Schema fields must exactly match model column names | `**data.model_dump()` will error or silently pass wrong data |
| Always `await` async calls | Missing `await` returns a coroutine object, not actual data |
| Name route handlers with `_route` suffix | Keeps them visually distinct from service functions |
| After changing a model, restart the server | `create_all=True` in setup.py will sync new columns on startup |

---

## HTTP status codes to know

| Code | Meaning | When to use |
|---|---|---|
| 200 | OK | Default for GET, PATCH |
| 201 | Created | Successful POST (add `status_code=201` to decorator) |
| 204 | No Content | Successful DELETE |
| 422 | Unprocessable | Schema validation failed (FastAPI handles this automatically) |
| 404 | Not Found | Resource does not exist — raise `HTTPException(status_code=404)` |
| 500 | Server Error | Unhandled exception in your code |

---

## Adding a completely new resource

When you need a new resource (e.g. `attendance`, `cell_group`), create these files:

```
src/db/models/attendance.py           <- new SQLAlchemy model
src/schemas/attendance.py             <- new Pydantic schemas
src/services/attendance_service.py    <- new service functions
src/db/routes/attendance.py           <- new router
src/db/repositories/attendance_repo.py  <- new repository class
```

Then register the router in `main.py`:

```python
from src.db.routes.attendance import attendance_router

app.include_router(attendance_router, prefix="/attendance", tags=["attendance"])
```

The repository class is always the same pattern:

```python
from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from src.db.models.attendance import Attendance

class AttendanceRepository(SQLAlchemyAsyncRepository[Attendance]):
    model_type = Attendance
```

`SQLAlchemyAsyncRepository` gives you `add`, `get`, `list`, `update`, `delete` for free.
You only write custom methods when you need a query that isn't covered by those five.

---

## Testing endpoints

Use the auto-generated docs at `http://0.0.0.0:8000/docs` to test without Insomnia.
FastAPI generates this from your schemas automatically — no extra setup needed.

---

## Admin Authentication

### Overview

Use **JWT (JSON Web Tokens)** with **bcrypt password hashing**. The flow:

1. Admin logs in with email + password → server returns a signed JWT
2. Client stores JWT in `localStorage`
3. Subsequent admin requests send `Authorization: Bearer <token>`
4. Protected routes validate the token via a FastAPI dependency

---

### Step 1 — Install dependencies

```bash
pip install passlib[bcrypt] python-jose[cryptography]
```

---

### Step 2 — Fix the Admin model (`src/db/models/admin.py`)

The model is currently missing `mapped_column` definitions. Fix it:

```python
from sqlalchemy import String
from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy.orm import Mapped, mapped_column


class Admin(UUIDAuditBase):
    __tablename__ = "admins"

    username: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="admin")
```

Import it in `main.py` so SQLAlchemy registers it for `create_all`:
```python
import src.db.models.admin  # noqa: F401
```

---

### Step 3 — Add SECRET_KEY to config (`src/config.py`)

```python
class Settings(BaseSettings):
    # ... existing fields ...
    SECRET_KEY: str                             # generate with: openssl rand -hex 32
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480      # 8 hours
```

---

### Step 4 — Auth utilities (`src/auth/utils.py`)

Create the file `src/auth/__init__.py` (empty) and `src/auth/utils.py`:

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.config import settings

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Raises JWTError if invalid or expired."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
```

---

### Step 5 — Auth schemas (`src/schemas/auth.py`)

```python
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

---

### Step 6 — Auth service (`src/services/auth_service.py`)

```python
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.utils import verify_password, create_access_token
from src.db.repositories.admin_repo import AdminRepository
from src.schemas.auth import LoginRequest, TokenResponse


async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse | None:
    repo = AdminRepository(session=db)
    admins = await repo.list(email=data.email)

    if not admins or not verify_password(data.password, admins[0].password_hash):
        return None  # caller raises 401

    token = create_access_token({"sub": str(admins[0].id), "role": admins[0].role})
    return TokenResponse(access_token=token)
```

---

### Step 7 — Auth dependency (`src/auth/dependencies.py`)

Attach this to any route that requires a logged-in admin:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from src.auth.utils import decode_token

bearer_scheme = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    try:
        return decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

---

### Step 8 — Auth router (`src/db/routes/auth.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.setup import get_session
from src.schemas.auth import LoginRequest, TokenResponse
from src.services.auth_service import login

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/login", response_model=TokenResponse)
async def login_route(data: LoginRequest, db: AsyncSession = Depends(get_session)):
    result = await login(db, data)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return result
```

Register it in `main.py`:
```python
from src.db.routes.auth import auth_router
app.include_router(auth_router)
```

---

### Step 9 — Protect admin routes

```python
from src.auth.dependencies import get_current_admin

@admin_router.get("/saints")
async def list_saints(
    db: AsyncSession = Depends(get_session),
    admin: dict = Depends(get_current_admin),   # blocks unauthenticated requests
):
    ...
```

Role check example:
```python
if admin.get("role") != "super_admin":
    raise HTTPException(status_code=403, detail="Insufficient permissions")
```

---

### Step 10 — Seed the first admin (run once)

```python
# scripts/seed_admin.py
import asyncio
from src.db.setup import sqlalchemy_config
from src.db.models.admin import Admin
from src.db.repositories.admin_repo import AdminRepository
from src.auth.utils import hash_password


async def main():
    async with sqlalchemy_config.get_session() as session:
        repo = AdminRepository(session=session)
        admin = Admin(
            username="Super Admin",
            email="admin@manifest.ke",
            password_hash=hash_password("change-me-immediately"),
            role="super_admin",
        )
        await repo.add(admin)

asyncio.run(main())
```

---

### Step 11 — Frontend integration

In `client/src/api/client.ts`, add a helper that attaches the token:

```typescript
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function authGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: authHeaders() })
  return handleResponse<T>(res)
}

export async function authPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}
```

On the admin login page, after a successful `/auth/login` call:
```typescript
localStorage.setItem('admin_token', data.access_token)
navigate('/admin')
```

On logout:
```typescript
localStorage.removeItem('admin_token')
navigate('/admin/login')
```

Wrap all admin routes in a `<RequireAuth>` component:
```tsx
// src/components/RequireAuth.tsx
import { Navigate, Outlet } from 'react-router-dom'

export default function RequireAuth() {
  const token = localStorage.getItem('admin_token')
  return token ? <Outlet /> : <Navigate to="/admin/login" replace />
}
```

Then in `App.tsx`:
```tsx
<Route element={<RequireAuth />}>
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<Dashboard />} />
    <Route path="/admin/saints" element={<Saints />} />
    {/* ... */}
  </Route>
</Route>
```