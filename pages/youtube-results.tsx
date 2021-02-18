import Container from 'react-bootstrap/Container'
import Jumbotron from 'react-bootstrap/Jumbotron'
import { useEffect } from 'react'

export function YoutubeResults(props) {
	useEffect(() => {
		console.log(window.sessionStorage.getItem('thingy'))
	})
	return (
		<Container>
			<Jumbotron>
				YouTube Search Results
			</Jumbotron>
			<p>Hey</p>
		</Container>
	)
}

export default YoutubeResults
