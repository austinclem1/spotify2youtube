const spotifyClientId = 'e9d00f9dd4f842e5af42ede328df4de7'
const spotifyClientSecret = '852e05198509492195cd23f45c173c4d'
const spotifyAuthorizationBuffer = Buffer.from(
	spotifyClientId + ':' +
	spotifyClientSecret,
	'utf-8'
)
const spotifyTokenAuthorization = spotifyAuthorizationBuffer.toString('base64')

module.exports = {
	env: {
		spotifyClientId,
		spotifyClientSecret,
		spotifyTokenAuthorization,
		spotifyReducedTrackCount: 5,
		youtubeClientId: '543052497909-vovj9kgvse95tg5ufseoc1go31cidfnl.apps.googleusercontent.com',
		youtubeClientSecret: 'OU89BpNFpZynNK4PPE8mkwZD',
		youtubeApiKey: 'AIzaSyBAL6pe6co6_6Ljy20ZXzvtc9XXxMpe1TU',
	}
}
