interface SpotifyTrack {
	coverURL: string;
	title: string;
	album: string;
	artist: string;
	id: string;
	day: number;
}

// Utility function to apply timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Cache retrieval timed out')), timeoutMs)),
	]);
}

const fetchCachedData = async (env: Env, cacheKey: string, timeoutMs: number) => {
	try {
		const cachedData = await withTimeout(env.SPOTIFY_API_HANDLER_CACHE.get(cacheKey, { type: 'json' }), timeoutMs);
		return cachedData;
	} catch (error) {
		console.error('Error retrieving cache:', error);
		return null; // Or handle differently as needed
	}
};

// Importing necessary environment variables
const fetchSpotifyToken = async (clientId : string, clientSecret : string): Promise<string> => {
	const authString = `${clientId}:${clientSecret}`;
	const base64AuthString = btoa(authString);

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${base64AuthString}`,
		},
		body: 'grant_type=client_credentials',
	});

	const data = await response.json();
	return data.access_token; // Return the access token
};

const getToday = (): { day: number } => {
	const today = new Date();
	const day = today.getUTCDay() + today.getUTCDate() + today.getUTCMonth() + today.getUTCFullYear() * 365;

	return { day };
};

const getRandomSearchQuery = (): { searchQuery: string } => {
	const searchQueries = [
		'spellcasting artist',
		'kasane teto vocaloid',
		'kendrick lamar',
		'B1A4 kpop band',
		'le sserafim kpop band',
		'tyler, the creator song rap artist',
		'tyler, the creator song rap artist chromakopia',
		'tyler, the creator song rap artist call me if you get lost',
		'tyler, the creator song rap artist igor',
		'tyler, the creator song rap artist flower boy',
		'tyler, the creator song rap artist cherry bomb',
		'tyler, the creator song rap artist wolf',
		'tyler, the creator song rap artist goblin',
		'newjeans kpop band',
		'hatsune miku vocaloid',
		'glass beach rock band',
		'loossemble kpop band',
	];

	const searchQuery = searchQueries[getToday().day % searchQueries.length];
	return { searchQuery };
};

const fetchRandomTrack = async (
	token: string,
	env: Env
): Promise<{
	coverURL: string;
	title: string;
	album: string;
	artist: string;
	id: string;
	day: number;
}> => {
	const day = getToday().day;
	const cacheKey = `spotify-track-${day}`;
	const latestKey = await withTimeout(env.SPOTIFY_API_HANDLER_CACHE.get("latest-key"), 5000);
	const latestKeyString: string = latestKey as string;
	const cachedData = await fetchCachedData(env, latestKeyString, 5000) as SpotifyTrack;

	if (cachedData.day == day) {
		// Return the cached data
		return {
			coverURL: cachedData.coverURL,
			title: cachedData.title,
			album: cachedData.album,
			artist: cachedData.artist,
			id: cachedData.id,
			day: cachedData.day,
		};
	}

	// Fetch a new track if no cache is available
	const randomQuery = getRandomSearchQuery();
	const query = randomQuery.searchQuery;
	const type = 'track';
	const limit = 50;

	const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=${limit}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Spotify API Error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();

	// Validate the response and assign a track
	if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
		throw new Error('No tracks found in the Spotify response');
	}

	const track = data.tracks.items[day % data.tracks.items.length];
	const trackFormatted = {
		coverURL: track.album.images[0].url,
		title: track.name,
		album: track.album.name,
		artist: track.artists.map((artist) => artist.name).join(', '),
		id: track.id,
		day: day,
	};

	if (!track) {
		throw new Error('Failed to select a valid track from the response');
	}

	// Cache the new track data
	await env.SPOTIFY_API_HANDLER_CACHE.put(cacheKey, JSON.stringify(trackFormatted), {
		expirationTtl: 172800, // Expire after 2 days
	});

	await env.SPOTIFY_API_HANDLER_CACHE.put("latest-key", cacheKey);

	// Return the new track details
	return trackFormatted;
};

// Handling incoming requests
export default {
	async fetch(request, env : Env) {
		// Only support GET requests for simplicity
		if (request.method === 'GET') {
			try {
				const token = await fetchSpotifyToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
				const trackData = await fetchRandomTrack(token, env);

				return new Response(JSON.stringify(trackData), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': 'no-cache, no-store, must-revalidate',
					},
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, { status: 500 });
			}
		}

		return new Response('Method Not Allowed', { status: 405 });
	},
};
