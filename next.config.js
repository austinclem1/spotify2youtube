const spotifyClientId = "e9d00f9dd4f842e5af42ede328df4de7"
const spotifyClientSecret = "REDACTED FOR GITHUB"
const spotifyAuthorizationBuffer = Buffer.from(
	spotifyClientId + ":" +
	spotifyClientSecret,
	"utf-8"
)
const spotifyTokenAuthorization = spotifyAuthorizationBuffer.toString("base64")

module.exports = {
	env: {
		spotifyClientId,
		spotifyClientSecret,
		spotifyTokenAuthorization,
		spotifyReducedTrackCount: 5,
		youtubeClientId: "79554421085-160qsevi6kong1b87khn9ah3sfr773k5.apps.googleusercontent.com",
		youtubeClientSecret: "REDACTED FOR GITHUB",
		youtubeApiKey: "AIzaSyBAL6pe6co6_6Ljy20ZXzvtc9XXxMpe1TU",
	}
}
