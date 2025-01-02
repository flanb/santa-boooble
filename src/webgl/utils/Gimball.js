import { Euler, MathUtils, Object3D, Quaternion, Vector3 } from 'three'

export default class Gimbal {
	quaternion = new Quaternion()
	quatOrigin = new Quaternion()
	axisUp = new Vector3(0, 1, 0)
	axisFwd = new Vector3(0, 0, 1)
	vectorUp = new Vector3()
	vectorFwd = new Vector3()
	sensorRotations = new Object3D()
	orientationData = { alpha: 0, beta: 0, gamma: 0 }
	needsUpdate = false
	recallRequested = true
	eulerOrigin = new Euler(Math.PI / 2, Math.PI, Math.PI)
	isEnable = false
	yaw = 0
	pitch = 0
	roll = 0

	performRecalibration() {
		this.sensorRotations.setRotationFromEuler(this.eulerOrigin)
		this.sensorRotations.rotateZ(MathUtils.degToRad(this.orientationData.alpha))
		this.sensorRotations.rotateX(MathUtils.degToRad(this.orientationData.beta))
		this.sensorRotations.rotateY(MathUtils.degToRad(this.orientationData.gamma))
		this.quatOrigin.copy(this.sensorRotations.quaternion).invert()
		this.recallRequested = false
	}

	onSensorMove = (event) => {
		this.orientationData = {
			alpha: event.alpha || 0,
			beta: event.beta || 0,
			gamma: event.gamma || 0,
		}

		this.needsUpdate = true
		if (this.recallRequested) this.performRecalibration()
	}

	enable() {
		return new Promise((resolve, reject) => {
			if (typeof DeviceOrientationEvent.requestPermission === 'function') {
				DeviceOrientationEvent.requestPermission()
					.then((permissionState) => {
						if (permissionState === 'granted') {
							addEventListener('deviceorientation', this.onSensorMove)
							this.isEnable = true
							resolve('granted')
						}
					})
					.catch(reject)
			} else {
				if (navigator.userAgent.indexOf('Mobile') === -1) {
					reject('Not a mobile device')
					// return
				}

				addEventListener('deviceorientation', this.onSensorMove, true)
				this.isEnable = true
				resolve('granted')
			}
		})
	}

	disable() {
		removeEventListener('deviceorientation', this.onSensorMove, false)
		this.isEnable = false
	}

	recalibrate() {
		this.recallRequested = true
	}

	update() {
		if (!this.needsUpdate) return false
		this.sensorRotations.setRotationFromEuler(this.eulerOrigin)
		this.sensorRotations.applyQuaternion(this.quatOrigin)
		this.sensorRotations.rotateZ(MathUtils.degToRad(this.orientationData.alpha))
		this.sensorRotations.rotateX(MathUtils.degToRad(this.orientationData.beta))
		this.sensorRotations.rotateY(MathUtils.degToRad(this.orientationData.gamma))
		this.quaternion.copy(this.sensorRotations.quaternion).invert()
		this.vectorUp.copy(this.axisUp).applyQuaternion(this.quaternion)
		this.vectorFwd.copy(this.axisFwd).applyQuaternion(this.quaternion)
		this.yaw = Math.atan2(this.vectorFwd.x, this.vectorFwd.z)
		this.pitch = Math.atan2(this.vectorUp.z, this.vectorUp.y)
		this.roll = Math.atan2(-this.vectorUp.x, this.vectorUp.y)

		this.needsUpdate = false
		return true
	}
}
