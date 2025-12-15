# PROMPTS.md


Prompt:
```text
You are acting as a senior backend engineer.

read below two markdown spec files:
- SPEC-A-architecture.md (architecture & abstractions)
- SPEC-B-api.md (API contracts)

These specs are the source of truth.

Please:
1. Read both specs fully before responding
2. Follow the architecture, abstractions, and constraints exactly
3. Do NOT invent new endpoints or layers
4. Keep the implementation simple and readable
5. Use TypeScript (Node 20+)
6. Assume no database and no real Salesforce calls
7. Use in-memory stores and pure functions where possible

If anything is ambiguous, make a reasonable assumption and state it clearly in comments.

just load this in your memory and Wait for the further commands.
```

Notes: Set the context and constraints. Loaded both specs into memory.

---

Prompt:
```text
Based on SPEC-A and SPEC-B, generate only the project folder structure.

Requirements:
- Source code under src/
- Unit tests under tests/
- Use clear, intention-revealing file names

Return only a tree view.
```

Notes: Got proposed folder structure with clear separation of routes, services, clients, stores, and types.

---

Prompt:
```text
folder structure looks fine. go ahead and generate the folder structure only.
```

Notes: Created the actual folder structure on disk with empty files.

---

Prompt:
```text
Implement the HTTP routes according to SPEC-B.

Requirements:
- Minimal HTTP framework
- Map domain errors to HTTP responses
- Include basic request validation

Return the route handler code.
```

Notes: Generated cart.routes.ts with both endpoints (POST /cart-contexts, GET /carts/:contextId), validation, and error handling. Accepted.

---

_The mock client file was empty and needed implementation according to SPEC-A requirements._

Prompt:
```text
lets work on src/clients/salesforce-cart-client.mock.ts implementing UpstreamCartClient.

Behavior requirements:
- createContext({ market, channel }) returns a new contextId and expiresAt (TTL-based)
- getCart(contextId) returns a deterministic cart for that context
- expired contexts must throw a known domain error (use CartError with ErrorCode.CONTEXT_EXPIRED)
- unknown contextId must throw CartError with ErrorCode.CONTEXT_NOT_FOUND
- No timers, no background jobs: expiry is checked by comparing Date.now() to expiresAt
- Deterministic behavior: same contextId should always return the same cart contents

Keep it in-memory. Return only the file content.
```

Notes: Initial implementation created. It worked but stored unnecessary fields and had non-deterministic cart expiresAt.

---

_Noticed the mock had state bloat and wasn't fully deterministic._

Prompt:
```text
Refine salesforce-cart-client.mock.ts to align with SPEC-A boundaries.

Fix the following if present:
- Remove any timers (setTimeout/setInterval)
- Remove randomness or make output deterministic without relying on time-based quirks
- Keep the mock focused on upstream behavior only (do not implement CartService rules)
- Use CartError + ErrorCode for CONTEXT_NOT_FOUND and CONTEXT_EXPIRED
- Keep state minimal: contextId -> expiresAt plus whatever is needed for deterministic cart response

Return only the updated file content.
```

Notes: Fixed minimal state (removed market, channel, contextId) and made cart expiresAt deterministic. Accepted all changes.

---

_Project couldn't run without package.json, tsconfig, and .gitignore._

Prompt:
```text
Generate the minimal project setup files required to run this server.

Update:
- package.json
- tsconfig.json
- .gitignore

Constraints:
- Node 20+
- TypeScript
- Use ts-node or tsx for local development
- Include only essential dependencies (express, types, test runner)
- Provide scripts for: start, test

Do NOT:
- Add linting, formatting, or CI
- Add Docker, env files, or config frameworks
- Add unnecessary dependencies

Return each file separately with a clear filename header.
```

Notes: Got minimal setup with tsx and vitest. Clean dependencies. Accepted.

---

_Needed the Express application wired up._

