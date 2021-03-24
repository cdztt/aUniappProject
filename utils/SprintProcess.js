class Examinee {
	constructor(id) {
		this.id = id || ''
		this.examResult = ''
	}
}

class SprintSensor {
	constructor(lane, examinee) {
	    this.lane = lane
		this.examinee = examinee
		this.sensorState = 0		//0 = idle, 1 = calibrate, 2 = test
		this.hasDone = false
		this.calibrateMcuTime = 0
		this.calibrateAppTime = 0
		this.testEndMcuTime = 0
	}
	getPrintedState() {
		if (this.sensorState === 0) {
			if (!this.hasDone) return '空闲'
			return '准备'
		}
		if (this.sensorState === 1) {
			if (!this.hasDone) return '....'
			return '**'
		}
		if (this.sensorState === 2) {
			if (!this.hasDone) return '测试中'
			return '完成'
		}
	}
}

class ExamGroup {
	constructor(count) {
		const sensorArr = []
		for (let i = 1; i <= count; i ++) {
			sensorArr.push(new SprintSensor(i, new Examinee()))
		}
		this.sensorArr = sensorArr
	    this.testStartAppTime = 0
		this.adjustTime = 600
	}
	setGroupCalibrate() {
		this.sensorArr.forEach(sensor => {
			sensor.sensorState = 1
			sensor.hasDone = false
		})
	}
	setGroupTest() {
		this.sensorArr.forEach(sensor => {
			sensor.sensorState = 2
			sensor.hasDone = false
		})
	}
	setExamineeExamResult(lane) {
		const sensor = this.sensorArr[lane - 1]
		const result = sensor.testEndMcuTime - (this.testStartAppTime - sensor.calibrateAppTime + sensor.calibrateMcuTime) - this.adjustTime
		sensor.examinee.examResult = (Math.round((result / 100)) / 10).toFixed(1)
	}
}

export {
	ExamGroup
}