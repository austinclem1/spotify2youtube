import Head from 'next/head'

import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Jumbotron from 'react-bootstrap/Jumbotron'

import Cookies from 'cookies'
import { getSpotifyUserAccessToken } from '../helpers/spotify-helpers'


export async function getServerSideProps(context) {
	let { accessToken, refreshToken } = context.req.cookies
	let userData
	if (refreshToken) {
		[accessToken, refreshToken] = await getSpotifyUserAccessToken({
			authentication: refreshToken,
			useAuthorizationCode: false,
			req: context.req,
			res: context.res
		})
		if (accessToken) {
			console.log('got an access token using existing refresh token')
			// userData = await getSpotifyUserData(context)
		}
	}

	return {
		props: {}
	}
}

function LoginPrompt() {
	return(
		<Container>
			<Row className="justify-content-md-center">
				<h3>Log In to Spotify to Get Started</h3>
			</Row>
			<Row className="justify-content-md-center">
				<img src="/Spotify_Logo_RGB_Green.png" width="300" />
			</Row>
			<Row className="justify-content-md-center">
				<Button onClick={userClickedLogin}>Login</Button>
			</Row>
		</Container>
	)
}

function IndexPage() {
  return (
		<Container className='text-center'>
			<Head>
				<title>Spotify2YouTube</title>
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Jumbotron>
				<h1>Spotify2YouTube Playlist Converter</h1>
			</Jumbotron>
			<LoginPrompt />
		</Container>
  )
}

function userClickedLogin() {
	// Request access token from Spotify for access to
	// user's private and followed playlists
	// On successful login we are redirected to spotify-playlists page
	const spotifyAuthenticationUrl = 'https://accounts.spotify.com/authorize' +
		'?response_type=code' +
		'&client_id=' + process.env.spotifyClientId +
		'&scope=' + 'playlist-read-private' +
		'&redirect_uri=' + 'http://localhost:3000/spotify-playlists';
	window.location.assign(spotifyAuthenticationUrl)
}

export default IndexPage

async function getSpotifyUserData(context) {
	const cookies = new Cookies(context.req, context.res)
	let accessToken = context.req.cookies.accessToken
	let refreshToken = context.req.cookies.refreshToken
}
