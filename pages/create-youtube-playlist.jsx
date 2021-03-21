import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Link from "next/link"
import { useEffect } from "react"


function CreateYoutubePlaylist(props) {

	useEffect(async () => {
		const url = new URL(window.location)
		const query = new URLSearchParams(url.hash.slice(1))
		const accessToken = query.get("access_token")
		const playlistName = query.get("state")

		const videoIds = JSON.parse(window.sessionStorage.getItem("youtubePlaylistVideos"))

		const fetchOptions = {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Authorization": "Bearer " + accessToken,
			},
			body: JSON.stringify({
				snippet: {
					title: playlistName
				}
			})
		}

		const youtubeCreatePlaylistURL = new URL(`https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&key=${process.env.youtubeApiKey}`)
		const playlistResponse = await fetch(youtubeCreatePlaylistURL.toString(), fetchOptions)
			.then(res => res.json())
		const playlistId = playlistResponse.id

		const youtubeInsertVideoURL = new URL(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&key=${process.env.youtubeApiKey}`)
		for (let i = 0; i < videoIds.length; i++) {
			const videoId = videoIds[i]
			const insertFetchOptions = {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"Authorization": "Bearer " + accessToken,
				},
				body: JSON.stringify({
					snippet: {
						playlistId,
						position: i,
						resourceId: {
							kind: "youtube#video",
							videoId
						}
					}
				})
			}
			const insertResponse = await fetch(youtubeInsertVideoURL.toString(), insertFetchOptions)
				.then(res => res.json())
		}
	}, []
)

	return(
		<Container className="text-center p-5">
			<Row className="align-items-center">
				<Col>
					<h3>Your new YouTube playlist has been created!</h3>
					<Link href={"/spotify-playlists"}>
						<Button>Return to Spotify playlist selection</Button>
					</Link>
				</Col>
			</Row>
		</Container>
	)
}

export default CreateYoutubePlaylist
