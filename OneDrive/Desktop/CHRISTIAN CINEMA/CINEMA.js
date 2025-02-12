const API_KEY = '949258ff4ff329d48e662c7badcd4ac9';
const BASE_URL = 'https://api.themoviedb.org/3';

const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const moviesContainer = document.getElementById('movies');

// Fetch trending movies by default
async function fetchTrendingMovies() {
    const response = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`);
    const data = await response.json();
    displayMovies(data.results);
}

// Fetch trailer for each movie
async function fetchTrailer(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    return data.results.find(video => video.type === 'Trailer');
}

// Display movies in a grid
function displayMovies(movies) {
    moviesContainer.innerHTML = '';
    if (movies.length === 0) {
        moviesContainer.innerHTML = '<p>No movies found.</p>';
        return;
    }

    movies.forEach(async movie => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie');
        
        const trailer = await fetchTrailer(movie.id);
        
        let trailerEmbed = '';
        const trailerButton = `<button class="watch-button" onclick="toggleTrailer('${movie.id}')">Watch Me</button>`;
        
        if (trailer) {
            trailerEmbed = `
                <div class="trailer" id="trailer-${movie.id}" style="display:none;">
                    <iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen></iframe>
                </div>
            `;
        }

        movieElement.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p>Rating: ${movie.vote_average}</p>
            ${trailerButton}
            ${trailerEmbed}
        `;
        moviesContainer.appendChild(movieElement);
    });
}

// Fetch movies when the user searches
async function fetchMovies(query) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await response.json();
    displayMovies(data.results);
}

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        fetchMovies(query);
    }
});

// Fetch trending movies when the page loads
fetchTrendingMovies();

// Function to toggle the display of the trailer
function toggleTrailer(movieId) {
    const trailerDiv = document.getElementById(`trailer-${movieId}`);
    if (trailerDiv.style.display === "none" || trailerDiv.style.display === "") {
        trailerDiv.style.display = "block";
    } else {
        trailerDiv.style.display = "none";
    }
}
