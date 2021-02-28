import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Image from "react-bootstrap/Image"
import Jumbotron from "react-bootstrap/Jumbotron"
import Link from "next/link"
import ListGroup from "react-bootstrap/ListGroup"
import Navbar from "react-bootstrap/Navbar"
import Pagination from "react-bootstrap/Pagination"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import Table from "react-bootstrap/Table"
import React, { useEffect, useRef, useState } from "react"
import useSWR from "swr"

import { getSpotifyUserPlaylists, fetchAllPlaylistTracks } from "../helpers/spotify-helpers"

import fetcher from "../libs/fetcher"


const tracksPerPage = 10

function TracksTable(props) {
	const { tracks, isSelected } = props
	const [currentPage, setCurrentPage] = useState(1)
	const [startedFetchingTracks, setStartedFetchingTracks] = useState(false)
	const fetchFunction = () => {
		if (isSelected) {
			console.log("got here")
			fetchAllPlaylistTracks(playlist)
		}
	}
	const { data: doneLoadingTracks } = useSWR("spotifyFetchTracks", fetchFunction)
	let numTracksShown = isSelected ? playlist.totalTracks : process.env.spotifyReducedTrackCount
	const color = isSelected ? "primary" : "light"
	
	// let pageItems = []
	// const trackStartIndex = (currentPage - 1) * tracksPerPage
	// const trackStopIndex = Math.min(currentPage * tracksPerPage, playlist.totalTracks)
	// let loading = playlist.tracks.length < trackStopIndex
	// if (isSelected) {
	// 	if (!startedFetchingTracks) {
	// 		fetchAllPlaylistTracks(playlist)
	// 		setStartedFetchingTracks(true)
	// 	}
	// 	// TODO determine where to put ellipses for playlist with many pages
	// 	const numPages = Math.ceil(playlist.totalTracks / tracksPerPage)
	// 	for (let i=1; i<=numPages; i++) {
	// 		pageItems.push(
	// 			<Pagination.Item key={i} active={i === currentPage} onClick={() => setCurrentPage(i)}>
	// 				{i}
	// 			</Pagination.Item>
	// 		)
	// 	}
	// }

	return(
		<Table striped bordered hover>
			<thead>
				<tr>
					<th>Title</th>
					<th>Artist(s)</th>
				</tr>
			</thead>
			<tbody>
				{
					playlist.tracks.map((track) => 
						<tr>
							<td>{track.name}</td>
							<td>{track.artists}</td>
						</tr>
					)
				}
			{!doneLoadingTracks && isSelected &&
				<Spinner animation="border" />
			}
			</tbody>
		</Table>
	)
}

function PlaylistCard(props) {
	const cardRef = useRef(null)
	const { playlist, order, isSelected, setSelectedPlaylist } = props
	useEffect(() => {
		if (isSelected) {
			const position = cardRef.current.getBoundingClientRect()
			// cardRef.current.scrollIntoView(scrollOptions)
			window.scrollTo({
				top: position.top + window.scrollY - 20,
				left: 0,
				behavior: "smooth"
			})
		}
	})

	const selectPlaylist = (id) => {
		setSelectedPlaylist(id)
	}

	let currentOrder = order
	if (isSelected && order % 2 === 0) {
		currentOrder -= 2
	}
	const color = isSelected ? "primary" : "light"
	const cardWidth = isSelected ? 12 : 6
	return(
		<Col xs={{span: 12, order: order}} lg={{span: cardWidth, order: currentOrder}} className="my-3 mx-0">
			<Card ref={cardRef} bg={color} className="h-100" onClick={() => selectPlaylist(playlist.id)} key={playlist.id}>
				<Card.Header className="text-center" as="h4">
					<strong>{playlist.name}</strong>
				</Card.Header>
				<Card.Body>
					<p>Current order: {currentOrder}</p>
					<Row className="align-middle">
						<Col xs={12}><Image src={playlist.image} fluid /></Col>
						<Col xs={12} className="align-self-center">
							<Card.Text>
								<TrackList 
									playlist={playlist}
									isSelected={isSelected}
								/>
							</Card.Text>
						</Col>
					</Row>
					{ !isSelected &&
						<a className="stretched-link" role="button" />
					}
				</Card.Body>
		</Card>
	</Col>
	)
}

