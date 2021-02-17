import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Image from 'react-bootstrap/Image'
import Jumbotron from 'react-bootstrap/Jumbotron'
import Link from 'next/link'
import ListGroup from 'react-bootstrap/ListGroup'
import Navbar from 'react-bootstrap/Navbar'
import Row from 'react-bootstrap/Row'
import React, { useEffect, useRef, useState } from 'react'
import Cookies from 'cookies'

import { getSpotifyUserAccessToken } from '../helpers/spotify-helpers'

export async function getServerSideProps(context) {
	const cookieExpirationDate = new Date()
	cookieExpirationDate.setFullYear(cookieExpirationDate.getFullYear() + 1)
	const cookieOptions = {
		expires: cookieExpirationDate,
		overwrite: true
	}
	const cookies = new Cookies(context.req, context.res)
	// Check if we've been granted an authorization code
	// Without it, we can't get an access token for the user's
	// Spotify playlists etc.
	// TODO: Eventually this may be unnessecary to check, if the user has
	// a refresh token in a cookie we can use that instead of the authorization
	// code. Refresh tokens are effectively permanent according to brief googling
	const authorizationCode = context.query.code
	let accessToken
	let refreshToken
	// If we have no authorization code, see if we have a cookie with a
	// refresh token
	if (authorizationCode) {
		[accessToken, refreshToken] = await getSpotifyUserAccessToken({
			authentication: authorizationCode,
			useAuthorizationCode: true,
		})
		cookies.set('accessToken', accessToken, cookieOptions)
		if (refreshToken) {
			cookies.set('refreshToken', refreshToken, cookieOptions)
		}
		console.log('--------')
		console.log('used authorization code to get tokens')
		console.log('stored tokens in cookie')
		console.log('--------')
	} else {
		accessToken = cookies.get('accessToken')
		refreshToken = cookies.get('refreshToken')
		console.log('--------')
		console.log('get tokens from cookie')
		console.log('--------')
	}

	// If we have no access token at this point, we should give up and redirect
	// to login page
	if (!accessToken) {
		return {
			redirect: {
				permanent: false,
				destination: '/'
			}
		}
	}

	const userPlaylists = await getSpotifyUserPlaylists(accessToken, refreshToken, cookies)

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
	const cardRef = useRef(null)
	const { playlist, order, isSelected, setSelectedPlaylist } = props
	useEffect(() => {
		if (isSelected) {
			const position = cardRef.current.getBoundingClientRect()
			console.log(position)
			// cardRef.current.scrollIntoView(scrollOptions)
			window.scrollTo({
				top: position.top + window.scrollY - 20,
				left: 0,
				behavior: 'smooth'
			})
		}
	})
	let currentOrder = order
	if (isSelected && order % 2 === 0) {
		currentOrder -= 2
	}
	const color = isSelected ? 'primary' : 'light'
	const cardWidth = isSelected ? 12 : 6
	return(
		<Col xs={{span: 12, order: order}} lg={{span: cardWidth, order: currentOrder}} className='my-3 mx-0'>
			<Card ref={cardRef} bg={color} className='h-100' onClick={() => setSelectedPlaylist(playlist.id)} key={playlist.id}>
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
	const [selectedPlaylist, _setSelectedPlaylist] = useState(null)
	const setSelectedPlaylist = (id) => {
		if (id === selectedPlaylist) {
			_setSelectedPlaylist(null)
		} else {
			_setSelectedPlaylist(id)
		}
	}
	const playlistListItems = userPlaylists.
		filter((playlist) => playlist.tracks.length > 0).
		map((playlist, index) => <PlaylistCard playlist={playlist} order={index + 1} isSelected={playlist.id === selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist}/>
	)
	return(
		<Container className='text-center'>
			<Jumbotron>
				<h1>Choose a Playlist to Convert</h1>
			</Jumbotron>
			<Row className='m-xs-1 m-sm-2 m-md-3 m-lg-4 m-xl-5'>
				{playlistListItems}
			</Row>
			<Navbar bg='dark' fixed='bottom' className='w-100 justify-content-center'>
				<Link href='/youtube-results'>
					<Button disabled={selectedPlaylist === null}>Convert</Button>
				</Link>
			</Navbar>
		</Container>
	)
}

async function getSpotifyUserPlaylists(accessToken, refreshToken, cookies) {
	// Request 10 playlists owned or followed by the current user
	const cookieExpirationDate = new Date()
	cookieExpirationDate.setFullYear(cookieExpirationDate.getFullYear() + 1)
	const cookieOptions = {
		expires: cookieExpirationDate,
		overwrite: true
	}
	const spotifyPlaylistsURL = 'https://api.spotify.com/v1/me/playlists?limit=10'
	let spotifyFetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}
	let playlistResponse = await fetch(spotifyPlaylistsURL, spotifyFetchOptions)
	console.log('--------')
	console.log('retreiving playlists')
	console.log('--------')
	if (playlistResponse.status === 401) {
		[accessToken, refreshToken] = await getSpotifyUserAccessToken({
			authentication: refreshToken,
			useAuthorizationCode: false,
		})
		cookies.set('accessToken', accessToken, cookieOptions)
		// Only store refresh token if we actually got one
		if (refreshToken) {
			cookies.set('refreshToken', refreshToken, cookieOptions)
		}
		console.log('--------')
		console.log('got 401 code. Getting new tokens with refresh token')
		console.log('--------')
		spotifyFetchOptions = {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + accessToken
			}
		}
		playlistResponse = await fetch(spotifyPlaylistsURL, spotifyFetchOptions)
		console.log('--------')
		console.log('retreiving playlists with new access token')
		console.log('--------')
	}
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

	userPlaylists.sort((a, b) => {
		const nameA = a.name.toUpperCase()
		const nameB = b.name.toUpperCase()
		if (nameA < nameB) {
			return -1
		}
		if (nameA > nameB) {
			return 1
		}
		return 0
	})

	return userPlaylists
}

export default SpotifyPlaylists
