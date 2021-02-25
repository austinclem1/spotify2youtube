import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Image from "react-bootstrap/Image"
import Jumbotron from "react-bootstrap/Jumbotron"
import Link from "next/link"
import ListGroup from "react-bootstrap/ListGroup"
import Navbar from "react-bootstrap/Navbar"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import React, { useEffect, useRef, useState } from "react"
import useSWR from "swr"

import fetcher from "../libs/fetcher"

import { getSpotifyUserAccessToken } from "../helpers/spotify-helpers"

export async function getServerSideProps(context) {
	// TODO: this should probably be on a login landing page,
	// if there's an authorization code in the query, always use it
	// to get tokens and store them in cookie
	// Maybe this page can always just attempt to use a refresh token
	// from cookie
	let { accessToken, refreshToken } = context.req.cookies
	if (refreshToken) {
		[accessToken, refreshToken] = await getSpotifyUserAccessToken({
			authentication: refreshToken,
			useAuthorizationCode: false,
			req: context.req,
			res: context.res
		})
	} else {
		const authorizationCode = context.query.code;
		if (authorizationCode) {
			[accessToken, refreshToken] = await getSpotifyUserAccessToken({
				authentication: authorizationCode,
				useAuthorizationCode: true,
				req: context.req,
				res: context.res
			})
		}
	}

	// If we have no access token at this point, we should give up and redirect
	// to login page
	if (!accessToken) {
		return {
			redirect: {
				permanent: false,
				destination: "/"
			}
		}
	}

	return {
		props: {
		}
	}
}

function TrackList(props) {
	const { tracks, isSelected } = props
	let numTracksShown = isSelected ? tracks.length : process.env.spotifyReducedTrackCount
	const color = isSelected ? "primary" : "light"

	if (isSelected) {
		return(
			<ListGroup>
				<ListGroup horizontal>
					<ListGroup.Item variant={"dark"} className="p-1 w-50"><strong>Title</strong></ListGroup.Item>
					<ListGroup.Item variant={"dark"} className="p-1 w-50"><strong>Artist</strong></ListGroup.Item>
				</ListGroup>
				{tracks.map((track) => 
					<ListGroup horizontal>
						<ListGroup.Item variant={color} className="p-1 w-50">{track.name}</ListGroup.Item>
						<ListGroup.Item variant={color} className="p-1 w-50">{track.artists}</ListGroup.Item>
					</ListGroup>
				)}
			</ListGroup>
		)
	} else {
		return(
			<ListGroup>
				{tracks.slice(0, numTracksShown).map((track) => 
					<ListGroup.Item variant={color} className="p-1">{track.name}</ListGroup.Item>
				)}
				{tracks.length > numTracksShown + 1 &&
					<ListGroup.Item variant={color} className="p-1">{tracks.length - numTracksShown} More...</ListGroup.Item>
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
				behavior: "smooth"
			})
		}
	})
	let currentOrder = order
	if (isSelected && order % 2 === 0) {
		currentOrder -= 2
	}
	const color = isSelected ? "primary" : "light"
	const cardWidth = isSelected ? 12 : 6
	return(
		<Col xs={{span: 12, order: order}} lg={{span: cardWidth, order: currentOrder}} className="my-3 mx-0">
			<Card ref={cardRef} bg={color} className="h-100" onClick={() => setSelectedPlaylist(playlist.id)} key={playlist.id}>
				<Card.Header className="text-center" as="h4">
					<strong>{playlist.name}</strong>
				</Card.Header>
				<Card.Body>
					<p>Current order: {currentOrder}</p>
					<Row className="align-middle">
						<Col xs={4}><Image src={playlist.image} fluid /></Col>
						<Col xs={8} className="align-self-center">
							<Card.Text>
								<TrackList 
									tracks={playlist.tracks}
									isSelected={isSelected}
								/>
							</Card.Text>
						</Col>
					</Row>
					<a className="stretched-link" role="button" />
				</Card.Body>
		</Card>
	</Col>
	)
}

// function SpotifyPlaylists({ userPlaylists }) {
function SpotifyPlaylists() {
	const [selectedPlaylist, _setSelectedPlaylist] = useState(null)
	const setSelectedPlaylist = (id) => {
		if (id === selectedPlaylist) {
			_setSelectedPlaylist(null)
		} else {
			_setSelectedPlaylist(id)
		}
	}
	const { data: playlists, error } = useSWR("api/spotify-user-playlists", fetcher)
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
