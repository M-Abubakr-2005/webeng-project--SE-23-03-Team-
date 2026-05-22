# Project Prompts

This document archives the original build specification (Prompt #1) and the production debugging / hardening specification (Prompt #2) used for this real-time chat application.

---

## Prompt #1 — Build Specification

Build a production-grade, full-stack real-time chat application.  
The application must look and behave like a modern commercial platform (Discord / WhatsApp Web / Telegram / Messenger).

### Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js (Vite), Tailwind CSS, React Router, Axios, Context API or Redux Toolkit, Framer Motion, native WebSocket client |
| **Backend** | Python 3.12+, Django 5+, Django REST Framework, Django Channels, Daphne (ASGI) |
| **Database** | PostgreSQL |
| **Cache / WS** | Redis |
| **Auth** | JWT (access + refresh tokens) |

**Architecture:** Fully separated frontend and backend. REST APIs for standard CRUD. WebSockets for all real-time events.

---

### Authentication

- Register with email (unique validation)
- Login / Logout
- JWT access + refresh token flow
- Password hashing (bcrypt via Django)
- Password strength validation (frontend + backend)
- Password reset via email
- Protected routes (React Router guards)
- Session management and token refresh middleware
- CSRF protection on all state-changing endpoints

**User profile fields:** username, email, avatar, bio, online status, last seen, friend count

---

### Real-time messaging

**Direct messages (1-on-1):**

- Instant delivery via WebSocket
- Persistent message history
- Unread message counter per conversation
- Auto-scroll to latest message
- Infinite scroll (load older messages)

**Group chats:**

- Create / edit / delete groups
- Add and remove members
- Admin roles and controls
- Group avatar and description

**Message features:**

- Typing indicators (WebSocket broadcast)
- Read receipts with Sent / Delivered / Seen states
- Timestamps (relative + absolute)
- Reply-to-message (threaded context)
- Edit and delete messages
- Emoji support
- Real-time notifications (toast + badge)
- Optimistic UI updates

**Optional (implement if time allows):**

- File and image sharing
- Voice notes
- Message reactions
- Stories

---

### Friend system

- Send, accept, reject, and cancel friend requests
- Remove existing friends
- Block / unblock users
- Friend search with live filtering
- Suggested friends panel (based on mutual connections or online status)
- Online friends list with live presence indicator

---

### Dashboard layout

**Left sidebar:**

- Conversation list (sorted by latest activity)
- User avatar + profile preview
- Global search bar (users, groups, messages)

**Main panel:**

- Stories row
- Active chat window
- Typing indicators
- Real-time message stream

**Right sidebar:**

- Pending friend requests
- Suggested friends
- Online users
- Active groups

All panels must update in real time without page reload.

---

### UI / UX requirements

- Dark / Light theme toggle (persisted in localStorage)
- Fully responsive — desktop, tablet, and mobile
- Glassmorphism cards and frosted overlays
- Smooth page and component transitions (Framer Motion)
- Chat bubbles with tail (sent right, received left)
- Skeleton loaders for all async data
- Toast notifications (success, error, info)
- Hover animations and micro-interactions
- Profile modals on avatar click
- Accessible (ARIA labels, keyboard navigation, focus rings)
- Typography system — clear hierarchy, readable at all sizes

---

### Frontend architecture

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level page components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Axios API service layer
│   ├── context/          # Global state (Auth, Theme, Socket)
│   ├── layouts/          # Sidebar + main layout wrappers
│   └── utils/            # Helpers, constants, validators
├── package.json
└── vite.config.js
```

**Pages:**

| Route | Purpose |
|-------|---------|
| `/login` | Login form |
| `/register` | Registration form |
| `/dashboard` | Main chat interface |
| `/chat/:id` | Active conversation view |
| `/profile/:id` | User profile |
| `/settings` | Account settings |
| `/friends` | Friend management |
| `/notifications` | Notification centre |

**Patterns:**

- All API calls abstracted in `services/api.js`
- WebSocket manager in `context/SocketContext.jsx`
- Auth guard HOC wrapping protected routes
- Global error boundary
- Lazy loading and code splitting per route
- Intersection Observer for infinite scroll

---

### Backend architecture

```
backend/
├── accounts/       # User model, auth, profiles
├── messaging/      # Conversations, messages, WebSocket consumers
├── friends/        # Friend requests, friendships, blocking
├── groups/         # Group chats
├── notifications/  # In-app notification system
├── config/         # Settings, ASGI, routing, env
├── manage.py
├── requirements.txt
└── .env.example
```

**Responsibilities:**

- Custom AbstractUser model (accounts app)
- DRF serializers and ViewSets for all resources
- Django Channels consumers for: chat messages, typing indicators, read receipts, online presence, notifications
- JWT middleware for WebSocket handshake auth
- Signals for post-save notifications
- Service layer (no business logic in views)
- Rate limiting on auth and message endpoints
- Centralised permission classes
- Structured logging (JSON)
- Pagination on all list endpoints
- Full-text search on messages and users

---

### Database models

| Model | Key fields |
|-------|------------|
| **User** (AbstractUser) | username, email, password, avatar, bio, is_online, last_seen, created_at |
| **FriendRequest** | sender → User, receiver → User, status (pending/accepted/rejected), created_at |
| **Friendship** | user1 → User, user2 → User, created_at |
| **Block** | blocker → User, blocked → User, created_at |
| **Conversation** | participants M2M User, is_group, created_at, updated_at |
| **Message** | conversation, sender, content, status (sent/delivered/seen), reply_to, is_edited, created_at, updated_at |
| **Group** | name, avatar, description, created_by, members M2M User |
| **Notification** | recipient, type, payload (JSON), is_read, created_at |
| **Story** | user, media, created_at, expires_at |

All models: indexes on foreign keys and frequently filtered fields. Use `select_related` / `prefetch_related` to avoid N+1 queries.

---

### Security

- CSRF token on all non-safe HTTP methods
- JWT tokens stored in httpOnly cookies (not localStorage)
- XSS prevention — escape all user-generated content
- SQL injection prevention — ORM only, no raw SQL
- Rate limiting — 5 login attempts / minute, 60 messages / minute
- Input sanitisation on all text fields
- WebSocket auth — validate JWT on connect, disconnect on invalid
- Django permissions + object-level permissions via DRF
- Environment variables for all secrets (`.env`, never committed)
- Secure headers (HSTS, X-Frame-Options, CSP) via django-csp

---

### Local development setup

**Prerequisites:** Python 3.12+, Node 18+, PostgreSQL, Redis

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
daphne config.asgi:application # WebSocket (separate terminal if needed)
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

**Services:**

```bash
redis-server
# PostgreSQL running with credentials matching .env
```

---

### Requirements files

**Backend (`requirements.txt`):** Django, djangorestframework, channels, channels-redis, daphne, psycopg2-binary, redis, python-dotenv, Pillow, djangorestframework-simplejwt, django-cors-headers, django-environ, gunicorn, whitenoise, django-csp, django-ratelimit, django-filter (pinned versions)

**Frontend (`package.json`):** react, react-dom, react-router-dom, axios, @reduxjs/toolkit, tailwindcss, framer-motion, vite, @vitejs/plugin-react, native WebSocket (or socket.io-client)

**`.env.example`:**

- **Backend:** SECRET_KEY, DEBUG, ALLOWED_HOSTS, DB_*, REDIS_URL, EMAIL_*, CORS_ALLOWED_ORIGINS, JWT_SECRET_KEY
- **Frontend:** VITE_API_URL, VITE_WS_URL

---

### Documentation (README.md)

README must include these sections in order:

1. Project overview
2. Live demo link (placeholder)
3. Feature list (Authentication, Messaging, Friends, UI)
4. Tech stack table
5. Architecture overview (REST + WebSocket ASCII diagram)
6. Database schema (ER summary)
7. Authentication flow
8. WebSocket event reference
9. Folder structure (annotated tree)
10. Local development guide
11. Environment variable reference
12. API endpoint reference
13. Deployment guide (Render, Railway, VPS, Docker Compose)
14. Contributing guide
15. Licence

---

### Deployment (production)

**Docker Compose services:** web (Gunicorn), asgi (Daphne), worker (Celery optional), db (PostgreSQL), redis, nginx

**Nginx:**

- Proxy `/api/` and `/admin/` to Gunicorn
- Proxy `/ws/` to Daphne
- Serve `/static/` and `/media/`
- HTTPS via Let's Encrypt

**Frontend:** `npm run build` → serve `dist/` via Nginx or Vercel / Netlify

---

### Final deliverables (Prompt #1)

- [ ] Complete Django backend source code
- [ ] Complete React frontend source code
- [ ] All models, serializers, views, and URL configs
- [ ] WebSocket consumers and channel routing
- [ ] React pages, components, hooks, and context
- [ ] `requirements.txt` (pinned)
- [ ] `package.json`
- [ ] `.env.example` (backend + frontend)
- [ ] `README.md` (15 sections)
- [ ] Docker Compose file
- [ ] Nginx config template

**Code standards:** PEP 8; ESLint + Prettier; docstrings on Django views/consumers; JSDoc on complex React components; no TODOs in delivered code; no hardcoded secrets.

---

## Prompt #2 — Debug & Production Hardening

Analyze and fix **ALL** bugs and architectural issues in this real-time chat application built with:

- **Frontend:** React.js
- **Backend:** Django + Django REST Framework
- **Real-time:** WebSockets (native; not Socket.IO unless specified)
- **Authentication system**
- **Admin panel**
- **Messaging system**
- **Friend request system**

**Goal:** Deeply inspect the entire project and make it production-ready.

---

### Multi-browser / multi-session issue

**Problem:** Application works in the first Chrome browser; second Chrome or incognito does not load properly. Authentication / session / socket connection breaks.

**Fix:**

- Check CORS configuration
- Check CSRF settings
- Fix token storage issues
- Ensure JWT authentication works across multiple sessions
- Ensure WebSocket authentication works correctly
- Fix cookies / session conflicts
- Ensure app supports multiple users at the same time

---

### Django admin user search issue

**Problem:** When creating chats / friends / messages through Django admin, newly created users do not appear in suggestions / search fields.

**Fix:**

- Correct queryset logic
- Fix admin `autocomplete_fields`
- Add proper `search_fields` in `admin.py`
- Ensure User model registration is correct
- Ensure related fields properly load users

---

### Friend request issue

**Problem:** Requests sent through the admin panel are not showing in the frontend.

**Fix:**

- Inspect API serialization
- Check database relations
- Fix frontend state updates
- Ensure requests endpoint returns correct data
- Ensure WebSocket events update UI instantly

---

### Duplicate message issue

**Problem:** Messages are sent twice (e.g. sending “Hi” creates 2 messages).

**Fix:**

- Inspect frontend duplicate socket listeners
- Remove repeated event subscriptions
- Fix React `useEffect` dependencies
- Ensure cleanup functions remove listeners
- Prevent duplicate API + socket submission
- Ensure backend saves only once

---

### Real-time chat stability

Fix all issues related to:

- Messages not updating instantly
- Delayed socket events
- Reconnection issues
- Duplicate connections
- Typing indicators not stopping
- Read receipts inconsistency

---

### Authentication & security

Fix:

- Unauthorized API calls
- Token refresh issues
- Login persistence
- Logout cleanup
- Protected routes
- Expired token handling
- Password validation
- Secure API permissions

---

### Database & backend fixes

Inspect and fix:

- Broken relationships
- Incorrect foreign keys
- Serializer issues
- N+1 queries
- Missing migrations
- Improper model validation
- Incorrect API responses

**Optimize:**

- Query performance (`select_related` / `prefetch_related`)
- API response consistency

---

### Frontend React fixes

Fix:

- Infinite re-renders
- Broken state management
- Duplicate requests
- Unhandled promises
- Missing loading states
- Bad error handling
- Component lifecycle bugs
- Race conditions
- Socket cleanup issues

**Improve:**

- Folder structure
- Reusable hooks
- API service layer
- Error boundaries
- Global auth context

---

### UI/UX bug fixing

Fix:

- Broken buttons
- Non-working forms
- Scroll issues
- Mobile responsiveness
- Chat auto-scroll problems
- Avatar loading errors
- Empty states
- Flickering UI
- Loading indicators

---

### Admin panel improvements

Improve Django admin:

- Better filtering
- User search
- Friend request management
- Chat management
- Message moderation
- Read-only timestamps
- Better `list_display`
- Better ordering

---

### Code quality improvements

Refactor for:

- Clean architecture
- Reusable services
- Better naming conventions
- Environment variable handling
- Error logging
- Maintainability
- Scalability

---

### Final tasks (Prompt #2)

After fixing everything:

- Remove dead code
- Remove console errors and warnings
- Add proper comments where needed
- Ensure project runs without crashes
- Ensure multiple users can chat simultaneously
- Ensure sockets work reliably
- Ensure frontend and backend are fully synchronized

---

### Important debugging requirements

- **Do NOT** make superficial fixes
- Find **root causes** of every issue
- Check both frontend and backend
- Trace complete data flow
- Explain every major fix made
- Refactor bad implementations
- Maintain clean scalable architecture
- Ensure no duplicate listeners or duplicate API calls
- Ensure all socket connections are properly cleaned up
- Ensure React StrictMode compatibility
- Ensure app works in multiple browsers simultaneously

---

### Deliverables (Prompt #2)

Provide:

- Fixed code
- Explanation of every major bug
- Root cause analysis
- Improved architecture
- Performance improvements
- Security improvements
- Final testing checklist

The final project must behave like a **production-grade** real-time chat application similar to Discord or WhatsApp Web.

---

## Related project documents

| File | Description |
|------|-------------|
| `README.md` | Full setup, API, and deployment documentation |
| `REFLECTION_REPORT.md` | 500–800 word AI / vibe-coding reflection |
| `docker-compose.yml` | Multi-service production layout |
| `nginx/nginx.conf` | Reverse proxy template |
