import Head from 'next/head'

import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Jumbotron from 'react-bootstrap/Jumbotron'

function Headline() {
	return(
		<Container className='text-center'>
			<Jumbotron>
				<h1>Spotify2YouTube Playlist Converter</h1>
			</Jumbotron>
		</Container>
	)
}

function IndexPage() {
  return (
		<div>
			<Head>
				<title>Spotify2YouTube</title>
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<Headline />

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
		</div>
  )
}

function userClickedLogin() {
	// Request access token from Spotify for access to
	// user's private and followed playlists
	// On successful login we are redirected to spotify-playlists page
	const spotifyAuthenticationUrl = 'https://accounts.spotify.com/authorize' +
		'?response_type=code' +
		'&client_id=' + process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID +
		'&scope=' + 'playlist-read-private' +
		'&redirect_uri=' + 'http://localhost:3000/spotify-playlists';
	window.location.assign(spotifyAuthenticationUrl)
}

export default IndexPage
