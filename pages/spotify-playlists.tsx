import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import CardColumns from 'react-bootstrap/CardColumns'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Image from 'react-bootstrap/Image'
import Jumbotron from 'react-bootstrap/Jumbotron'
import Row from 'react-bootstrap/Row'
import styles from '../styles/spotify-playlists.module.css'

const SHORT_LIST_NUM_TRACKS = 8

export async function getServerSideProps(context) {
	const authorizationCode = context.query.code
	if (!authorizationCode) {
		return {
			redirect: {
				permanent: false,
				destination: '/'
			}
		}
	}
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'
	const combinedCodeBuffer = Buffer.from(
		process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' +
		process.env.SPOTIFY_CLIENT_SECRET,
		'utf-8'
	)
	const formBody = encodeURIComponent('grant_type') + '=' +
		encodeURIComponent('authorization_code') + '&' +
		encodeURIComponent('code') + '=' +
		encodeURIComponent(authorizationCode) + '&' +
		encodeURIComponent('redirect_uri') + '=' +
		encodeURIComponent('http://localhost:3000/spotify-playlists')
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
	const accessToken = result.access_token

	const spotifyPlaylistsURL = 'https://api.spotify.com/v1/me/playlists?limit=10'
	const spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}
	const playlistResponse = await fetch(spotifyPlaylistsURL, spotifyFetchOptions)
	const userPlaylistsJson = await playlistResponse.json()
	const playlistTrackPromises = userPlaylistsJson.items.tracks.href.map((tracksURL) => {
		const fields = 'items(track(name))'
		const tracksURLWithQuery = tracksURL +
			'?fields=' + fields +
			'&limit=' + SHORT_LIST_NUM_TRACKS
		return fetch(tracksURLWithQuery, spotifyFetchOptions)
	})
	let userPlaylists = []
	userPlaylistsJson.items.forEach((playlist) =>
		userPlaylists.push({
			name: playlist.name,
			image: playlist.images[0].url,
			id: playlist.id,
		})
	)
	userPlaylists.forEach((playlist) => {
		const fields = 'items(track(name))'
		const spotifyPlaylistTracksURL = playlist.tracksURL +
			'?fields=' + fields +
			'&limit=' + SHORT_LIST_NUM_TRACKS
		const playlistTracksResponse = await fetch(
			spotifyPlaylistTracksURL, spotifyFetchOptions
		)
		const trackTitlesShortList = []
	})
	return {
		props: {
			userPlaylists
		}
	}
}

function PlaylistCard(props) {
	const { playlist } = props
	return(
		<Col xs={12} lg={6}>
			<Card bg='light' className='my-3 mx-1'>
				<Card.Header className='text-center'>
					<strong>{playlist.name}</strong>
				</Card.Header>
				<Card.Body>
					<Row className='align-middle'>
						<Col xs={4}><Image src={playlist.image} fluid /></Col>
						<Col xs={8} className='align-self-center'>
							<Card.Text>
								Song Names, and lots of em. So many songs here. Songs, Songs, Songs, Songs, Songs, Songs, Songs, Songs, Songs, Songs,
							</Card.Text>
						</Col>
					</Row>
				</Card.Body>
		</Card>
	</Col>
	)
}

function SpotifyPlaylists({ userPlaylists }) {
	const playlistListItems = userPlaylists.map((playlist) =>
		<PlaylistCard playlist={playlist} />
	)
	return(
		<Container className='text-center'>
			<Jumbotron>
				<h1>Choose a Playlist to Convert</h1>
			</Jumbotron>
			<Row className='m-xs-1 m-sm-2 m-md-3 m-lg-4 m-xl-5'>
				{playlistListItems}
			</Row>
		</Container>
	)
}

export default SpotifyPlaylists
