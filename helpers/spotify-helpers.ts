import Cookies from "cookies"

export async function getSpotifyTokensFromCode(code, redirectURI, codeVerifier) {
	const spotifyTokenURL = "https://accounts.spotify.com/api/token"

	const query = new URLSearchParams({
		client_id: process.env.spotifyClientId,
		grant_type: "authorization_code",
		code: code,
		redirect_uri: redirectURI,
		code_verifier: codeVerifier
	})

	const headers = new Headers({
		"Content-Type": "application/x-www-form-urlencoded"
	})
	const fetchOptions = {
		headers,
		method: "POST",
		body: query.toString()
	}

	const response = await fetch(spotifyTokenURL, fetchOptions)
		.then((res) => res.json())

	console.log(JSON.stringify(response))

	let accessToken = response.access_token
	let expiresIn = response.expires_in
	let refreshToken = response.refresh_token
	// If we succeeded in getting new tokens, store them in local storage
	if (accessToken) {
		window.localStorage.setItem("spotifyAccessToken", accessToken)
	} else {
		accessToken = null
		window.localStorage.removeItem("spotifyAccessToken")
	}
	if (expiresIn) {
		// `expiresIn` represents seconds. Convert to milliseconds for expiration
		// time
		let accessTokenExpiration = Date.now() + (expiresIn * 1000)
		window.localStorage.setItem("spotifyAccessTokenExpiration", accessTokenExpiration.toString())
	} else {
		window.localStorage.removeItem("spotifyAccessTokenExpiration")
	}
	if (refreshToken) {
		window.localStorage.setItem("spotifyRefreshToken", refreshToken)
	} else {
		refreshToken = null
		window.localStorage.removeItem("spotifyRefreshToken")
	}

	return [accessToken, refreshToken]
}

export async function getSpotifyAccessToken() {
	console.log("retreiving access token")
	let accessToken = window.localStorage.getItem("spotifyAccessToken")
	let accessTokenExpiration = parseInt(window.localStorage.getItem("spotifyAccessTokenExpiration"))
	let refreshToken = window.localStorage.getItem("spotifyRefreshToken")
	if (!(accessToken && accessTokenExpiration && refreshToken)) {
		console.log("something was missing from local storage")
		console.log("aborting access token retreival")
		return null
	}
	// If we're within 3 minutes of an expired token, go ahead and treat it as
	// expired so we can get a new one
	// const tokenExpirationBufferMS = 180_000
	const tokenExpirationBufferMS = 3_550_000
	const tokenTimeLeftMS = accessTokenExpiration - Date.now()
	console.log("time left:", tokenTimeLeftMS / 1000)
	if (tokenTimeLeftMS < tokenExpirationBufferMS) {
		console.log("token expired");
		[accessToken, refreshToken] = await refreshSpotifyTokens(refreshToken)
	}

	return accessToken
}

// TODO: can we use then instead of async await here
export async function refreshSpotifyTokens(refreshToken) {
	console.log("refreshing tokens")
	const spotifyTokenURL = "https://accounts.spotify.com/api/token"

	const query = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: process.env.spotifyClientId,
	})

	const headers = new Headers({
		"Content-Type": "application/x-www-form-urlencoded"
	})
	const fetchOptions = {
		headers,
		method: "POST",
		body: query.toString()
	}

	// TODO: Find better way to handle error here
	const response = await fetch(spotifyTokenURL, fetchOptions)
		.then((res) => {
			if (res.ok) {
				return res.json()
			} else {
				return res.json()
			}
		})

	let accessToken = response.access_token
	let expiresIn = response.expires_in
	refreshToken = response.refresh_token
	// If we succeeded in getting new tokens, store them in local storage
	if (accessToken && expiresIn && refreshToken) {
		console.log("storing tokens and expiration in local storage")
		let accessTokenExpiration = Date.now() + (expiresIn * 1000)
		window.localStorage.setItem("spotifyAccessToken", accessToken)
		window.localStorage.setItem("spotifyAccessTokenExpiration", accessTokenExpiration.toString())
		window.localStorage.setItem("spotifyRefreshToken", refreshToken)
	} else {
		console.log("didn't get refreshed tokens")
		console.log("removing tokens from local storage")
		accessToken = null
		refreshToken = null
		window.localStorage.removeItem("spotifyAccessToken")
		window.localStorage.removeItem("spotifyAccessTokenExpiration")
		window.localStorage.removeItem("spotifyRefreshToken")
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
	const spotifyTokenURL = "https://accounts.spotify.com/api/token"

	let formBody
	if (useAuthorizationCode) {
		formBody = encodeURIComponent("grant_type") + "=" +
			encodeURIComponent("authorization_code") + "&" +
			encodeURIComponent("code") + "=" +
			encodeURIComponent(authentication) + "&" +
			encodeURIComponent("redirect_uri") + "=" +
			encodeURIComponent("http://localhost:3000/spotify-playlists")
		console.log("using authorization code to get access/refresh tokens")
	} else {
		formBody = encodeURIComponent("grant_type") + "=" +
			encodeURIComponent("refresh_token") + "&" +
			encodeURIComponent("refresh_token") + "=" +
			encodeURIComponent(authentication)
		console.log("using refresh token to get access/refresh tokens")
	}

	const tokenFetchOptions = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Authorization": "Basic " + process.env.spotifyTokenAuthorization
		},
		body: formBody
	}
	const response = await fetch(spotifyTokenURL, tokenFetchOptions)
	const result = await response.json()

	if (result.access_token) {
		cookies.set("accessToken", result.access_token, cookieOptions)
		console.log("got new access token and stored in cookie")
	}
	if (result.refresh_token) {
		cookies.set("refreshToken", result.refresh_token, cookieOptions)
		console.log("got new refresh token and stored in cookie")
	}

	return [result.access_token, result.refresh_token]
}

export function generateRandomStateString() {
	const length = 8
	let typedNums = new Uint8Array(length)
	typedNums = window.crypto.getRandomValues(typedNums)
	const nums = Array.from(typedNums)
	return nums.map((num) => num.toString(16)).join("")
}

export async function generateCodeVerifierAndChallenge() {
	let typedNums = new Uint8Array(64)
	typedNums = window.crypto.getRandomValues(typedNums)
	const nums = Array.from(typedNums)
	const verifier = nums.map((num) => num.toString(16)).join("")
	const encoder = new TextEncoder()
	const verifierArray = encoder.encode(verifier)
	const hash = await window.crypto.subtle.digest("SHA-256", verifierArray.buffer)
	const decoder = new TextDecoder()
	const hashArray = Array.from(new Uint8Array(hash))
	const hashString = String.fromCharCode(...hashArray)
	const challenge = stringToBase64URL(hashString)

	return [verifier, challenge]
}

function stringToBase64URL(input) {
	const result = window.btoa(input)
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_")
	return result
}
