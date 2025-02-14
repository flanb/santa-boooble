import gsap from 'gsap'
import { displayButton } from './rive'

const bigTitleElement = document.querySelector('.big-title')
const titlesContainer = document.querySelector('.big-title .titles')
const titles = Array.from(titlesContainer.children)
titles.forEach((title) => {
	// gsap.set(title, {
	// 	visibility: 'hidden',
	// })
	const letters = title.textContent.split('')
	title.innerHTML = ''
	letters.forEach((letter) => {
		const span = document.createElement('span')
		if (letter !== ' ') {
			span.style.display = 'inline-block'
		}
		span.style.opacity = 0
		span.textContent = letter
		title.appendChild(span)
	})
})

const statusElement = document.querySelector('.status')

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
let step = 0
export async function createTitle() {
	await delay(1000)
	const reverseAnim1 = animateTitle(step)
	animateStatus(step)
	step++
	await delay(1000)
	await reverseAnim1.play()
	const reverseAnim2 = animateTitle(step)
	animateStatus(step)
	step++
	await delay(2500)
	await reverseAnim2.play()
	const reverseAnim3 = animateTitle(step)
	animateStatus(step)
	await delay(2500)
	reverseAnim3.play()
	animateClipPath()

	window.experience.scene.enablePhysics = true

	await delay(2000)
	window.experience.scene.enableMouseCollider()
}

function animateClipPath() {
	gsap.set(bigTitleElement, {
		pointerEvents: 'none',
	})
	gsap.to(bigTitleElement, {
		maskSize: '200%',
		duration: 2,
		ease: 'power2.in',
		onComplete: () => {
			gsap.set(bigTitleElement, {
				display: 'none',
			})
		},
	})
}

function animateStatus(index) {
	const status = statusElement.children[index]
	gsap.to(statusElement.children, {
		width: 40,
		duration: 0.5,
	})
	gsap.to(status, {
		width: 60,
		duration: 0.5,
	})
}

function animateTitle(index) {
	const title = titles[index]
	// gsap.set(title, {
	// 	visibility: 'visible',
	// })
	gsap.fromTo(
		title.children,
		{
			y: 50,
			opacity: 0,
		},
		{
			opacity: 1,
			y: 0,
			stagger: 0.05,
		},
	)

	return gsap
		.to(title.children, {
			opacity: 0,
			y: -50,
			stagger: 0.05,
			onComplete: () => {
				// gsap.set(title, {
				// 	visibility: 'hidden',
				// })
			},
		})
		.pause()
}
