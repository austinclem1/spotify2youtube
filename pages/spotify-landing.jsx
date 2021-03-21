import Spinner from "react-bootstrap/Spinner"
import {
	getSpotifyAccessToken,
	getSpotifyUserPlaylists
} from "../helpers/spotify-helpers"
import useSWR from "swr"

function SpotifyLanding() {
	const { data, error } = useSWR("spotifyUserPlaylists", getSpotifyUserPlaylists)

	return (
		<div>
			{data &&
				data.map((playlist) => {
					return (
						<div>
							<p>{playlist.id}</p>
							<p>{playlist.name}</p>
						{playlist.tracks.map((track) => {
							return (
								<p>{track.name}</p>
							)
						})}
						</div>)
				})
			}
			{!data &&
				<Spinner animation="border" />
			}
		</div>
	)
}

export default SpotifyLanding

