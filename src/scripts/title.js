import gsap from 'gsap'
import { displayButton } from './rive'

const titlesContainer = document.querySelector('.big-title')
const titles = titlesContainer.children
let currentTitle = 0
let isFinished = false
export default async function createTitle() {
	gsap.set(titles, { display: 'none' })
	gsap.set(titles[currentTitle], { display: '' })

	await gsap.fromTo(
		titles[currentTitle],
		{
			x: '100%',
		},
		{
			x: '-100%',
			duration: 2,
			delay: 1,
			ease: 'power1.in',
		}
	)

	currentTitle++
	gsap.set(titles, { display: 'none' })
	gsap.set(titles[currentTitle], { display: '' })

	await gsap.fromTo(
		titles[1],
		{
			x: '100%',
		},
		{
			x: '-100%',
			duration: 2,
			ease: 'power1.in',
		}
	)
	currentTitle++
	gsap.set(titles, { display: 'none' })
	gsap.set(titles[currentTitle], { display: '' })

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	)
	if (isMobile) {
		titles[currentTitle].innerHTML = 'SANTA BOOOBLE'
	}

	await gsap.fromTo(
		titles[currentTitle],
		{
			x: '100%',
		},
		{
			x: '0',
			duration: 2,
			ease: 'power1.inOut',
			onComplete: () => {
				// replace one o by space
				const before = 'SANTA BOOOBLE'
				if (before === titles[currentTitle].innerHTML) {
					displayButton()
					return
				}
				titles[currentTitle].innerHTML = titles[currentTitle].innerHTML.replace('O', '')
				const interval = setInterval(() => {
					titles[currentTitle].innerHTML = titles[currentTitle].innerHTML.replace('O', '')
					if (before === titles[currentTitle].innerHTML) {
						clearInterval(interval)
						displayButton()
					}
				}, 100)
			},
		}
	)
}

export async function pushItTitle() {
	gsap.to(titles[currentTitle], {
		x: '-110%',
		duration: 1,
	})

	currentTitle++
	gsap.set(titles, { display: 'none', delay: 0.5 })
	gsap.set(titles[currentTitle], { display: '', delay: 0.5 })

	await gsap.fromTo(
		titles[currentTitle],
		{
			x: '120%',
		},
		{
			x: '0',
			duration: 1,
			delay: 0.5,
			ease: 'power1.in',
		}
	)
}

export function comeOnTitle() {
	if (currentTitle === titles.length - 1) {
		return
	}
	currentTitle++
	gsap.set(titles, { display: 'none' })
	gsap.set(titles[currentTitle], { display: '' })
}
