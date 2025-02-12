// import { Shader, WebGLRenderer, Material } from "three";

/**
 * @typedef {Object} Uniform
 * @property {any} value
 * @property {any} [type]
 * @property {boolean|string} [property]
 */

/**
 * @typedef {Object} ExtendOptions
 * @property {Object.<string, Uniform>} [uniforms]
 * @property {Object.<string, string>} [vertexShader]
 * @property {Object.<string, string>} [fragmentShader]
 * @property {Object.<string, string>} [defines]
 * @property {string} [lib]
 * @property {string} [name]
 */

/**
 * @typedef {Object} Proxy
 * @property {null|function(Shader, WebGLRenderer):void} userCallback
 * @property {function(Shader, WebGLRenderer):Shader} extendCallback
 */

/**
 * Extends a material with additional uniforms, shaders, and defines.
 * @param {Material} material - The material to extend.
 * @param {ExtendOptions} [options={}] - The options to extend the material with.
 * @returns {Material} The extended material.
 */
export function extendMaterial(
	material,
	{ uniforms = {}, vertexShader = {}, fragmentShader = {}, defines = {} } = {}
) {
	if (!material.userData) material.userData = {}
	material.userData.uniformsState = {}

	const proxy = {
		userCallback: null,
		extendCallback: (shader, renderer) => {
			shader.defines = { ...shader.defines, ...defines }

			Object.keys(uniforms).forEach((key) => {
				const initialValue =
					material.userData.uniformsState[key] !== undefined
						? material.userData.uniformsState[key]
						: uniforms[key].value

				shader.uniforms[key] = { value: initialValue }
			})

			Object.keys(vertexShader).forEach((key) => {
				const reg = new RegExp(`#include.+?<${key}>`)
				shader.vertexShader = shader.vertexShader.replace(reg, vertexShader[key])
			})

			Object.keys(fragmentShader).forEach((key) => {
				const reg = new RegExp(`#include.+?<${key}>`)
				shader.fragmentShader = shader.fragmentShader.replace(reg, fragmentShader[key])
			})

			Object.keys(uniforms).forEach((key) => {
				const uniform = uniforms[key]
				if (uniform.property) {
					const uniformName = typeof uniform.property === 'string' ? uniform.property : key

					material.userData.uniformsState[uniformName] = uniform.value

					Object.defineProperty(material, uniformName, {
						get() {
							return material.userData.uniformsState[uniformName]
						},
						set(value) {
							material.userData.uniformsState[uniformName] = value
							if (material.userData.shader.uniforms) {
								material.userData.shader.uniforms[key].value = value
							}
						},
					})
				}
			})

			material.userData.shader = shader

			if (proxy.userCallback) proxy.userCallback(shader, renderer)

			return shader
		},
	}

	Object.defineProperty(material, 'onBeforeCompile', {
		get() {
			return proxy.extendCallback
		},
		set(v) {
			proxy.userCallback = v
		},
	})

	return material
}

/**
 * Gets the uniform from the material.
 * @param {Material} material - The material to get the uniform from.
 * @param {string} key - The key of the uniform.
 * @returns {any} The uniform.
 */
export const getUniform = (material, key) => {
	return material.userData.shader.uniforms[key]
}

/**
 * Sets the uniform of the material.
 * @param {Material} material - The material to set the uniform of.
 * @param {string} key - The key of the uniform.
 * @param {any} value - The value to set the uniform to.
 */
export const setUniform = (material, key, value) => {
	const u = getUniform(material, key)
	if (u.value.set) {
		u.value.set(value)
	} else {
		u.value = value
	}
}
