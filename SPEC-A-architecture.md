# SPEC-A - Architecture

## What we are building
A small API with 2 endpoints:
- create a cart context
- fetch a cart using that context

Upstream cart context can expire, so the API must return a clear error when it happens.

## Main parts

### 1) HTTP routes
**Owns:** request parsing + simple validation + turning errors into HTTP responses
**Does NOT own:** business rules, expiry decisions, upstream logic

Routes call the service and return what it says, so business rule changes don't leak into HTTP code.

### 2) CartService
**Owns:** CartService defines the decision flow for each use-case and is the only place where those rules live:
- create context
- get cart (handle expiry and not-found)

**Does NOT own:** HTTP details, upstream implementation details

CartService talks only to interfaces, so upstream behavior can change without rewriting the service.

### 3) UpstreamCartClient
This is the only "contract" CartService needs.

Methods:
- `createContext(input) -> { contextId, expiresAt }`
- `getCart(contextId) -> UpstreamCart`

CartService doesn't know if this is Salesforce or something else.

### 4) SalesforceCartClientMock
**Owns:** realistic upstream behavior for tests:
- contexts expire after TTL
- expired contexts throw a known error
- upstream always behaves the same way for the same input, so tests don't randomly fail

### 5) ContextStore
**Owns:** tracking context expiry
- `contextId -> expiresAt`

This is simple in-memory storage and does not make business decisions.

## Logging

**Purpose:** Track requests and failures for debugging and operational visibility.

**Where logging belongs:**

**HTTP layer:**
- Log incoming requests (method + path)
- Log all errors with error code and contextId when available

**Service layer:**
- Does NOT log (business logic stays pure)
- Errors flow up to HTTP layer for logging

**Upstream mock:**
- Does NOT log (simulates external system, not our system)

**Guidelines:**
- Use console.log for info, console.error for errors
- Log at system boundaries (HTTP in, errors out), not internal steps
- For CONTEXT_NOT_FOUND and CONTEXT_EXPIRED errors, include contextId and cartId if available

## Error rules
All errors return:
- `code`
- `message`
- `details`

Error shapes stay stable even if internal logic changes.

Common ones:
- `VALIDATION_ERROR` (400)
- `CONTEXT_NOT_FOUND` (404)
- `CONTEXT_EXPIRED` (410)

## Non-goals
No auth, no DB.
