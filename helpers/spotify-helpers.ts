import Cookies from 'cookies'

export async function getSpotifyTokensFromCode(code, redirectURI, codeVerifier) {
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'

	const query = new URLSearchParams({
		client_id: process.env.spotifyClientId,
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: redirectURI,
		code_verifier: codeVerifier
	})

	const fetchOptions = {
		method: 'POST',
		body: query.toString()
	}

	const response = await fetch(spotifyTokenURL, fetchOptions)
		.then((res) => res.json())
	console.log(JSON.stringify(response))

	return [response.access_token, response.refresh_token]
}

export async function getSpotifyAccessToken() {
	let accessToken = window.localStorage.getItem('spotifyAccessToken')
	let accessTokenExpiration = parseInt(window.localStorage.getItem('spotifyAccessTokenExpiration'))
	let refreshToken = window.localStorage.getItem('spotifyRefreshToken')
	if (!(accessToken && accessTokenExpiration && refreshToken)) {
		return null
	}
	// If we're within 3 minutes of an expired token, go ahead and treat it as
	// expired so we can get a new one
	const tokenExpirationBufferMS = 180_000
	if (accessTokenExpiration - Date.now() < tokenExpirationBufferMS) {
		[accessToken, refreshToken] = await refreshSpotifyTokens(refreshToken)
	}

	return accessToken
}

export async function refreshSpotifyTokens(refreshToken) {
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'

	const query = new URLSearchParams({
		grant_type: 'authorization_code',
		refresh_token: refreshToken,
		client_id: process.env.spotifyClientId,
	})

	const fetchOptions = {
		method: 'POST',
		body: query.toString()
	}

	// TODO: Find better way to handle error here
	const response = await fetch(spotifyTokenURL, fetchOptions)
		.then((res) => {
			if (res.ok) {
				return res.json()
			} else {
				return {
					error: res.status
				}
			}
		})

	let accessToken = response.access_token
	let expiresIn = response.expires_in
	refreshToken = response.refresh_token
	// If we succeeded in getting new tokens, store them in local storage
	if (accessToken) {
		accessToken = null
		window.localStorage.setItem('spotifyAccessToken', accessToken)
	} else {
		window.localStorage.removeItem('spotifyAccessToken')
	}
	if (expiresIn) {
		// `expiresIn` represents seconds. Convert to milliseconds for expiration
		// time
		let accessTokenExpiration = Date.now() + (expiresIn * 1000)
		window.localStorage.setItem('spotifyAccessTokenExpiration', accessTokenExpiration.toString())
	} else {
		window.localStorage.removeItem('spotifyAccessTokenExpiration')
	}
	if (refreshToken) {
		refreshToken = null
		window.localStorage.setItem('spotifyRefreshToken', refreshToken)
	} else {
		window.localStorage.removeItem('spotifyRefreshToken')
	}

	return [accessToken, refreshToken]
}

// Defunct for now
export async function getSpotifyUserAccessToken({ authentication, useAuthorizationCode, req, res }) {
	const cookies = new Cookies(req, res)
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

export function generateRandomStateString() {
	const length = 8
	let typedNums = new Uint8Array(length)
	typedNums = window.crypto.getRandomValues(typedNums)
	const nums = Array.from(typedNums)
	return nums.map((num) => num.toString(16)).join('')
}
