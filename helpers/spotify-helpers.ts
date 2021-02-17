export async function getSpotifyUserAccessToken({ authentication, useAuthorizationCode }) {
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'

	// TODO: We can probably do this base64 encoding ahead of time
	const combinedCodeBuffer = Buffer.from(
		process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' +
		process.env.SPOTIFY_CLIENT_SECRET,
		'utf-8'
	)
	let formBody
	if (useAuthorizationCode) {
		formBody = encodeURIComponent('grant_type') + '=' +
			encodeURIComponent('authorization_code') + '&' +
			encodeURIComponent('code') + '=' +
			encodeURIComponent(authentication) + '&' +
			encodeURIComponent('redirect_uri') + '=' +
			encodeURIComponent('http://localhost:3000/spotify-playlists')
	} else {
		formBody = encodeURIComponent('grant_type') + '=' +
			encodeURIComponent('refresh_token') + '&' +
			encodeURIComponent('refresh_token') + '=' +
			encodeURIComponent(authentication)
	}

	const tokenFetchOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + combinedCodeBuffer.toString('base64')
		},
		body: formBody
	}
	const response = await fetch(spotifyTokenURL, tokenFetchOptions)
	const result = await response.json()

	console.log('--------')
	console.log('getting tokens')
	console.log('access token:', result.access_token)
	console.log('refresh token:', result.refresh_token)
	console.log('--------')

	return [result.access_token, result.refresh_token]
}

