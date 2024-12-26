import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import Experience from 'core/Experience.js'
import { Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import gsap from 'gsap'
import { NearestFilter } from 'three'

export default class Paper {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources

		this.#createModel()
		this.#createMaterial()
		if (this.experience.debug.active) this.#createDebug()
	}

	#createModel() {
		this.model = this.resources.items.paperModel.scene.clone()
		this.model.name = 'paper'
	}

	#createMaterial() {
		const vatTexture = this.resources.items.paperPositionTexture
		const normalsTexture = this.resources.items.paperNormalsTexture

		this.material = extendMaterial(
			new MeshStandardMaterial({
				side: 2,
			}),
			{
				uniforms: {
					uTime: { value: 0.0 },
					posTexture: { value: vatTexture },
					normalsTexture: { value: normalsTexture },
					totalFrames: { value: 130 },
					fps: { value: 60 },
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
                    varying vec3 vPosNormal;
                `,
					project_vertex: `
                    float frame = mod(uTime * fps, totalFrames) / totalFrames ;

                    // get the position from the texture
                    float numWraps = 2.;
                    vec4 texturePos = texture(posTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps));
                    vec4 textureNormal = texture(normalsTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps)) * 2.0 - 1.0;
					vPosNormal = textureNormal.xzy;
                    // translate the position
                    vec4 translated = vec4(position + texturePos.xzy, 1.0);
                    vec4 mvPosition = modelViewMatrix * translated;
                    gl_Position = projectionMatrix * mvPosition;
                `,
				},
				fragmentShader: {
					common: `
					#include <common>
					varying vec3 vPosNormal;
				`,
					normal_fragment_begin: `
                    float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
	#ifdef FLAT_SHADED
		vec3 fdx = dFdx( vViewPosition );
		vec3 fdy = dFdy( vViewPosition );
		vec3 normal = normalize( cross( fdx, fdy ) );
	#else
		vec3 normal = normalize( vPosNormal );
		#ifdef DOUBLE_SIDED
			normal *= faceDirection;
		#endif
	#endif
	#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
		#ifdef USE_TANGENT
			mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
		#else
			mat3 tbn = getTangentFrame( - vViewPosition, normal,
			#if defined( USE_NORMALMAP )
				vNormalMapUv
			#elif defined( USE_CLEARCOAT_NORMALMAP )
				vClearcoatNormalMapUv
			#else
				vUv
			#endif
			);
		#endif
		#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
			tbn[0] *= faceDirection;
			tbn[1] *= faceDirection;
		#endif
	#endif
	#ifdef USE_CLEARCOAT_NORMALMAP
		#ifdef USE_TANGENT
			mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
		#else
			mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
		#endif
		#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
			tbn2[0] *= faceDirection;
			tbn2[1] *= faceDirection;
		#endif
	#endif
	vec3 nonPerturbedNormal = normal;
                `,
					// 	dithering_fragment: `
					//     #include <dithering_fragment>
					//     gl_FragColor = vec4(normalize(vPosNormal), 1.);
					// `,
				},
			}
		)

		this.model.traverseVisible((child) => {
			if (child.isMesh) {
				child.material = this.material
			}
		})

		requestAnimationFrame(() => {
			gsap.to(this.material.userData.shader.uniforms.uTime, {
				duration: 129 / 60,
				value: 129 / 60,
			})
		})
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}
}
