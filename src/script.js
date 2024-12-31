import Experience from 'core/Experience.js'
import createCursor from './scripts/cursor'
import createRive from './scripts/rive'
import createTitle from './scripts/title'

const experience = new Experience(document.querySelector('canvas#webgl'))

createCursor()
createRive()
createTitle()
