# Notes App

Stillnote is a React and Express note-taking app backed by MongoDB. Each account has its own notes.

## Backend setup

1. Install Node.js (Node 20.19+ or 22.12+ is recommended) and start MongoDB locally, or use a MongoDB Atlas connection string.
2. In `backend`, run `npm install`.
3. Create `backend/.env` with your own values:

   ```env
   PORT=8000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/notesapp
   CORS_ORIGIN=http://localhost:5173
   ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
   REFRESH_TOKEN_EXPIRY=10d
   ```

   Include the database name in `MONGODB_URI`. Set `CORS_ORIGIN` to the exact frontend origin. Keep secrets private.
4. Run `npm run dev` for development or `npm start` to start the server.

## Frontend setup

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The development server proxies `/api` requests to `http://localhost:8000`, so keep the backend running on port 8000 or update the proxy in `frontend/vite.config.js`. Register an account, sign in, and use **New note** to create a note. Select a note to edit or delete it. Run `npm run build` to create a production frontend build; a production host must route `/api` to the backend.

If MongoDB is local, make sure its server is running. For Atlas, check the connection string, database user, and network access settings. Both token secrets and expiry values are required for login, even if `MONGODB_URI` is already configured.

## API

The base URL is `http://localhost:8000/api/v1`. Send JSON requests with `Content-Type: application/json`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/users/register` | Register with `email` and `password` |
| POST | `/users/login` | Log in with `email` and `password` |
| POST | `/users/logout` | Log out (authenticated) |
| POST | `/users/refresh-token` | Refresh tokens using the cookie or a `refreshToken` in the body |
| GET | `/users/current-user` | Get the authenticated user |
| POST | `/notes` | Create a note with non-empty `title` and `content` |
| GET | `/notes` | List the authenticated user's notes |
| GET | `/notes/:noteId` | Get one of the user's notes |
| PATCH | `/notes/:noteId` | Update `title`, `content`, or both |
| DELETE | `/notes/:noteId` | Delete one of the user's notes |

Login sets HTTP-only cookies and also returns the tokens in the response. Authenticated requests can use the access-token cookie or an `Authorization: Bearer <accessToken>` header. Browser clients using cookies must enable credentials. A note belonging to another user returns 404 on individual note routes.
