import { getSpotifyUserAccessToken } from '../../helpers/spotify-helpers'
import Cookies from 'cookies'

export default async function handler(req, res) {
	console.log(JSON.stringify(req.cookies))
	let accessToken = req.cookies.accessToken
	let refreshToken = req.cookies.refreshToken
	const spotifyPlaylistsURL = new URL('https://api.spotify.com/v1/me/playlists')
	const limit = req.query.limit
	if (limit) {
		spotifyPlaylistsURL.searchParams.set('limit', limit)
	}
	let spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}

	let playlistResponse = await fetch(spotifyPlaylistsURL.href, spotifyFetchOptions)
		.then((res) => res.json())
	if (playlistResponse.status === 401) {
		[accessToken] = await getSpotifyUserAccessToken({
			authentication: refreshToken,
			useAuthorizationCode: false,
			req,
			res
		})
	}
	spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}
	playlistResponse = await fetch(spotifyPlaylistsURL.href, spotifyFetchOptions)
		.then((res) => res.json())
	const cookies = new Cookies(req, res)
	cookies.set('thingy', 'asdfasdf')
	let finalResults = []
	playlistResponse.items.forEach((playlist) => {
		finalResults.push({
			id: playlist.id,
			name: playlist.name,
			image: playlist.images[0] ? playlist.images[0].url : null,
			totalTracks: playlist.tracks.total,
			tracksURL: playlist.tracks.href,
		})
	})
	const playlistTrackPromises: Promise<any>[] = finalResults.map((playlist) => {
		const fields = 'items(track(name,artists(name)))'
		const tracksURL = new URL('/api/spotify-playlist-tracks', `http://${req.headers.host}`)
		tracksURL.searchParams.set('id', playlist.id)
		tracksURL.searchParams.set('limit', process.env.spotifyReducedTrackCount)
		return fetch(tracksURL.href, spotifyFetchOptions)
			.then((res) => res.json())
	})
	await Promise.allSettled(playlistTrackPromises)
		.then((results) => results.map((trackResult, index) => {
			if (trackResult.status === 'fulfilled') {
				finalResults[index]['tracks'] = trackResult.value
			}
		}))

	res.json(finalResults)
}
