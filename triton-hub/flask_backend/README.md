# Flask Backend

This is a Python Flask backend for the application.

## Setup

1.  Navigate to this directory:
    ```bash
    cd flask_backend
    ```

2.  (Optional) Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running

Run the application:
```bash
python app.py
```

The server will start at `http://localhost:5328`.

## API Routes

-   `GET /api/hello`: Returns a hello message.

## Next.js Integration

The Next.js application is configured to proxy requests from `/api/flask/*` to this backend.
For example, a request to `/api/flask/hello` on the frontend will be forwarded to `/api/hello` on this backend.
