import Container from "react-bootstrap/Container"
import Jumbotron from "react-bootstrap/Jumbotron"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import Table from "react-bootstrap/Table"
import { getSomePlaylistTracks } from "../../helpers/spotify-helpers"
import { getYoutubeSearchResults } from "../../helpers/youtube-helpers"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSWRInfinite } from "swr"

export function YoutubeResults(props) {
	const router = useRouter()
	const { playlistID } = router.query
	const totalTracks = parseInt(router.query.totalTracks)

	const getKey = (pageIndex, previousPageData) => {
		if (previousPageData && !previousPageData.tracks) return null;

		if (pageIndex === 0) return `?playlist-tracks&id=${playlistID}`

		return `?playlist-tracks&id=${playlistID}&offset=${previousPageData.nextPageOffset}`
	}

	const fetcher = (key) => {
		// const trackData = await getSomePlaylistTracks(key)
		// TODO proceed by getting first youtube search result here?
		// const youtubeSearchPromises = trackData.tracks.map(track => {
		// 	const q = track.name + " " + track.artists
		// 	const maxResults = 1
		// 	return getYoutubeSearchResults(`?q=${q}&maxResults=${maxResults}`)
		// })
		// return youtubeSearchPromises
		return getSomePlaylistTracks(key)
			// .then(trackData => trackData.tracks.map(track => {
			.then(trackData => trackData.tracks.slice(0, 2).map(track => {
				const q = track.name + " " + track.artists
				const maxResults = 1
				return getYoutubeSearchResults(`?q=${q}&maxResults=${maxResults}`)
			}))
			// .then(trackData => {
			// 	const q = trackData.tracks[0].name + " " + trackData.tracks[0].artists
			// 	const maxResults = 1
			// 	return getYoutubeSearchResults(`?q=${q}&maxResults=${maxResults}`)
			// })
			.then(videoPromises => Promise.allSettled(videoPromises))
			.then(promiseResults => promiseResults.filter(result => result.status === "fulfilled").map(result => result.value.videos[0]))
			// .then(trackData => getYoutubeSearchResults(`?q=${trackData.tracks[0].name}&maxResults=1`))
			// .then(videos => console.log(videos))
		// const youtubeSearchPromise = trackData.tracks.slice(0, 1).map(track => {
		// 	const q = track.name + " " + track.artists
		// 	const maxResults = 1
		// 	console.log(track)
		// 	return getYoutubeSearchResults(`?q=${q}&maxResults=${maxResults}`)
		// })
		// const result = await youtubeSearchPromise

		// return result
	}

	const totalPages = Math.ceil(totalTracks / 100)

	const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
		getKey,
		// getSomePlaylistTracks,
		fetcher,
		{
			initialSize: totalPages,
			revalidateOnFocus: false,
			revalidateAll: false,
			errorRetryCount: 3,
		}
	)

	if (data) {
		console.log(JSON.stringify(data))
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
			{data?.[0] !== undefined &&
			<div>
			</div>
			}
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Title</th>
						<th>Artist(s)</th>
					</tr>
				</thead>
				<tbody>
				</tbody>
			</Table>
		</Container>
	)
}

export default YoutubeResults
