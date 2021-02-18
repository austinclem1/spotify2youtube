import Cookies from 'cookies'

export async function getServerSideProps(context) {
	const cookies = new Cookies(context.req, context.res)
	cookies.set('thingy', 'hi there')
	console.log(cookies.get('thingy'))

	return {
		props: {}
	}
}

function CookieTest() {
	return (
		<p> dis a test</p>
	)
}

export default CookieTest
