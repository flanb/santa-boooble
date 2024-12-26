import Experience from 'core/Experience.js'

const experience = new Experience(document.querySelector('canvas#webgl'))

function customCursor() {
	const cursor = document.querySelector('.cursor-container')

	document.addEventListener('mousemove', (event) => {
		cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
	})
}

customCursor()
