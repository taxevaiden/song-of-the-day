import queryString from "query-string";

const generateRandomString = (length: number): string => {
  var str: string = "";
  const alphabet: string =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  for (let i: number = 0; i < length; i++) {
    let randomLetter: string =
      alphabet[Math.floor(Math.random() * alphabet.length)];
    str += randomLetter;
  }

  return str;
};

// handling incoming requests
export default {
  async fetch(request: Request, env: Env) {
    if (request.method === "GET") {
      try {
        var scope = "user-top-read";
        var req_url = new URL(request.url);
        var redirect_uri = req_url.host + "/callback";
        var state = generateRandomString(16);

        return new Response(
          "https://accounts.spotify.com/authorize?" +
            queryString.stringify({
              response_type: "code",
              client_id: env.SPOTIFY_CLIENT_ID,
              scope: scope,
              redirect_uri: redirect_uri,
              state: state,
            }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          },
        );
      } catch (error) {
        return new Response(`Error: ${(error as Error).message}`, {
          status: 500,
        });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
