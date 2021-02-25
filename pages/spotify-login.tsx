import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import { getSpotifyTokensFromCode, generateRandomStateString, generateCodeVerifierAndChallenge } from "../helpers/spotify-helpers"
import { useEffect } from "react"
import { useRouter } from "next/router"


export async function getServerSideProps(context) {
	const query = new URLSearchParams(context.query)
	const code = query.get("code")
	const state = query.get("spotifyState")

	return {
		props: {
			code,
			state
		}
	}
}

function SpotifyLogin(props) {
	const { code, state } = props
	const router = useRouter()
	useEffect(() => {
		if (state) {
			const oldState = window.localStorage.getItem("spotifyState")
			if (oldState !== state) {
				// TODO: redirect on state mismatch
				console.log("state doesn't match, should get out of here")
			}
		}
		if (code) {
			const redirectURI = "http://localhost:3000/spotify-login"
			const codeVerifier = window.localStorage.getItem("spotifyCodeVerifier")
			console.log("verifier:", codeVerifier)
			getSpotifyTokensFromCode(code, redirectURI, codeVerifier)
				.then(([accessToken, refreshToken]) => {
					if (accessToken && refreshToken) {
						router.push("/spotify-landing")
					}
				})
		}
	})
	return(
		<Container>
			<Row className="justify-content-md-center">
				<h3>Log In to Spotify to Get Started</h3>
			</Row>
			<Row className="justify-content-md-center">
				<img src="/Spotify_Logo_RGB_Green.png" width="300" />
			</Row>
			<Row className="justify-content-md-center">
				{code === null &&
				<Button onClick={async () => await userClickedLogin()}>Login</Button>
				}
				{code !== null &&
					<Spinner animation="border" />
				}
			</Row>
		</Container>
	)
}

async function userClickedLogin() {
	const state = generateRandomStateString()
	window.localStorage.setItem("spotifyState", state)
	const [codeVerifier, codeChallenge] = await generateCodeVerifierAndChallenge()
	window.localStorage.setItem("spotifyCodeVerifier", codeVerifier)
	console.log("verifier:", codeVerifier)
	console.log("challenge:", codeChallenge)
	// Request access token from Spotify for access to
	// user's private and followed playlists
	// On successful login we are redirected to spotify-playlists page
	const queryParams = new URLSearchParams({
		client_id: process.env.spotifyClientId,
		response_type: "code",
		redirect_uri: "http://localhost:3000/spotify-login",
		code_challenge_method: "S256",
		code_challenge: codeChallenge,
		state,
		scope: "playlist-read-private"
	})
	const spotifyAuthenticationUrl = "https://accounts.spotify.com/authorize?" +
		queryParams.toString()
	window.location.assign(spotifyAuthenticationUrl)
}

export default SpotifyLogin
