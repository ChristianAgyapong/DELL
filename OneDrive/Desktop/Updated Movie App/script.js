const API_KEY = '949258ff4ff329d48e662c7badcd4ac9';
const BASE_URL = 'https://api.themoviedb.org/3';

const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const genreSelect = document.getElementById('genreSelect');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');
const moviesContainer = document.getElementById('movies');

let currentPage = 1;
let currentQuery = '';
let currentGenre = '';
let currentMode = 'trending';
let isFetching = false;

fetchTrendingMovies();
fetchGenres();

// ✅ Fetch Genres
async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  data.genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.textContent = genre.name;
    genreSelect.appendChild(option);
  });
}

// ✅ Trending
async function fetchTrendingMovies(append = false) {
  isFetching = true;
  const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&page=${currentPage}`);
  const data = await res.json();
  append ? appendMovies(data.results) : displayMovies(data.results);
  isFetching = false;
}

// ✅ Search
async function fetchMovies(query, append = false) {
  isFetching = true;
  const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`);
  const data = await res.json();
  append ? appendMovies(data.results) : displayMovies(data.results);
  isFetching = false;
}

// ✅ Genre Filter
async function fetchMoviesByGenre(genreId, append = false) {
  isFetching = true;
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${currentPage}`);
  const data = await res.json();
  append ? appendMovies(data.results) : displayMovies(data.results);
  isFetching = false;
}

// ✅ Trailer
async function fetchTrailer(movieId) {
  const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results.find(video => video.type === 'Trailer' && ['YouTube', 'Vimeo', 'Dailymotion'].includes(video.site));
}

// ✅ Get video embed link
function getVideoEmbedURL(video) {
  switch (video.site) {
    case 'YouTube':
      return `https://www.youtube.com/embed/${video.key}`;
    case 'Vimeo':
      return `https://player.vimeo.com/video/${video.key}`;
    case 'Dailymotion':
      return `https://www.dailymotion.com/embed/video/${video.key}`;
    default:
      return '';
  }
}

// ✅ Display movies
function displayMovies(movies) {
  moviesContainer.innerHTML = '';
  if (movies.length === 0) {
    moviesContainer.innerHTML = '<p>No movies found.</p>';
    return;
  }
  movies.forEach(async movie => {
    const card = await createMovieCard(movie);
    moviesContainer.appendChild(card);
  });
}

// ✅ Append for infinite scroll
function appendMovies(movies) {
  movies.forEach(async movie => {
    const card = await createMovieCard(movie);
    moviesContainer.appendChild(card);
  });
}

// ✅ Create movie card
async function createMovieCard(movie) {
  const movieElement = document.createElement('div');
  movieElement.classList.add('movie');

  const trailer = await fetchTrailer(movie.id);
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const isFav = isFavorite(movie.id);

  const trailerEmbed = trailer ? `
    <div class="trailer" id="trailer-${movie.id}" style="display:none;">
      <iframe src="${getVideoEmbedURL(trailer)}" allowfullscreen></iframe>
    </div>` : '';

  movieElement.innerHTML = `
    <img src="${poster}" alt="${movie.title}">
    <h3>${movie.title}</h3>
    <p>Year: ${year}</p>
    <p>Rating: ${movie.vote_average}</p>
    <div class="button-row">
      <button class="watch-button" onclick="toggleTrailer('${movie.id}')">🎬 Watch Trailer</button>
      <button class="watch-button" onclick="toggleFavorite(${movie.id}, this)">
        ${isFav ? '💔 Remove Favorite' : '❤️ Add to Favorites'}
      </button>
    </div>
    ${trailerEmbed}
  `;

  return movieElement;
}

// ✅ Toggle trailer
function toggleTrailer(movieId) {
  const trailerDiv = document.getElementById(`trailer-${movieId}`);
  trailerDiv.style.display = trailerDiv.style.display === 'block' ? 'none' : 'block';
}

// ✅ Favorite logic
function isFavorite(movieId) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  return favorites.includes(movieId);
}

function toggleFavorite(movieId, button) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.includes(movieId)) {
    favorites = favorites.filter(id => id !== movieId);
    button.textContent = '❤️ Add to Favorites';
  } else {
    favorites.push(movieId);
    button.textContent = '💔 Remove Favorite';
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ✅ Events
searchButton.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) {
    currentPage = 1;
    currentQuery = query;
    currentMode = 'search';
    fetchMovies(query);
  }
});

searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1;
      currentQuery = query;
      currentMode = 'search';
      fetchMovies(query);
    }
  }
});

genreSelect.addEventListener('change', () => {
  const selectedGenre = genreSelect.value;
  currentPage = 1;
  currentGenre = selectedGenre;
  currentMode = selectedGenre ? 'genre' : 'trending';
  selectedGenre ? fetchMoviesByGenre(selectedGenre) : fetchTrendingMovies();
});

showFavoritesBtn.addEventListener('click', async () => {
  const favoriteIds = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favoriteIds.length === 0) {
    moviesContainer.innerHTML = '<p style="text-align:center;">No favorites saved.</p>';
    return;
  }
  moviesContainer.innerHTML = '<p style="text-align:center;">Loading favorite...</p>';
  const favoriteMovies = await Promise.all(
    favoriteIds.map(id =>
      fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`).then(res => res.json())
    )
  );
  currentMode = 'favorites';
  displayMovies(favoriteMovies);
});

// ✅ Infinite scroll
window.addEventListener('scroll', () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    !isFetching &&
    currentMode !== 'favorites'
  ) {
    currentPage++;
    if (currentMode === 'trending') fetchTrendingMovies(true);
    else if (currentMode === 'search') fetchMovies(currentQuery, true);
    else if (currentMode === 'genre') fetchMoviesByGenre(currentGenre, true);
  }
});
