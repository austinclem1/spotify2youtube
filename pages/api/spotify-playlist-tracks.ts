import { getSpotifyAccessToken } from "../../helpers/spotify-helpers"


export default async function handler(req, res) {
	const accessToken = getSpotifyAccessToken()
	const id = req.query.id
	const market = 'from_token'
	const fields = 'items(track(name,artists(name)))'
	const limit = req.query.limit
	const offset = req.query.offset
	const spotifyPlaylistsURL = new URL(`https://api.spotify.com/v1/playlists/${id}/tracks`)
	spotifyPlaylistsURL.searchParams.set('fields', fields)
	spotifyPlaylistsURL.searchParams.set('market', market)
	if (limit) {
		spotifyPlaylistsURL.searchParams.set('limit', limit)
	}
	if (offset) {
		spotifyPlaylistsURL.searchParams.set('offset', offset)
	}
	let spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}

	let trackResponse = await fetch(spotifyPlaylistsURL.href, spotifyFetchOptions)
		.then((res) => res.json())
	if (trackResponse.status === 401) {
		// TODO should request new tokens here
	}
	spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}
	trackResponse = await fetch(spotifyPlaylistsURL.href, spotifyFetchOptions)
		.then((res) => res.json())
	console.log(JSON.stringify(trackResponse))
	const finalResults = trackResponse.items.map((track) => {
		return {
			name: track.name,
			artists: track.artists.map((artist) => artist.name).join(', '),
		}
	})

	res.json(finalResults)
}

