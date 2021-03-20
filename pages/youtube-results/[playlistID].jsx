import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import FormControl from "react-bootstrap/FormControl"
import Image from "react-bootstrap/Image"
import InputGroup from "react-bootstrap/InputGroup"
import Jumbotron from "react-bootstrap/Jumbotron"
import Navbar from "react-bootstrap/Navbar"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import Table from "react-bootstrap/Table"
import { getSomePlaylistTracks } from "../../helpers/spotify-helpers"
import { getYoutubeSearchResults } from "../../helpers/youtube-helpers"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSWRInfinite } from "swr"
const he = require("he")

export function YoutubeResults(props) {
	const router = useRouter()
	const { playlistID } = router.query
	const totalTracks = parseInt(router.query.totalTracks)

	const [playlistName, setPlaylistName] = useState()

	const getKey = (pageIndex, previousPageData) => {
		if (previousPageData && !previousPageData.tracks) return null;

		if (pageIndex === 0) return `?playlist-tracks&id=${playlistID}`

		return `?playlist-tracks&id=${playlistID}&offset=${previousPageData.nextPageOffset}`
	}

	const fetcher = (key) => {
		return getSomePlaylistTracks(key)
			.then(trackData => trackData.tracks.map(track => {
				// console.log(track.name, track.artists)
				const params = new URLSearchParams()
				params.set("maxResults", 1)
				params.set("trackName", track.name)
				params.set("trackArtists", track.artists)
				return getYoutubeSearchResults(`?${params.toString()}`)
			}))
			.then(videoPromises => Promise.allSettled(videoPromises))
			.then(promiseResults => promiseResults.filter(result => result.status === "fulfilled").map(result => result.value.videos[0]))
	}

	const totalPages = Math.ceil(totalTracks / 100)

	const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
		getKey,
		fetcher,
		{
			initialSize: totalPages,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			revalidateWhenOffline: false,
			revalidateWhenHidden: false,
			revalidateAll: false,
			refreshInterval: 0,
			errorRetryCount: 3,
		}
	)
	// const data = [[{"id":"6o3TRzPp0go","title":"Stevie Wonder – Did I Hear You Say You Love Me","imageURL":"https://i.ytimg.com/vi/6o3TRzPp0go/default.jpg","trackName":"Did I Hear You Say You Love Me","trackArtists":"Stevie Wonder"},{"id":"BMxPsZuouY8","title":"Stevie Wonder - All i Do","imageURL":"https://i.ytimg.com/vi/BMxPsZuouY8/default.jpg","trackName":"All I Do","trackArtists":"Stevie Wonder"}]]

	let tableBody = []
	if (data) {
		console.log(JSON.stringify(data))
		data.forEach(datum => datum.map(video => 
			<tr>
				<td className="align-middle">{video.trackName}</td>
				<td className="align-middle">{video.trackArtists}</td>
				<td><Row className="align-items-center p-3"><Col><Image src={video.imageURL} thumbnail /></Col><Col>{video.title}</Col></Row></td>
			</tr>
		).forEach(array => tableBody = tableBody.concat(array)))
			
	}

	// const isEmpty = data?.[0]?.tracks.length === 0;
	// const isReachingEnd =
	// 	isEmpty || (data && data[data.length - 1]?.tracks.length < 100);
	const isReachingEnd = data !== undefined

	// const arrayOfTrackArrays = data ? data
	// 	.filter(res => res.tracks)
	// 	.map(res => res.tracks) : []
	// const tracks = [].concat(...arrayOfTrackArrays)
	// const tableData = tracks.map(track => 
	// 	<tr>
	// 		<td><strong>{track.name}</strong></td>
	// 		<td><strong>{track.artists}</strong></td>
	// 	</tr>
	// )

	const onChangePlaylistName = (e) => {
		setPlaylistName(e.target.value)
	}

	const onClickCreatePlaylist = () => {
		console.log("heya");
		let youtubePlaylistVideos = []
		data.forEach(datum => datum.map(video => video.id).forEach(array => youtubePlaylistVideos = youtubePlaylistVideos.concat(array)))
		window.sessionStorage.setItem("youtubePlaylistVideos", JSON.stringify(youtubePlaylistVideos))
		const params = new URLSearchParams({
			client_id: process.env.youtubeClientId,
			redirect_uri: "http://localhost:3000/create-youtube-playlist",
			response_type: "token",
			scope: "https://www.googleapis.com/auth/youtube",
			state: playlistName,
		})
		const authorizationURL = new URL("https://accounts.google.com/o/oauth2/v2/auth")
		authorizationURL.search = params
		window.location.assign(authorizationURL.toString())
	}

	return (
		<Container>
			<Jumbotron>
				YouTube Search Results
			</Jumbotron>
			{!isReachingEnd &&
			<div>
				<Row className="justify-content-center">
					<h5>Loading Playlist Tracks</h5>
				</Row>
				<Row className="justify-content-center">
					<Spinner animation="border" />
				</Row>
			</div>
			}
			<Table striped bordered hover className="font-weight-bold">
				<thead>
					<tr>
						<th>Song Title</th>
						<th>Artist(s)</th>
						<th>Video</th>
					</tr>
				</thead>
				<tbody className="text-center">
					{tableBody}
				</tbody>
			</Table>
			<Navbar bg="dark" fixed="bottom" className="w-100 justify-content-center">
				<InputGroup size="lg">
					<FormControl placeholder="Playlist Name" onChange={onChangePlaylistName} />
				</InputGroup>
				<Button disabled={data === undefined} onClick={onClickCreatePlaylist}>Create YouTube Playlist</Button>
			</Navbar>
		</Container>
	)
}

export default YoutubeResults
