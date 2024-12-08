import dotenv from "dotenv";
dotenv.config();

export const fetchSpotifyToken = async (): Promise<string> => {
    const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
    const authString = `${clientId}:${clientSecret}`;
    const base64AuthString = btoa(authString);

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${base64AuthString}`,
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token; // Return the access token
};

const getRandomSearchQuery = (): { searchQuery: string; dayOfYear: number } => {
    const searchQueries = [
        "spellcasting artist",
        "miku",
        "tyler, the creator artist",
        "teto",
        "le sserafim artist",
        "B1A4",
        "kendrick lamar",
    ];

    const today = new Date();

    const dayOfYear = Math.floor(
        (today.getFullYear() -
            new Date(today.getFullYear(), 0, 0).getFullYear()) /
            86400000
    );

    const searchQuery = searchQueries[dayOfYear % searchQueries.length];

    return { searchQuery, dayOfYear };
};

export const fetchRandomTrack = async (
    token: string
): Promise<{
    coverURL: string;
    title: string;
    album: string;
    artist: string;
    id: string;
}> => {
    const randomQuery = getRandomSearchQuery();
    const query = randomQuery.searchQuery; // This could be a random genre or keyword, or even left as a generic search
    const type = "track"; // You can also search for albums, artists, etc.
    const limit = 50; // You can increase this to get more tracks

    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=${limit}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text(); // Read error body for debugging
        throw new Error(`Spotify API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json(); // Safely parse JSON
    const track = data.tracks.items[randomQuery.dayOfYear % 50]; // Get the first track from the search results
    return {
        coverURL: track.album.images[0].url,
        title: track.name,
        album: track.album.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        id: track.id,
    };
};
