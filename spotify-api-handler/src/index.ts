// Importing necessary environment variables
const fetchSpotifyToken = async (clientId, clientSecret): Promise<string> => {
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

const getRandomSearchQuery = (): { searchQuery: string; day: number } => {
	const searchQueries = [
		'spellcasting artist',
		'kasane teto vocaloid',
		'kendrick lamar',
		'B1A4 kpop band',
		'le sserafim kpop band',
		'tyler, the creator song rap artist',
		'newjeans kpop band',
		'hatsune miku vocaloid',
		'glass beach rock band',
		'loossemble kpop band',
	];

	const today = new Date();
	const day = today.getUTCDay() + today.getUTCDate() + today.getUTCMonth() + today.getUTCFullYear();

	const searchQuery = searchQueries[day % searchQueries.length];
	return { searchQuery, day };
};

const fetchRandomTrack = async (
	token: string
): Promise<{
	coverURL: string;
	title: string;
	album: string;
	artist: string;
	id: string;
	day: number;
}> => {
	const randomQuery = getRandomSearchQuery();
	const query = randomQuery.searchQuery;
	const type = 'track'; // Search for tracks
	const limit = 10; // Number of results to fetch

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
	const track = data.tracks.items[randomQuery.day % limit]; // Pick track based on the day of the year

	return {
		coverURL: track.album.images[0].url,
		title: track.name,
		album: track.album.name,
		artist: track.artists.map((artist) => artist.name).join(', '),
		id: track.id,
		day: randomQuery.day,
	};
};

// Handling incoming requests
export default {
	async fetch(request, env) {
		// Only support GET requests for simplicity
		if (request.method === 'GET') {
			try {
				const token = await fetchSpotifyToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
				const trackData = await fetchRandomTrack(token);

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
