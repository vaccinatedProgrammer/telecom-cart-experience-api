# SPEC-B – API Contracts

This describes the HTTP endpoints for the cart Experience API.

---

## Base URL
`/api/cart`

---

## General rules

### Content type
All requests and responses use JSON.

### Error format (shared)
All errors follow the same shape:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Readable message",
    "details": {}
  }
}
```

Common error codes in this version:
- `VALIDATION_ERROR` (400)
- `CONTEXT_NOT_FOUND` (404)
- `CONTEXT_EXPIRED` (410)
- `UPSTREAM_UNAVAILABLE` (503)

---

## Endpoint 1: Create cart context

### POST `/api/cart/cart-contexts`

Creates a new upstream cart context.
The context is non-persistent and will expire after a fixed time.

### Request body (minimal)
```json
{
  "market": "CA",
  "channel": "web"
}
```

---

### Success response (201)
```json
{
  "contextId": "ctx_8f12ab",
  "expiresAt": "2025-12-13T20:00:00.000Z",
  "cart": {
    "cartId": "ctx_8f12ab",
    "expiresAt": "2025-12-13T20:00:00.000Z",
    "items": [],
    "totals": {
      "currency": "CAD",
      "subtotal": 0,
      "tax": 0,
      "total": 0
    }
  }
}
```

---

### Errors
- **400 `VALIDATION_ERROR`**
- **503 `UPSTREAM_UNAVAILABLE`**

---

## Endpoint 2: Get cart

### GET `/api/cart/carts/{contextId}`

Fetches the cart associated with a context.

---

### Success response (200)
```json
{
  "cartId": "ctx_8f12ab",
  "expiresAt": "2025-12-13T20:00:00.000Z",
  "items": [
    { "plan": "5G_BASIC", "qty": 1 }
  ],
  "totals": {
    "currency": "CAD",
    "subtotal": 50,
    "tax": 6.5,
    "total": 56.5
  }
}
```

---

### Errors
- **400 `VALIDATION_ERROR`**
- **404 `CONTEXT_NOT_FOUND`**
- **410 `CONTEXT_EXPIRED`**
- **503 `UPSTREAM_UNAVAILABLE`**

---