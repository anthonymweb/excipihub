# ExcipiHub — full stack (Django REST API + React)

    excipihub_fullstack/
      backend/    Django + Django REST Framework — the database and API
      frontend/   React + Vite — the browser UI, talks to the API over HTTP

The two run as separate processes on separate ports. Nothing about this
setup is unusual — it's the same pattern Glovo, most delivery apps, and
most modern web apps use: a backend that only speaks JSON, and a
frontend that's "just" a client of that API, like any other client
could be (a mobile app, a script, Postman).

## 1. Start the backend (Terminal 1 in VS Code)

    cd backend
    python3 -m venv venv
    source venv/bin/activate          # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py createsuperuser  # optional, for /admin/
    python manage.py runserver

Leave this running. It serves the API at http://127.0.0.1:8000/api/
and the Django admin at http://127.0.0.1:8000/admin/.

## 2. Start the frontend (Terminal 2 in VS Code — open a second terminal,
##    don't stop the first one)

    cd frontend
    npm install
    npm run dev

Leave this running too. It serves the React app at http://localhost:5173.

## 3. Use it

Open http://localhost:5173 in your browser.

- **Register** as a scientist (buyer) — you'll land on the catalog, empty at first.
- Open a second browser tab (or an incognito window) and **register again**
  as a manufacturer, so you have a seller account signed in separately.
- As the manufacturer: fill in the "List a new excipient" form at the
  top of the catalog page. Submit it.
- Switch back to the scientist tab and refresh — the listing now
  appears. Click "Add to cart".
- Go to **Cart**, add a delivery address, and place the order.
- Go to **Orders** — the order you just placed is there, with its
  total computed by the backend, not the browser.

## How to navigate the code

**Backend** (`backend/`) — one Django app per concern, same split
explained earlier in this conversation:
- `accounts/` — the User model, plus `views.py` for register/login/me
- `catalog/` — Excipient model, plus the DRF ViewSet that powers
  browsing and listing products
- `logistics/` — Address (Rider/Delivery exist as models but aren't
  wired to the API yet — they're operational, not buyer-facing)
- `orders/` — Order/OrderItem, plus `serializers.py`, which is the
  most important file to read: `OrderCreateSerializer.create()` is
  where placing an order becomes a row in three tables in one
  transaction, with the price locked in server-side.
- Every app's `urls.py` gets included under `/api/...` from
  `excipihub_project/urls.py`.

**Frontend** (`frontend/src/`):
- `api/client.js` — the ONLY file that knows the backend's URL and
  shape. Every network call in the app goes through here.
- `context/AuthContext.jsx` — who's logged in, holds the auth token
- `context/CartContext.jsx` — the shopping cart, purely client-side
  until "Place order" turns it into a real API call
- `pages/` — one file per screen (Login, Register, Catalog, Cart, Orders)
- `App.jsx` — routes + the nav bar

## Troubleshooting

- **Frontend loads but nothing shows up / network errors in the
  browser console**: the backend isn't running, or you're using a
  port other than 8000. Check Terminal 1.
- **CORS error in the browser console**: the frontend must run on
  port 5173 (Vite's default — `npm run dev` uses it automatically).
  If you changed the port, update `CORS_ALLOWED_ORIGINS` in
  `backend/excipihub_project/settings.py`.
- **"relation does not exist" or similar DB errors**: you skipped
  `python manage.py migrate` in the backend setup.
