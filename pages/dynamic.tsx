import { GetStaticProps, GetServerSideProps } from 'next'

// runs on server
export const getServerSideProps: GetServerSideProps = async (context) => {

	return {
		props: {
			myFavNum: Math.random()
		}
	}
}

export default function Dynamic(props) {
	return <h1>Dynamic Number - {props.myFavNum}</h1>
}
