export default async function handler(req, res) {
	console.log(req.query)
	let accessToken = req.cookies.accessToken
	let refreshToken = req.cookies.refreshToken
	const spotifyPlaylistsURL = 'https://api.spotify.com/v1/me/playlists' +
		'?limit=' + req.query.limit
	let spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}

	let playlistResults = await fetch(spotifyPlaylistsURL, spotifyFetchOptions)
		.then((res) => res.json())
	let finalResults = []
	playlistResults.items.forEach((playlist) => {
		finalResults.push({
			id: playlist.id,
			name: playlist.name,
			image: playlist.images[0] ? playlist.images[0].url : null,
		})
	})
	const playlistTrackPromises: Promise<Response>[] = playlistResults.items.map((playlist) => {
		const fields = 'items(track(name,artists(name)))'
		const tracksURL = playlist.tracks.href +
			'?fields=' + fields +
			'&limit=' + process.env.spotifyReducedTrackCount
		return fetch(tracksURL, spotifyFetchOptions)
	})
	const playlistTrackResponses = await Promise.allSettled(playlistTrackPromises)
	const trackParsePromises = playlistTrackResponses
		.map((res) => {
			if (res.status === 'fulfilled') {
				return res.value.json()
			} else {
				return null
			}
		})
	const trackResults = await Promise.allSettled(trackParsePromises)
	trackResults.forEach((trackList, index) => {
		if (trackList.status === 'fulfilled') {
			finalResults[index]['tracks'] = trackList.value.items.map((item) => {
				return {
					name: item.track.name,
					artists: item.track.artists.map((artist) => artist.name).join(', ')
				}
			})
		}
	})

	console.log(JSON.stringify(finalResults))

	res.json(finalResults)
}
