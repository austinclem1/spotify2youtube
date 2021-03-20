import Container from "react-bootstrap/Container"
import { useEffect } from "react"


function CreateYoutubePlaylist(props) {

	useEffect(async () => {
		const url = new URL(window.location)
		const query = new URLSearchParams(url.hash.slice(1))
		const accessToken = query.get("access_token")
		const playlistName = query.get("state")
		console.log(window.location.search)
		console.log(query.toString())

		const videoIds = JSON.parse(window.sessionStorage.getItem("youtubePlaylistVideos"))
		console.log(JSON.stringify(videoIds))

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
		console.log(JSON.stringify(playlistResponse))

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
			console.log(JSON.stringify(insertResponse))
		}
	}, []
)

	return(
		<Container className="text-center">
			<h3>Your new YouTube playlist has been created!</h3>
		</Container>
	)
}

export default CreateYoutubePlaylist