function SpotifyPlaylists() {
	const [selectedPlaylist, _setSelectedPlaylist] = useState(null)
	const setSelectedPlaylist = (id) => {
		// if (id === selectedPlaylist) {
		// 	_setSelectedPlaylist(null)
		// } else {
		// 	_setSelectedPlaylist(id)
		// }
		_setSelectedPlaylist(id)
	}
	// const { data: playlists, error } = useSWR("api/spotify-user-playlists", fetcher)
	const { data: playlists, error } = useSWR("spotifyUserPlaylists", getSpotifyUserPlaylists)
	return(
		<Container className="text-center">
			<Jumbotron>
				<h1>Choose a Playlist to Convert</h1>
			</Jumbotron>
			<Row className="m-xs-1 m-sm-2 m-md-3 m-lg-4 m-xl-5">
				{
					playlists ? playlists
						.filter((playlist) => playlist.totalTracks > 0)
					.map((playlist, index) => <PlaylistCard playlist={playlist} order={index + 1} isSelected={playlist.id === selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist}/>) : <Container>Loading Playlists...<Spinner animation="border" /></Container>
				}
			</Row>
			<Navbar bg="dark" fixed="bottom" className="w-100 justify-content-center">
				<Link href="/youtube-results">
					<Button disabled={selectedPlaylist === null}>Convert</Button>
				</Link>
			</Navbar>
		</Container>
	)
}

// async function getSpotifyUserPlaylists(accessToken, refreshToken, context) {
// 	// Request 10 playlists owned or followed by the current user
// 	const spotifyPlaylistsURL = "https://api.spotify.com/v1/me/playlists?limit=10"
// 	let spotifyFetchOptions = {
// 		method: "GET",
// 		headers: {
// 			"Accept": "application/json",
// 			"Content-Type": "application/json",
// 			"Authorization": "Bearer " + accessToken
// 		}
// 	}
// 	let playlistResponse = await fetch(spotifyPlaylistsURL, spotifyFetchOptions)
// 	console.log("fetching playlists...")
// 	if (playlistResponse.status === 401) {
// 		console.log("Got 401, about to get new tokens")
// 		[accessToken, refreshToken] = await getSpotifyUserAccessToken({
// 			authentication: refreshToken,
// 			useAuthorizationCode: false,
// 			context,
// 		})
// 		spotifyFetchOptions = {
// 			method: "GET",
// 			headers: {
// 				"Accept": "application/json",
// 				"Content-Type": "application/json",
// 				"Authorization": "Bearer " + accessToken
// 			}
// 		}
// 		playlistResponse = await fetch(spotifyPlaylistsURL, spotifyFetchOptions)
// 	}
// 	const userPlaylistsJson = await playlistResponse.json()
// 	let userPlaylists = []
// 	userPlaylistsJson.items.forEach((playlist) => {
// 		userPlaylists.push({
// 			name: playlist.name,
// 			image: playlist.images[0] ? playlist.images[0].url : null,
// 			id: playlist.id,
// 		})
// 	})
// 	const playlistTrackPromises: Promise<Response>[] = userPlaylistsJson.items.map((playlist) => {
// 		const tracksURL = playlist.tracks.href
// 		const fields = "items(track(name,artists(name)))"
// 		const tracksURLWithQuery = tracksURL +
// 			"?fields=" + fields +
// 			"&limit=20"
// 		return fetch(tracksURLWithQuery, spotifyFetchOptions)
// 	})
// 	const allTrackResponses = await Promise.allSettled(playlistTrackPromises)
// 	const allTrackParsePromises = allTrackResponses.map((result) => {
// 		if (result.status === "fulfilled") {
// 			return result.value.json()
// 		} else {
// 			return null
// 		}
// 	})
// 	const allParsedTracksResults = await Promise.allSettled(allTrackParsePromises)
// 	// const allParsedTracks = allParsedTracksResults.map((result) => {
// 	// 	if (result.status === "fulfilled") {
// 	// 		return result.value
// 	// 	} else {
// 	// 		return null
// 	// 	}
// 	// })
// 	allParsedTracksResults.forEach((result, index) => {
// 		if (result.status === "fulfilled") {
// 			userPlaylists[index]["tracks"] = result.value.items.map((item) => {
// 				return {
// 					name: item.track.name,
// 					artists: item.track.artists.map((artist) => artist.name).join(", ")
// 				}
// 			})
// 		}
// 	})

// 	userPlaylists.sort((a, b) => {
// 		const nameA = a.name.toUpperCase()
// 		const nameB = b.name.toUpperCase()
// 		if (nameA < nameB) {
// 			return -1
// 		}
// 		if (nameA > nameB) {
// 			return 1
// 		}
// 		return 0
// 	})

// 	return userPlaylists
// }

export default SpotifyPlaylists
