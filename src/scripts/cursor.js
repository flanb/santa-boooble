export default function createCursor() {
	const cursor = document.querySelector('.cursor-container')
	cursorLerp(cursor)
}

function cursorLerp(cursor) {
	let mouseX = 0,
		mouseY = 0,
		cursorX = 0,
		cursorY = 0
	const speed = 0.2

	addEventListener('mousemove', (event) => {
		mouseX = event.clientX
		mouseY = event.clientY
	})

	function animate() {
		cursorX += (mouseX - cursorX) * speed
		cursorY += (mouseY - cursorY) * speed
		cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`
		requestAnimationFrame(animate)
	}

	animate()
}
