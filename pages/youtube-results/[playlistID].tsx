import Container from "react-bootstrap/Container"
import Jumbotron from "react-bootstrap/Jumbotron"
import Row from "react-bootstrap/Row"
import Spinner from "react-bootstrap/Spinner"
import Table from "react-bootstrap/Table"
import { getSomePlaylistTracks } from "../../helpers/spotify-helpers"
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
		getSomePlaylistTracks(key)
	}

	const totalPages = Math.ceil(totalTracks / 100)

	const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
		getKey,
		// getSomePlaylistTracks,
		fetcher,
		{
			initialSize: totalPages,
			revalidateOnFocus: false,
			revalidateAll: false
		}
	)

	const isEmpty = data?.[0]?.tracks.length === 0;
	const isReachingEnd =
		isEmpty || (data && data[data.length - 1]?.tracks.length < 100);

	const arrayOfTrackArrays = data ? data
		.filter(res => res.tracks)
		.map(res => res.tracks) : []
	const tracks = [].concat(...arrayOfTrackArrays)
	const tableData = tracks.map(track => 
		<tr>
			<td><strong>{track.name}</strong></td>
			<td><strong>{track.artists}</strong></td>
		</tr>
	)

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
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Title</th>
						<th>Artist(s)</th>
					</tr>
				</thead>
				<tbody>
					{tableData}
				</tbody>
			</Table>
		</Container>
	)
}

export default YoutubeResults
