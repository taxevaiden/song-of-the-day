interface SpotifyTrack {
	coverURL: string;
	title: string;
	album: string;
	artist: string;
	explicit: boolean;
	id: string;
	day: number;
}

function shuffleArray(array: Array<string>) {
	let clone = structuredClone(array);
	for (let i = clone.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[clone[i], clone[j]] = [clone[j], clone[i]];
	}
	return clone;
}

// utility function to apply timeout to any promise
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
		return null;
	}
};

// importing necessary environment variables
const fetchSpotifyToken = async (clientId: string, clientSecret: string): Promise<string> => {
	const authString = `&client_id=${clientId}&client_secret=${clientSecret}`;
	// const base64AuthString = btoa(authString);

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			// Authorization: `Basic ${base64AuthString}`,
		},
		body: `grant_type=client_credentials${authString}`,
	});

	const data = await response.json();
	console.log(data);
	return data.access_token; // return the access token
};

const getToday = (): { day: number } => {
	const today = new Date();
	const day = today.getUTCDay() + today.getUTCDate() + today.getUTCMonth() + (today.getUTCFullYear() - 1000) * 365;

	return { day };
};

const getRandomSearchQuery = (): { searchQuery: string } => {
	const searchQueries = [
		'vocaloid',
		'iyowa',
		'sasakure.UK',
		'DECO*27',
		'cosMo@Bousou-P',
		'ado',
		'frank ocean',
		'kendrick lamar',
		'tyler, the creator song rap artist',
		'linkin park',
		'mf doom',
	];

	const shuffled = shuffleArray(searchQueries);

	const searchQuery = shuffled[getToday().day % searchQueries.length];
	return { searchQuery };
};

const fetchRandomTrack = async (
	token: string,
	env: Env,
): Promise<{
	coverURL: string;
	title: string;
	album: string;
	artist: string;
	explicit: boolean;
	id: string;
	day: number;
}> => {
	const day = getToday().day;
	console.log(day);
	const cacheKey = `spotify-track-${day}`;
	const latestKey = await withTimeout(env.SPOTIFY_API_HANDLER_CACHE.get('latest-key'), 5000);
	const latestKeyString: string = latestKey as string;
	const cachedData = (await fetchCachedData(env, latestKeyString, 5000)) as SpotifyTrack;
	console.log(cachedData);

	if (cachedData) {
		if (cachedData.day == day) {
			// return the cached data
			return {
				coverURL: cachedData.coverURL,
				title: cachedData.title,
				album: cachedData.album,
				artist: cachedData.artist,
				explicit: cachedData.explicit,
				id: cachedData.id,
				day: cachedData.day,
			};
		}
	}

	// fetch a new track if no cache is available
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

	// validate the response and assign a track
	if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
		throw new Error('No tracks found in the Spotify response');
	}

	const track = data.tracks.items[day % data.tracks.items.length];
	const trackFormatted = {
		coverURL: track.album.images[0].url,
		title: track.name,
		album: track.album.name,
		artist: track.artists.map((artist) => artist.name).join(', '),
		explicit: track.explicit,
		id: track.id,
		day: day,
	};

	if (!track) {
		throw new Error('Failed to select a valid track from the response');
	}

	// cache the new track data
	await env.SPOTIFY_API_HANDLER_CACHE.put(cacheKey, JSON.stringify(trackFormatted), {
		expirationTtl: 2678400, // Expire after a month
	});

	await env.SPOTIFY_API_HANDLER_CACHE.put('latest-key', cacheKey);

	// return the new track details
	return trackFormatted;
};

// handling incoming requests
export default {
	async fetch(request, env: Env) {
		// Only support GET requests for simplicity
		if (request.method === 'GET') {
			try {
				const token = await fetchSpotifyToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
				console.log(token);
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
