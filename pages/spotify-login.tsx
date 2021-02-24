import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'


function SpotifyLogin() {
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

export default SpotifyLogin
