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
import useSWR, { useSWRInfinite } from "swr"

import { getSpotifyUserPlaylists, getSomePlaylistTracks, getSpotifyAccessToken } from "../helpers/spotify-helpers"

import fetcher from "../libs/fetcher"

function TracksTable(props) {
	const { playlistID, playlistLength, isSelected } = props

	const reducedTrackCount = parseInt(process.env.spotifyReducedTrackCount)

	const getKey = (pageIndex, previousPageData) => {
		if (previousPageData && !previousPageData.tracks) return null;

		if (pageIndex === 0) return `?playlist-tracks&id=${playlistID}&limit=${reducedTrackCount}`

		return `?playlist-tracks&id=${playlistID}&limit=10&offset=${previousPageData.nextPageOffset}`
	}

	const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
		getKey,
		getSomePlaylistTracks,
		{
			initialSize: 1,
			revalidateOnFocus: false,
			revalidateAll: false
		}
	)

	const color = isSelected ? "primary" : "light"
	const arrayOfTrackArrays = data ? data.map(res => res.tracks) : []
	const tracks = [].concat(...arrayOfTrackArrays)
	const tableData = isSelected ? tracks.map(track => 
		<tr>
			<td>{track.name}</td>
			<td>{track.artists}</td>
		</tr>
	) : tracks.slice(0, reducedTrackCount).map(track =>
		<tr>
			<td>{track.name}</td>
			<td>{track.artists}</td>
		</tr>
	)

	const isLoadingInitialData = !data && !error
	const isLoadingMore =
		isLoadingInitialData ||
		(size > 1 && data && typeof data[size - 1] === "undefined")
	const allTracksLoaded = tracks.length === playlistLength

	const tracksNotShown = playlistLength - reducedTrackCount

	if (isSelected) {
		// console.log(arrayOfTrackArrays)
		// console.log(tracks)
		// console.log(JSON.stringify(data))
	}
	
	return(
		<Table striped bordered hover className="font-weight-bold">
			<thead>
				<tr>
					<th>Title</th>
					<th>Artist(s)</th>
				</tr>
			</thead>
			<tbody>
				{tableData}
				{!isSelected && tracksNotShown > 0 &&
					<tr>
						<td colSpan={2}>{`${tracksNotShown} more...`}</td>
					</tr>
				}
				{isSelected && !allTracksLoaded &&
					<tr>
						<td colSpan={2}>
							{!isLoadingMore &&
								<Button variant="light" onClick={() => setSize(size + 1)}>{"Load More"}</Button>
							}
							{isLoadingMore &&
								<Spinner animation="border" />
							}
						</td>
					</tr>
				}
			</tbody>
		</Table>
	)
}

function PlaylistCard(props) {
	const cardRef = useRef(null)
	const { playlist, index, order, isSelected, setSelectedPlaylistIndex } = props

	const [justSelected, setJustSelected] = useState(false)

	useEffect(() => {
		if (justSelected) {
			const position = cardRef.current.getBoundingClientRect()
			window.scrollTo({
				top: position.top + window.scrollY - 20,
				left: 0,
				behavior: "smooth"
			})
			setJustSelected(false)
		}
	})

	const selectPlaylist = () => {
		if (!isSelected) {
			setSelectedPlaylistIndex(parseInt(index))
			setJustSelected(true)
		}
	}

	let currentOrder = order
	if (isSelected && order % 2 === 0) {
		currentOrder = order - 2
		// currentOrder = order - 1
		// currentOrder = "first"
	}
	const color = isSelected ? "primary" : "light"
	const cardWidth = isSelected ? 12 : 6
	return(
		<Col xs={{span: 12}} lg={{span: cardWidth}} className="my-3 mx-0">
			<Card ref={cardRef} bg={color} className="h-100" onClick={() => selectPlaylist()} key={playlist.id}>
				<Card.Header className="text-center" as="h4">
					{playlist.name}
				</Card.Header>
				<Card.Body>
					<Row className="align-middle">
						<Col xs={isSelected ? {offset: 4, span: 4} : {offset: 3, span: 7}} className="px-3 py-1"><Image src={playlist.image} thumbnail /></Col>
						<Col xs={12} className="align-self-center">
							<Card.Text>
								<p>{`${playlist.totalTracks} tracks`}</p>
								<div style={{maxHeight: "500px", overflowY: "auto"}}>
									{isSelected &&
										<TracksTable 
											playlistID={playlist.id}
											playlistLength={playlist.totalTracks}
											isSelected={true}
										/>
									}
								</div>
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
	const [selectedPlaylistIndex, _setSelectedPlaylistIndex] = useState(null)
	const setSelectedPlaylistIndex = (index) => {
		// if (id === selectedPlaylist) {
		// 	_setSelectedPlaylist(null)
		// } else {
		// 	_setSelectedPlaylist(id)
		// }
		_setSelectedPlaylistIndex(index)
	}
	// const { data: playlists, error } = useSWR("api/spotify-user-playlists", fetcher)
	const { data: playlists, error } = useSWR("spotifyUserPlaylists", getSpotifyUserPlaylists)
	const selectedPlaylistID = selectedPlaylistIndex ? playlists[selectedPlaylistIndex].id : null
	const selectedPlaylistTotalTracks = selectedPlaylistIndex ? playlists[selectedPlaylistIndex].totalTracks : null
	return(
		<Container className="text-center">
			<Jumbotron>
				<h1>Choose a Playlist to Convert</h1>
			</Jumbotron>
			<Row className="m-xs-1 m-sm-2 m-md-3 m-lg-4 m-xl-5">
				{
					playlists && playlists
						.map((playlist, index) =>
							<PlaylistCard
								playlist={playlist}
								index={index}
								order={index + 1}
								isSelected={index === selectedPlaylistIndex}
								setSelectedPlaylistIndex={setSelectedPlaylistIndex}
							/>
						)
				}
			</Row>
			<Navbar bg="dark" fixed="bottom" className="w-100 justify-content-center">
				<Link href={`/youtube-results/${playlists?.[selectedPlaylistIndex]?.id}?totalTracks=${playlists?.[selectedPlaylistIndex]?.totalTracks}`}>
					<Button disabled={selectedPlaylistIndex === null}>Convert</Button>
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
