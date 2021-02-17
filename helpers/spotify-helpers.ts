export async function getSpotifyUserAccessToken({ authentication, useAuthorizationCode }) {
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'

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
			'Authorization': 'Basic ' + process.env.spotifyTokenAuthorization
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

