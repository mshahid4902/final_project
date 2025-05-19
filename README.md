# MovieApp

**domain (please do not hack my website this is for a school project): final-project-one-omega-62.vercel.app**

A full-stack movie discovery web application built with HTML, CSS, JavaScript, Node.js, Vercel, and Supabase. It integrates the TMDB (The Movie Database) API via the `moviedb-promise` library to allow users to:

* **Search** for movies by name
* View **movie details**, including poster, trailer, backdrop, title, and overview
* **Recommend similar** movies and browse results
* **Register** and **log in** using Supabase for user authentication
* **Add movies** to a personal watchlist stored in Supabase
* **View** and manage your watchlist

> **Note:** Users are logged out when returning to the home page and must log in again to view their watchlist.

## Target Browsers

* **Desktop:**

  * Chrome (latest)
  * Firefox (latest)
  * Safari (latest)
  * Edge (latest)
* **Mobile:**

  * Safari on iOS 13+
  * Chrome on Android 10+

---

# Developer Manual

This Developer Manual guides future developers through setting up, running, and extending the MovieApp system.

## 1. Installation & Dependencies

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-org/movieapp.git
   cd movieapp
   ```
2. **Install Node.js (v16+)** if not already installed.
3. **Install dependencies**:

   ```bash
   npm install
   ```
4. **Install Supabase client**:

   ```bash
   npm install @supabase/supabase-js
   ```
5. **Install Express session** (optional, for future session management):

   ```bash
   npm install express-session
   ```

## 2. Environment Configuration

Create a `.env` file at the project root with the following variables:

```
TMDB_API_KEY=your_tmdb_v3_api_key
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

Ensure `.env` is in `.gitignore` to keep secrets secure.

## 3. Running the Application

### Development

```bash
npm start          # starts src/server.js on PORT
```
or
```bash
node src/server.js          # starts src/server.js on PORT
```

Open your browser at `http://localhost:3000`.

### Production (Vercel)

1. Push to your Vercel-connected Git repository.
2. Configure the same environment variables in the Vercel dashboard.
3. Vercel will build and deploy automatically.

## 4. Testing

*No automated tests are implemented yet. Recommended next steps:*

* Write unit tests for service modules (`tmdbService`, `supabaseService`).
* Write integration tests for API routes using Jest or Mocha.

## 5. API Endpoints

All routes are defined in `src/app.js`.

### Page Routes (EJS Templates)

| Method | Path                   | Description                                   |
| ------ | ---------------------- | --------------------------------------------- |
| GET    | `/`                    | Home page with search bar                     |
| GET    | `/movie/:id`           | Movie detail page (poster, trailer, overview) |
| GET    | `/recommendations/:id` | Recommendations page ("Movies like {movie}")  |
| GET    | `/auth`                | Login / Register page                         |
| GET    | `/profile?user={name}` | User watchlist page                           |

### JSON API Routes

| Method | Path                             | Description                                                    |
| ------ | -------------------------------- | -------------------------------------------------------------- |
| GET    | `/api/search?query={movieName}`  | Search TMDB for movies by name                                 |
| GET    | `/api/movie/:id`                 | Fetch movie details by ID                                      |
| GET    | `/api/movie/:id/videos`          | Fetch videos (trailers) for a movie                            |
| GET    | `/api/movie/:id/images`          | Fetch images (backdrops, posters) for a movie                  |
| GET    | `/api/movie/:id/recommendations` | Fetch recommendations for a movie (first 12 results)           |
| POST   | `/add-to-watchlist`              | Adds a full movie object to the user’s watchlist in Supabase   |
| POST   | `/login`                         | Authenticate user and redirect to home with `?user=` param     |
| POST   | `/create-account`                | Create new user in Supabase and redirect to home with `?user=` |

## 6. Known Bugs & Roadmap

### Known Bugs

* **Session Persistence:** No persistent sessions; users must re-login after returning home.
* **No Automated Tests:** Manual testing only and error-prone.
* **Generic Error Messages:** Some API and database errors are not user-friendly.

### Future Roadmap

1. **Implement Persistent Sessions:** Use `express-session` or JWTs for login persistence.
2. **Add Automated Tests:** Cover core functionality with unit and integration tests.
3. **Improve Mobile Responsiveness:** Optimize layouts and performance on small screens.
4. **Watchlist Management:** Enable removing movies and reordering.
5. **Enhanced User Profiles:** Support password changes, profile images, and activity logs.

---

*Documentation maintained by Mohammad Shahid.*
