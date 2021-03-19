export async function getYoutubeSearchResults(query) {
	const queryParams = new URLSearchParams(query)
	const maxResults = queryParams.has("maxResults") ? parseInt(queryParams.get("maxResults")) : 5
	const q = queryParams.get("q")
	if (!q) {
		throw new Error("No search terms provided")
	}
	const type = "video"

	const fetchParams = new URLSearchParams({
		key: process.env.youtubeApiKey,
		part: "snippet",
		maxResults: maxResults.toString(),
		q: q.toString(),
		type,
	})
	const youtubeSearchURL = new URL("https://www.googleapis.com/youtube/v3/search")
	youtubeSearchURL.search = fetchParams.toString()
	let fetchOptions = {
		method: "GET",
		headers: {
			"Accept": "application/json",
			// "Content-Type": "application/json",
		}
	}
	let response = await fetch(youtubeSearchURL.href, fetchOptions)
		.then((res) => {if (!res.ok) {
			const error = new Error()
			throw error
		} else {
			return res.json()
		}})

	const videos = response.items.map((item) => {
		return {
			title: item.snippet.title,
		}
	})

	return { videos }
}

