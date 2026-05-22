# Reflection Report: AI-Assisted Development of a Real-Time Chat Application

**Course project — AI/vibe coding reflection**  
**Word count:** ~720

---

## How AI Helped in the Final Weeks

In the final weeks, AI acted less like a code generator and more like a senior pair programmer who could search the whole repository, run commands, and apply coordinated changes across Django and React. The initial scope was large: authentication with JWT cookies, PostgreSQL models, Django Channels for WebSockets, and a Discord-style React dashboard. AI accelerated scaffolding—project structure, `requirements.txt`, Docker Compose, Nginx templates, and a fifteen-section README—so I could focus on integration rather than boilerplate.

When bugs appeared, AI was most useful for **tracing end-to-end data flow**. For example, duplicate messages were not a single-line typo; they came from sending the same payload over both WebSocket and REST. AI identified that pattern by reading `ChatWindow.jsx` and the consumer together, then narrowed the fix to “REST creates + server broadcasts; WebSocket only for typing, presence, and receive.” Similarly, multi-browser failures were explained as a cross-origin cookie problem (frontend on port 5173, API/WebSocket on 8000), not as a mysterious “session bug.”

AI also helped with **operational tasks**: running `manage.py check`, generating migrations, fixing Django admin `search_fields` for user autocomplete, and aligning the Vite proxy with a single ASGI server on port 8000. That reduced time spent context-switching between documentation and trial-and-error.

---

## Most Challenging AI-Related Issue

The hardest issue sat at the intersection of **security and real-time architecture**: authenticating WebSockets while keeping JWTs in **httpOnly cookies** (a deliberate XSS mitigation). REST calls worked with `withCredentials` and CSRF tokens, but WebSocket handshakes often arrived **without** cookies when hosts or ports differed. Server logs showed `WebSocket REJECT`—the consumer correctly refused anonymous connections, but the frontend had no way to attach a token it could not read from JavaScript.

This was challenging because AI suggestions sometimes leaned toward insecure shortcuts (e.g., storing tokens in `localStorage` or disabling auth checks). The sustainable fix was a **`/api/auth/ws-ticket/`** endpoint: the client uses cookies on a normal HTTP request to obtain a short-lived token, then passes `?token=` on the WebSocket URL. That preserved httpOnly cookies for the API while satisfying Channels’ need for explicit handshake auth. Debugging required correlating Daphne logs, middleware, and browser Network tabs—not just accepting the first AI patch.

A secondary challenge was **duplicate side effects**: optimistic UI plus WebSocket echo plus REST response could make the UI show two messages for one send. Fixing that required clear ownership of “source of truth” (server broadcast after one REST create) and Redux `upsertMessage` logic to merge temporary IDs with real ones.

---

## Verifying Code Quality and Security

I did not treat AI output as finished work. Verification steps included:

- **Backend:** `python manage.py check`, migration generation, and manual review of auth middleware, permission classes, and rate limiting on login/message endpoints.
- **Security:** Confirmed passwords are hashed by Django; JWT in httpOnly cookies; CSRF on mutating requests; bleach sanitization on message text; WebSocket reject on invalid tokens (close code 4401).
- **Functional:** Two-browser testing (normal Chrome + incognito) for login, chat, and friend requests; watching server logs for `CONNECT` vs `REJECT` on `/ws/chat/`.
- **Logic:** Traced one message from form submit → single API POST → one DB row → one broadcast event → one UI update.

Where AI refactored multiple files at once, I checked that imports, URL routes, and frontend API paths still matched—small mismatches (e.g., WebSocket proxy aimed at wrong port) caused silent failures until logs were read carefully.

---

## What I Would Do Differently Starting Over

If I started again, I would **define the real-time contract on day one**: which events go over WebSocket vs REST, and that message creation happens in exactly one place. I would also **standardize local dev on same-origin early** (Vite proxy for `/api`, `/ws`, and `/media`) instead of mixing `localhost:8000` and `localhost:5173` URLs.

I would add **automated tests** sooner—at least API tests for auth and message create, and a minimal WebSocket integration test—so regressions like duplicate sends or rejected sockets surface in CI, not only in manual testing. Finally, I would document the WebSocket ticket flow in the README immediately; it is a common pattern when combining httpOnly JWT with Channels.

---

## One Key Lesson About Vibe Coding

**Vibe coding works when you stay skeptical and own the architecture; it fails when you accept fluent answers without verifying behavior.**

AI can produce a convincing full-stack app quickly, but production-grade behavior lives in edge cases: cookie boundaries, StrictMode double-mounting, duplicate listeners, and auth on non-HTTP channels. The useful mindset is to treat AI as a fast implementer and yourself as the reviewer who asks: *What is the single source of truth? What do the logs say? Does this hold across two browsers?* My main takeaway: use AI to go wide on scaffolding and narrow on debugging—but never skip the verification loop that turns “it looks right” into “it is secure and correct.”

---

*Submitted as a separate reflection document for the project repository.*