Prompt:
```text
update app.ts and server.ts needed to run this API.

Requirements:
- Use Express
- app.ts should:
  - create and export the Express app
  - register JSON middleware
  - wire existing routes using createCartRoutes
  - construct CartService with SalesforceCartClientMock and ContextStore
- server.ts should:
  - import the app
  - start the server by calling listen()
  - log the port on startup

Constraints:
- Keep it minimal and readable
- Do not add new features, middleware, or abstractions
- Do not add auth, env config, or logging frameworks
- Assume existing folder structure and files

Return only:
- src/app.ts
- src/server.ts
```

Notes: Clean setup, proper dependency injection. Accepted both files.

---

_Wanted simple logging without a framework._

Prompt:
```text
lets Create a small logger utility

Requirements:
- Create src/utils/logger.ts
- Provide 3 functions: info(message), error(message)
- Implementation should wrap console.log/console.error
- Keep it minimal and readable

Do NOT:
- Add third-party logging libraries
Return only src/utils/logger.ts.
```

Notes: Simple wrapper with [INFO] and [ERROR] prefixes. Accepted.

---

_Logger utility existed but wasn't being used._

Prompt:
```text
Add log messages

Requirements:
- Log incoming HTTP requests with method and path
- Log server startup (port)
- Log all errors

Return only the updated code.
```

Notes: Added logging to app.ts, server.ts, and cart.routes.ts. Accepted.

---

_Error logs needed more context for debugging._

Prompt:
```text
Enhance logging for failure scenarios.

Requirements:
- When a request fails due to CONTEXT_NOT_FOUND or CONTEXT_EXPIRED:
  - Log the contextId (and cartId if available)
  - Log the error code
```

Notes: Enhanced error handler to log contextId and cartId. Accepted.

---

_Needed tests for confidence._

Prompt:
```text
Help me write unit tests.

I want tests for:
- CartService
- SalesforceCartClientMock
- The HTTP routes (just the main success and failure paths)
- ContextStore

The goal here is confidence, not maximum coverage.

Please:
- Put tests under the tests/ folder
- Use the real in-memory implementations (no heavy mocking)
- Test behavior, not internal implementation details
```

Notes: Got comprehensive tests using vitest and supertest. Good coverage.

---

_Logging wasn't documented in architecture spec._

Prompt:
```text
Update SPEC-A-architecture.md to explicitly include logging as a cross-cutting concern.

Requirements:
- Add logging at the architectural level (not implementation details)
- Clarify where logging belongs (HTTP layer vs service vs upstream mock)

Constraints:
- Do NOT add logging libraries or tooling choices
- Do NOT over-specify formats, levels, or configuration
- Use console.log and console.error
- Keep the language simple and consistent with the existing spec tone

Return only the updated SPEC-A content.
```

Notes: Added "Logging" section to spec. Clear about boundaries. Accepted.

---

_Project needed a README._

Prompt:
```text
Write a README.md for this project.

Tone:
- Simple, honest, and human
- Slightly imperfect language (like a real engineer wrote it)
- No marketing or buzzwords

Content to include:
- Short description of what the API does
- What the project is trying to demonstrate
- How to run the server locally
- Example API endpoints (brief, not full docs)
- How to run tests

Add a README.md for this project.

Tone:
- Simple, honest, and human
- Slightly imperfect language (like a real engineer wrote it)
- No marketing or buzzwords

Content to include:
- Short description of what the API does
- What the project is trying to demonstrate
- How to run the server locally
- Example API endpoints (brief, not full docs)
- How to run tests
```

Notes: First draft had some buzzword-adjacent language. Needed another pass.

---

_Still had too much marketing language._

Prompt:
```text
Write a README.md for this project.

Please do not use any buzzwords

Content to include:
- Short description of what the API does
- What the project is trying to demonstrate
- How to run the server locally
- Example API endpoints (brief, not full docs)
- How to run tests
- Brief decisions and trade-offs
- Known gaps / non-goals
```

Notes: Much cleaner. Added decisions/trade-offs and gaps sections. Accepted.

---
