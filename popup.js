const browser = globalThis.browser ?? globalThis.chrome

browser.storage.sync.get("userIdsToHide").then(({ userIdsToHide = [] }) => {
	for (const userId of userIdsToHide) {
		const li = document.createElement("li")
		li.innerHTML = `<a href="https://x.com/i/user/${userId}">${userId}</a>`
		document.querySelector("ul").append(li)
	}
	if (userIdsToHide.length === 0) {
		const li = document.createElement("li")
		li.innerHTML = `No users hidden`
		document.querySelector("ul").append(li)
	}
})
