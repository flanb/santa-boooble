import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import Experience from 'core/Experience.js'
import {
	Box3,
	CanvasTexture,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PlaneGeometry,
	Quaternion,
	Shape,
	ShapeGeometry,
	Vector3,
} from 'three'
import gsap from 'gsap'
import { RepeatWrapping } from 'three'
import { displayPaperText } from '@/script.js'
import wordWrapper from 'word-wrapper'

export default class Paper {
	constructor(parent) {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.parent = parent

		this.#createModel()
		// this.#createMaterial()
		if (this.experience.debug.active) this.#createDebug()
	}

	#createModel() {
		this.model = this.resources.items.paperModel.scene.children[0].clone()
		this.model.name = 'paper'
		this.model.class = this
		this.model.rotation.y = Math.PI / 2
		this.model.position.set(0, 2.1, 0)

		this.parent.model.add(this.model)
	}

	#createMaterial() {
		const vatTexture = this.resources.items.paperPositionTexture
		const normalsTexture = this.resources.items.paperNormalsTexture
		const colorTexture = this.resources.items.paperColorTexture
		const normalMapTexture = this.resources.items.paperNormalMapTexture
		normalMapTexture.repeat.set(2, 1)
		normalMapTexture.wrapS = normalMapTexture.wrapT = RepeatWrapping
		const roughnessTexture = this.resources.items.paperRoughnessTexture

		const canvasTexture = new CanvasTexture(document.getElementById('paper'))
		canvasTexture.flipY = false
		window.canvasTexture = canvasTexture
		this.material = extendMaterial(
			new MeshStandardMaterial({
				side: 2,
				map: colorTexture,
				color: 0xffffff,
				normalMap: normalMapTexture,
				roughnessMap: roughnessTexture,
			}),
			{
				defines: { USE_UV: '' },
				uniforms: {
					uTime: { value: 0.3 },
					posTexture: { value: vatTexture },
					normalsTexture: { value: normalsTexture },
					totalFrames: { value: 130 },
					fps: { value: 60 },
					textTexture: { value: canvasTexture },
				},
				vertexShader: {
					common: `
                    #include <common>
                    attribute vec2 uv1;
                    uniform float uTime;
                    uniform float totalFrames;
                    uniform float fps;
                    uniform sampler2D posTexture;
                    uniform sampler2D normalsTexture;
                `,
					project_vertex: `
                    float frame = mod(uTime * fps, totalFrames) / totalFrames ;

                    // get the position from the texture
                    float numWraps = 2.;
                    vec4 texturePos = texture(posTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps));
                    vec4 textureNormal = texture(normalsTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps)) * 2.0 - 1.0;
					vNormal = textureNormal.xzy;
                    // translate the position
                    vec4 translated = vec4(position + texturePos.xzy, 1.0);
                    vec4 mvPosition = modelViewMatrix * translated;
                    gl_Position = projectionMatrix * mvPosition;
                `,
				},
				fragmentShader: {
					common: `
					#include <common>
					uniform sampler2D textTexture;
				`,
					dithering_fragment: `
					#include <dithering_fragment>
					vec4 textColor = texture(textTexture, vUv);
					gl_FragColor.rgb *= (1. - textColor.rgb *0.9);
				`,
				},
			},
		)

		this.model.traverseVisible((child) => {
			if (child.isMesh) {
				child.material = this.material
			}
		})
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}

	play() {
		let z = 0
		if (this.experience.sizes.width < 768) {
			z = this.experience.camera.instance.position.z - 6
		} else {
			z = this.experience.camera.instance.position.z - 3
		}
		this.scene.attach(this.model)
		gsap.to(this.model.position, {
			duration: 2,
			ease: 'power2.inOut',
			z,
			x: 0,
			y: -0.25,
			onComplete: () => {
				this.letter()

				// displayWriteButton()
			},
		})

		gsap.to(this.model.rotation, {
			duration: 2,
			ease: 'power2.inOut',
			y: Math.PI * 2 + Math.PI / 2,
			x: 0,
			z: 0,
		})
	}

	letter() {
		const letterBbox = new Box3().setFromObject(this.model)
		// const letterShape = new Shape()
		const size = letterBbox.getSize(new Vector3()).addScalar(-0.1)
		// const radius = 0.02
		//
		// letterShape.moveTo(-size.x / 2 + radius, -size.y / 2)
		// letterShape.lineTo(size.x / 2 - radius, -size.y / 2)
		// letterShape.quadraticCurveTo(size.x / 2, -size.y / 2, size.x / 2, -size.y / 2 + radius)
		// letterShape.lineTo(size.x / 2, size.y / 2 - radius)
		// letterShape.quadraticCurveTo(size.x / 2, size.y / 2, size.x / 2 - radius, size.y / 2)
		// letterShape.lineTo(-size.x / 2 + radius, size.y / 2)
		// letterShape.quadraticCurveTo(-size.x / 2, size.y / 2, -size.x / 2, size.y / 2 - radius)
		// letterShape.lineTo(-size.x / 2, -size.y / 2 + radius)
		// letterShape.quadraticCurveTo(-size.x / 2, -size.y / 2, -size.x / 2 + radius, -size.y / 2)

		// const letterGeometry = new ShapeGeometry(letterShape)
		const letterGeometry = new PlaneGeometry(size.x, size.y)
		// const canvas = document.createElement('canvas')
		// const context = canvas.getContext('2d')
		// canvas.width = size.x * 1024
		// canvas.height = size.y * 1024
		// context.fillStyle = 'white'
		// context.fillRect(0, 0, canvas.width, canvas.height)
		// context.fillStyle = 'black'
		// context.font = 'italic 48px Pangaia'
		// context.textAlign = 'center'
		// context.textBaseline = 'middle'
		//
		// const text = wordWrapper("Love isn't something you find, it's something that finds you.", {
		// 	width: 32,
		// })
		//
		// const lines = text.split('\n')
		// const lineHeight = 48
		// const totalTextHeight = lines.length * lineHeight
		// const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2
		// lines.forEach((line, index) => {
		// 	context.fillText(line, canvas.width / 2, startY + index * lineHeight)
		// })
		const canvasTexture = new CanvasTexture(document.getElementById('paper'))
		// canvasTexture.flipY = false
		window.canvasTexture = canvasTexture
		displayPaperText()

		// document.body.appendChild(canvas)
		// canvas.style.position = 'absolute'
		// canvas.style.zIndex = 1000

		const letterMaterial = new MeshBasicMaterial({
			map: canvasTexture,
		})
		this.letterMesh = new Mesh(letterGeometry, letterMaterial)
		this.letterMesh.position.copy(this.model.position)
		this.scene.add(this.letterMesh)

		gsap.to(this.model.position, {
			y: -2,
			duration: 2,
			delay: 0.1,
		})
		gsap.to(this.letterMesh.position, {
			z: '+=1',
			duration: 1,
			delay: 1.5,
			ease: 'power2.inOut',
		})

		window.flyLetter = this.fly
	}

	fly = () => {
		gsap.to(this.letterMesh.position, {
			duration: 2,
			ease: 'power2.in',
			y: 2,
		})
		gsap.to(this.letterMesh.rotation, {
			duration: 2,
			ease: 'power2.in',
			z: Math.PI / 4,
		})
	}
}
