require('dotenv').config();

const express = require('express');
const path = require('path');
const moviedb = require('./config/tmdb');
const supabase = require('./config/supabase');

const app = express();

app.use(express.static(path.join(__dirname, '../static')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, '../templates'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    const username = req.query.user || null;
    res.render('home', { username });
});

app.get('/auth', (req, res) => {
    res.render('auth', { errorMessage: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('auth', { errorMessage: 'All fields are required!' });
    }

    const { data: users, error } = await supabase
        .from('userData')
        .select('username, password')
        .eq('username', username);

    if (error || users.length === 0 || users[0].password !== password) {
        return res.render('auth', { errorMessage: 'Invalid username or password' });
    }

    // Redirect back to home with ?user=
    res.redirect(`/?user=${encodeURIComponent(username)}`);
});

app.post('/create-account', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('auth', { errorMessage: 'All fields are required!' });
    }

    try {
        const { data: existing, error: lookupErr } = await supabase
            .from('userData')
            .select('username')
            .eq('username', username);

        if (lookupErr) throw lookupErr;
        if (existing.length > 0) {
            return res.render('auth', { errorMessage: 'Username already exists!' });
        }

        const { error: insertErr } = await supabase
            .from('userData')
            .insert([{ username, password, watchlist: [] }]);

        if (insertErr) throw insertErr;

        // Redirect back to home with ?user=
        res.redirect(`/?user=${encodeURIComponent(username)}`);
    } catch (err) {
        console.error(err);
        res.render('auth', { errorMessage: 'An error occurred. Please try again.' });
    }
});

app.post('/add-to-watchlist', async (req, res) => {
    const { user, movieId } = req.body;
    if (!user || !movieId) {
        return res.status(400).send('Missing user or movieId');
    }

    try {
        // 1) Get full movie details
        const details = await moviedb.movieInfo({
            id: movieId,
            language: 'en-US'
        });

        // 2) Fetch current watchlist
        const { data: [record], error: lookupErr } = await supabase
            .from('userData')
            .select('watchlist')
            .eq('username', user);

        if (lookupErr) throw lookupErr;

        // 3) Append if not already present (by id)
        const current = record.watchlist || [];
        if (!current.find(m => m.id === details.id)) {
            current.push(details);
        }

        // 4) Persist back
        const { error: updateErr } = await supabase
            .from('userData')
            .update({ watchlist: current })
            .eq('username', user);

        if (updateErr) throw updateErr;

        // 5) Redirect back to the movie page, preserving login
        res.redirect(`/movie/${movieId}?user=${encodeURIComponent(user)}`);

    } catch (err) {
        console.error('Add to watchlist failed:', err);
        res.status(500).send('Could not update watchlist');
    }
});

app.get('/profile', async (req, res) => {
    const username = req.query.user;
    if (!username) {
        return res.redirect('/auth');
    }

    try {
        // Fetch the watchlist array (of full movie objects) from Supabase
        const { data: [record], error } = await supabase
            .from('userData')
            .select('watchlist')
            .eq('username', username);

        if (error) throw error;

        // If no watchlist yet, default to empty array
        const watchlist = record.watchlist || [];

        // Render directly—no further API calls
        res.render('profile', {
            username,
            watchlist
        });

    } catch (err) {
        console.error('Error loading profile:', err);
        res.render('profile', {
            username: req.query.user,
            watchlist: [],
            errorMessage: 'Error loading profile'
        });
    }
});


app.get('/movie/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const [details, videoRes, imageRes] = await Promise.all([
            moviedb.movieInfo({ id: movieId, language: 'en-US' }),
            moviedb.movieVideos({ id: movieId, language: 'en-US' }),
            moviedb.movieImages({ id: movieId })
        ]);

        // get the first “Trailer” key
        const trailerKey = videoRes.results
            .find(v => v.type === 'Trailer')
            ?.key
            || null;

        // get the first backdrop file path
        const backdropPath = imageRes.backdrops?.[0]?.file_path || null;

        // carry username through
        const username = req.query.user || null;

        res.render('movie', {
            movie: details,
            trailerKey,
            backdropPath,
            username
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/recommendations/:id', async (req, res) => {
    try {
        const movieId = req.params.id;

        const [details, recs] = await Promise.all([
            moviedb.movieInfo({ id: movieId, language: 'en-US' }),
            moviedb.movieRecommendations({ id: movieId, language: 'en-US', page: 1 })
        ]);

        res.render('recommendation', {
            movieName: details.title,
            recommendations: recs.results.slice(0, 12)
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/profile', async (req, res) => {
    try {
        // TODO: fetch real watchlist from Supabase
        const watchlist = [];
        res.render('profile', { watchlist });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/auth', (req, res) => {
    res.render('auth');
});


app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await moviedb.searchMovie({
            query,
            language: 'en-US',
            page: 1
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/movie/:id', async (req, res) => {
    try {
        const details = await moviedb.movieInfo({
            id: req.params.id,
            language: 'en-US'
        });
        res.json(details);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/movie/:id/images', async (req, res) => {
    try {
        const images = await moviedb.movieImages({ id: req.params.id });
        res.json(images);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/movie/:id/videos', async (req, res) => {
    try {
        const videos = await moviedb.movieVideos({
            id: req.params.id,
            language: 'en-US'
        });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/movie/:id/recommendations', async (req, res) => {
    try {
        const recs = await moviedb.movieRecommendations({
            id: req.params.id,
            language: 'en-US',
            page: 1
        });

        res.json(recs.results.slice(0, 12));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
