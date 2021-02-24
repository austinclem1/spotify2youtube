import Head from 'next/head'

import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Jumbotron from 'react-bootstrap/Jumbotron'

import Cookies from 'cookies'
import { 
	getSpotifyAccessToken,
	refreshSpotifyTokens,
	getSpotifyTokensFromCode
} from '../helpers/spotify-helpers'
import { useEffect } from 'react'
import { useRouter } from 'next/router'


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
	const router = useRouter()
	const accessToken = getSpotifyAccessToken()
	useEffect(() => {
		if (accessToken === null) {
			router.replace('/spotify-login')
		} else {
			router.replace('/spotify-landing')
		}
	})

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
			<h5>Checking Login Status</h5>
			<Spinner animation='border' />
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

