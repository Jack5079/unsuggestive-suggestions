const browser = globalThis.browser ?? globalThis.chrome
const reactRoot = document.getElementById("react-root")

// This function taken from Control Panel for Twitter
function getState() {
	let wrapped =
		reactRoot.firstElementChild.wrappedJSObject || reactRoot.firstElementChild
	let reactPropsKey = Object.keys(wrapped).find((key) =>
		key.startsWith("__reactProps")
	)
	if (reactPropsKey) {
		let state =
			wrapped[reactPropsKey].children?.props?.children?.props?.store?.getState()
		if (state) return state
		console.warn("React state not found")
	} else {
		console.warn("React prop key not found")
	}
}

/**
 * @returns {string | undefined}
 */
function getUserID() {
	// Extract path from the URL
	const path = window.location.pathname.split("/").filter(Boolean)

	// Profile page
	if (path.length === 1) {
		return Object.values(getState().entities.users.entities).find(
			(user) => user.screen_name === path[0]
		)?.id_str
	}

	// Status page
	if (path.length === 3 && path[1] === "status") {
		return getState().entities.tweets.entities[path[2]].user
	}
}

// https://chromium.googlesource.com/chromium/src/+/9c00256bc926a519e0e75b7e8efe35968e27e5f1
async function main() {
	let { userIdsToHide = [] } = await browser.storage.sync.get("userIdsToHide")
	new MutationObserver(function (mutations) {
		if (document.title === "X") return
		const id = getUserID()
		if (userIdsToHide.includes(id)) document.title = "X"
	}).observe(document.querySelector("title"), {
		subtree: true,
		characterData: true,
		childList: true,
	})

	// Hide/unhide UI
	new MutationObserver(function (mutations) {
		const dropdown = document
			.getElementById("layers")
			?.querySelector("[data-testid=Dropdown]:last-of-type")
		if (!dropdown) return
		if (!dropdown.querySelector("[href='/i/lists/add_member']")) return
		if (dropdown.querySelector(".hide-user")) return
		const id = getUserID()
		const unhide = userIdsToHide.includes(id)
		const clone = dropdown.lastChild.cloneNode(true)
		const label = clone.querySelector("span")
		label.classList.add("hide-user")
		label.innerText = label.innerText.replace(
			"Report",
			unhide ? "Unhide" : "Hide"
		)
		clone.addEventListener("click", async () => {
			if (userIdsToHide.includes(id)) {
				userIdsToHide = userIdsToHide.filter((userId) => userId !== id)
			} else {
				userIdsToHide.push(id)
				document.title = "X"
			}
			await chrome.storage.sync.set({ userIdsToHide })
			dropdown.remove() // Not the right way to do this, I need to figure out how to trigger click outside or better yet whatever the fuck the normal buttons do
			console.log(userIdsToHide)
		})
		dropdown.appendChild(clone)
	}).observe(reactRoot, {
		// Insane, but works
		subtree: true,
		childList: true,
	})
}

main().catch(console.error)
