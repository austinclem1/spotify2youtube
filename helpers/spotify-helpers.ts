import Cookies from 'cookies'

export async function getSpotifyUserAccessToken({ authentication, useAuthorizationCode, context }) {
	const cookies = new Cookies(context.req, context.res)
	const cookieExpirationDate = new Date()
	cookieExpirationDate.setFullYear(cookieExpirationDate.getFullYear() + 1)
	const cookieOptions = {
		expires: cookieExpirationDate,
		overwrite: true
	}
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'

	let formBody
	if (useAuthorizationCode) {
		formBody = encodeURIComponent('grant_type') + '=' +
			encodeURIComponent('authorization_code') + '&' +
			encodeURIComponent('code') + '=' +
			encodeURIComponent(authentication) + '&' +
			encodeURIComponent('redirect_uri') + '=' +
			encodeURIComponent('http://localhost:3000/spotify-playlists')
		console.log('using authorization code to get access/refresh tokens')
	} else {
		formBody = encodeURIComponent('grant_type') + '=' +
			encodeURIComponent('refresh_token') + '&' +
			encodeURIComponent('refresh_token') + '=' +
			encodeURIComponent(authentication)
		console.log('using refresh token to get access/refresh tokens')
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

	if (result.access_token) {
		cookies.set('accessToken', result.access_token, cookieOptions)
		console.log('got new access token and stored in cookie')
	}
	if (result.refresh_token) {
		cookies.set('refreshToken', result.refresh_token, cookieOptions)
		console.log('got new refresh token and stored in cookie')
	}

	return [result.access_token, result.refresh_token]
}

