import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import CardColumns from 'react-bootstrap/CardColumns'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Image from 'react-bootstrap/Image'
import Jumbotron from 'react-bootstrap/Jumbotron'
import ListGroup from 'react-bootstrap/ListGroup'
import Row from 'react-bootstrap/Row'
import styles from '../styles/spotify-playlists.module.css'
import React, { useState } from 'react'

export async function getServerSideProps(context) {
	// Check if we've been granted an authorization code
	// Without it, we can't get an access token for the user's
	// Spotify playlists etc.
	const authorizationCode = context.query.code
	if (!authorizationCode) {
		return {
			redirect: {
				permanent: false,
				destination: '/'
			}
		}
	}

	const accessToken = await getSpotifyUserAccessToken(authorizationCode)

	const userPlaylists = await getSpotifyUserPlaylists(accessToken)

	return {
		props: {
			userPlaylists
		}
	}
}

function TrackList(props) {
	const { tracks, isSelected } = props
	let numTracksShown = isSelected ? tracks.length : 5
	const color = isSelected ? 'primary' : 'light'

	if (isSelected) {
		return(
			<ListGroup>
				<ListGroup horizontal>
					<ListGroup.Item variant={'dark'} className='p-1 w-50'><strong>Title</strong></ListGroup.Item>
					<ListGroup.Item variant={'dark'} className='p-1 w-50'><strong>Artist</strong></ListGroup.Item>
				</ListGroup>
				{tracks.map((track) => 
					<ListGroup horizontal>
						<ListGroup.Item variant={color} className='p-1 w-50'>{track.name}</ListGroup.Item>
						<ListGroup.Item variant={color} className='p-1 w-50'>{track.artists}</ListGroup.Item>
					</ListGroup>
				)}
			</ListGroup>
		)
	} else {
		return(
			<ListGroup>
				{tracks.slice(0, numTracksShown).map((track) => 
					<ListGroup.Item variant={color} className='p-1'>{track.name}</ListGroup.Item>
				)}
				{tracks.length > numTracksShown + 1 &&
					<ListGroup.Item variant={color} className='p-1'>{tracks.length - numTracksShown} More...</ListGroup.Item>
				}
			</ListGroup>
		)
	}
}

function PlaylistCard(props) {
	const { playlist, order } = props
	const [isSelected, setIsSelected] = useState(false)
	const [currentOrder, setCurrentOrder] = useState(order)
	const handleClick = () => {
		// Even numbered order means the card is on the right (on large devices)
		// When it's selected we want to push it's order to the left so it doesn't
		// leave an empty gap behind
		if (order % 2 === 0) {
			if (isSelected) {
				setCurrentOrder(currentOrder + 2)
			} else {
				setCurrentOrder(currentOrder - 2)
			}
		}
		setIsSelected(!isSelected)
	}
	const color = isSelected ? 'primary' : 'light'
	const cardWidth = isSelected ? 12 : 6
	return(
		<Col xs={{span: 12, order: order}} lg={{span: cardWidth, order: currentOrder}} className='my-3 mx-0'>
			<Card bg={color} className='h-100' onClick={() => handleClick()} key={playlist.id}>
				<Card.Header className='text-center' as='h4'>
					<strong>{playlist.name}</strong>
				</Card.Header>
				<Card.Body>
					<p>Current order: {currentOrder}</p>
					<Row className='align-middle'>
						<Col xs={4}><Image src={playlist.image} fluid /></Col>
						<Col xs={8} className='align-self-center'>
							<Card.Text>
								<TrackList 
									tracks={playlist.tracks}
									isSelected={isSelected}
								/>
							</Card.Text>
						</Col>
					</Row>
					<a className='stretched-link' role='button' />
				</Card.Body>
		</Card>
	</Col>
	)
}

function SpotifyPlaylists({ userPlaylists }) {
	const playlistListItems = userPlaylists.
		filter((playlist) => playlist.tracks.length > 0).
		map((playlist, index) => <PlaylistCard playlist={playlist} order={index + 1} />
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

async function getSpotifyUserAccessToken(authorizationCode: string) {
	const spotifyTokenURL = 'https://accounts.spotify.com/api/token'

	// TODO: We can probably do this base64 encoding ahead of time
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
	return result.access_token
}

async function getSpotifyUserPlaylists(accessToken) {
	// Request 10 playlists owned or followed by the current user
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
	let userPlaylists = []
	userPlaylistsJson.items.forEach((playlist) => {
		userPlaylists.push({
			name: playlist.name,
			image: playlist.images[0] ? playlist.images[0].url : null,
			id: playlist.id,
		})
	})
	const playlistTrackPromises: Promise<Response>[] = userPlaylistsJson.items.map((playlist) => {
		const tracksURL = playlist.tracks.href
		const fields = 'items(track(name,artists(name)))'
		const tracksURLWithQuery = tracksURL +
			'?fields=' + fields +
			'&limit=20'
		return fetch(tracksURLWithQuery, spotifyFetchOptions)
	})
	const allTrackResponses = await Promise.allSettled(playlistTrackPromises)
	const allTrackParsePromises = allTrackResponses.map((result) => {
		if (result.status === 'fulfilled') {
			return result.value.json()
		} else {
			return null
		}
	})
	const allParsedTracksResults = await Promise.allSettled(allTrackParsePromises)
	// const allParsedTracks = allParsedTracksResults.map((result) => {
	// 	if (result.status === 'fulfilled') {
	// 		return result.value
	// 	} else {
	// 		return null
	// 	}
	// })
	allParsedTracksResults.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			userPlaylists[index]['tracks'] = result.value.items.map((item) => {
				return {
					name: item.track.name,
					artists: item.track.artists.map((artist) => artist.name).join(', ')
				}
			})
		}
	})

	return userPlaylists
}

export default SpotifyPlaylists
