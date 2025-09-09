import { useEffect, useState } from "react";
import Search from "./Components/Search";
import Spinner from "./Components/Spinner";
import MovieCard from "./Components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./Appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
	method: "GET",
	headers: {
		accept: "application/json",
		Authorization: `Bearer ${API_KEY}`,
	},
};

function App() {
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [searchTerm, setSearchTerm] = useState("");

	const [movieList, setMovieList] = useState([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [trendingMovies, setTrendingMovies] = useState([]);

	//Debounce the search term to prevent making too many API requests by waiting for the user to stop typing for 500ms
	// it works almost the same way the use effect does, below code: it runs the code in the block everytime the search term changes and remains constant for the set time
	// but particularly it wait for the search term to have a stable value for the set time before executing it, hence it save or sets the value of t
	// the debounced search term which the use state then monitors to execute the fetch movies command.
	useDebounce(
		() => {
			setDebouncedSearchTerm(searchTerm);
			console.log(debouncedSearchTerm);
		},
		500,
		[searchTerm]
	);

	const fetchMovies = async (query = "") => {
		try {
			setIsLoading(true);
			setErrorMessage("");
			const endpoint = query
				? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
				: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
			const response = await fetch(endpoint, API_OPTIONS);

			if (!response.ok) {
				throw new Error("Failed to fetch movies");
			}
			const data = await response.json();
			// console.log(data);
			if (data.Response === "false") {
				setErrorMessage(data.Error || "Failed to fetch movies");
				setMovieList([]);
				return;
			}
			setMovieList(data.results || []);
			if (query && data.results.length > 0) {
				await updateSearchCount(query, data.results[0]);
			}
		} catch (error) {
			console.error(`Error fetching the movie: ${error}`);
			setErrorMessage(`Error fetching movies. Please try again later.`);
		} finally {
			setIsLoading(false);
		}
	};

	const loadTrendingMovies = async () => {
		try {
			const movies = await getTrendingMovies();
			setTrendingMovies(movies);
		} catch (error) {
			console.error(`Error fetching trending movies`);
		}
	};

	useEffect(() => {
		fetchMovies(debouncedSearchTerm);

		console.log(debouncedSearchTerm);
	}, [debouncedSearchTerm]);

	useEffect(() => {
		loadTrendingMovies();
		console.log("loaded");
	}, []);

	return (
		<main>
			<div className="pattern" />
			<div className="wrapper">
				<header>
					<h1>
						<img src="./hero.png" alt="Hero Banner" />
						Find <span className="text-gradient">Movies</span> You'll Enjoy
						Without The Hassle
					</h1>
					<Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
				</header>
				{trendingMovies.length > 0 && (
					<section className="trending">
						<h2>Trending Movies</h2>
						<ul>
							{trendingMovies.map((movie, index) => (
								<li key={movie.$id}>
									<p>{index + 1}</p>

									<img src={movie.poster_url} alt={movie.title} />
								</li>
							))}
						</ul>
					</section>
				)}
				<section className="all-movies">
					<h2>All Movies</h2>

					{isLoading ? (
						<Spinner />
					) : errorMessage ? (
						<p className="text-red-500">{errorMessage}</p>
					) : (
						<ul>
							{movieList.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</ul>
					)}
				</section>

				{/* <h1 className="text-white">{searchTerm}</h1> */}
			</div>
		</main>
	);
}

export default App;
