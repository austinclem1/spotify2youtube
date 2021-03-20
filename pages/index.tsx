import Head from "next/head"

import Container from "react-bootstrap/Container"
import Spinner from "react-bootstrap/Spinner"
import Jumbotron from "react-bootstrap/Jumbotron"

import { getSpotifyAccessToken } from "../helpers/spotify-helpers"
import { useEffect } from "react"
import { useRouter } from "next/router"


function IndexPage() {
	const router = useRouter()
	useEffect(() => {
		getSpotifyAccessToken()
			.then((accessToken) => {
				console.log(accessToken)
				if (accessToken === null) {
					router.replace("/spotify-login")
				} else {
					router.replace("/spotify-playlists")
				}
			})
	})

  return (
		<Container className="text-center">
			<Head>
				<title>Spotify2YouTube</title>
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Jumbotron>
				<h1>Spotify2YouTube Playlist Converter</h1>
			</Jumbotron>
			<h5>Checking Login Status</h5>
			<Spinner animation="border" />
		</Container>
  )
}

export default IndexPage

