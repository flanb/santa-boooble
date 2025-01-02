import Experience from 'core/Experience.js'
import createCursor from './scripts/cursor'
import createRive from './scripts/rive'
import createTitle from './scripts/title'

const experience = new Experience(document.querySelector('canvas#webgl'))

createCursor()
createRive()
createTitle()

const permissionButton = document.querySelector('.permission')
if (permissionButton) {
	permissionButton.addEventListener('click', () => {
		experience.gimbal.enable()
		permissionButton.remove()
		document.querySelector('.permission-container').remove()
	})
}

const paperContent = document.querySelector('.paper .content')
const paperAuthor = document.querySelector('.paper .author')

if (paperContent && paperAuthor) {
	const url = new URL(location.href)
	const message = url.searchParams.get('m')
	const author = url.searchParams.get('a')
	if (message && author) {
		paperContent.innerText = atob(message)
		paperAuthor.innerText = atob(author)
	}
}
