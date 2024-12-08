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

const getRandomSearchQuery = (): { searchQuery: string; dayOfYear: number } => {
	const searchQueries = [
		'spellcasting artist',
		'miku',
		'tyler, the creator artist',
		'teto',
		'le sserafim artist',
		'B1A4',
		'kendrick lamar',
	];

	const today = new Date();
	const dayOfYear = Math.floor((today.getFullYear() - new Date(today.getFullYear(), 0, 0).getFullYear()) / 86400000);

	const searchQuery = searchQueries[dayOfYear % searchQueries.length];
	return { searchQuery, dayOfYear };
};

const fetchRandomTrack = async (
	token: string
): Promise<{
	coverURL: string;
	title: string;
	album: string;
	artist: string;
	id: string;
}> => {
	const randomQuery = getRandomSearchQuery();
	const query = randomQuery.searchQuery;
	const type = 'track'; // Search for tracks
	const limit = 50; // Number of results to fetch

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
	const track = data.tracks.items[randomQuery.dayOfYear % 50]; // Pick track based on the day of the year

	return {
		coverURL: track.album.images[0].url,
		title: track.name,
		album: track.album.name,
		artist: track.artists.map((artist) => artist.name).join(', '),
		id: track.id,
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
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, { status: 500 });
			}
		}

		return new Response('Method Not Allowed', { status: 405 });
	},
};
