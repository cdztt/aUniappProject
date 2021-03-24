/*
跑步人员的数据信息
包括测试id、状态、时间、成绩
*/
class Member {
	constructor(ch, peri, id) {
		this.ch = ch//从机地址（通道），数字0到7
		this.peri = peri
		this.id = id
	    this.status = 'wait'//3种状态：wait，prepare，run
		this.tense = 'done'//2种时态：状态进行中doing，状态已完成done
		this.timer = new Timer()//测试时间相关的信息
		this.score = ''
	}
	setStatusPrepare() {
		this.status = 'prepare'
	}
	setStatusRun() {
		this.status = 'run'
	}
	setStatusWait() {
		this.status = 'wait'
	}
	setDone() {
		this.tense = 'done'
	}
	setDoing() {
		this.tense = 'doing'
	}
	//是否空闲，如果有id则不空闲，没有id则空闲
	getIdle() {
		if (this.id) return false
		return true
	}
	//在前端显示的外设状态
	getPrintedStatus() {
		// if (this.status === 'prepare' && this.tense === 'doing') return '准备'
		if (this.status === 'prepare' && this.tense === 'done') return '就绪'
		if (this.status === 'run' && this.tense === 'doing') return '进行'
		if (this.status === 'run' && this.tense === 'done') return '完成'
		return '等待'//等待不区分时态
	}
	setScore(score) {
		this.score = score
	}
}
/*
测试者的时间信息，记录真实时间和外设的相关时间，用于判断人过杆和计算成绩
*/
class Timer {
	constructor() {
		this.responseTime = 0//外设的时钟，单片机收发消息时，时钟会停止（被阻塞），阻塞大概140毫秒
		this.realResponseTime = 0//平板收到消息时的真实时间
		this.oldTriggerTime = 0//触发时的外设时间，上一次触发
		this.newTriggerTime = 0//触发时的外设时间，最新一次触发
		this.RT_DELAY_TIME = 140//收发延迟的时间，毫秒
	}
	setResponseTime(t) {
		this.responseTime = t
	}
	setRealResponseTime(nowTime) {
		this.realResponseTime = nowTime
	}
	setTriggerTime(t) {
		this.oldTriggerTime = this.newTriggerTime
		this.newTriggerTime = t
	}
	//外设触发时到外设被轮询到时经历的时间，单位：毫秒
	//主机轮询外设，起跑时间和轮询到过杆的真实时间都由主机记录
	//但轮询到的时间并非过杆那一刻的时间，中间的延迟由外设的responseTime和newTriggerTime计算得到
	getDelayTime() {
		//外设时间没有翻转
		if (this.responseTime >= this.newTriggerTime) {
			return (this.responseTime - this.newTriggerTime) * 10 + this.RT_DELAY_TIME
		}
		//外设时间已翻转
		return (65535 - this.newTriggerTime + this.responseTime) * 10 + this.RT_DELAY_TIME
	}
}
/*
把从前端表单获取的testList传入，获得小组信息
包含小组的整体状态和操作
记录起跑发令时间，用于个人成绩的计算
*/
class Group {
	constructor(testList) {
		this.count = testList.length//跑步人数，最大8
		const members = []
		for (let i = 0; i < testList.length; i ++) {
			members.push(new Member(i, testList[i].peri, testList[i].id))
		}
		this.members = members//把所有人归入一个数组
		this.groupStatus = 'wait'//小组3种状态：wait，prepare，run
		this.realStartTime = 0//小组准备就绪时的起跑发令时间
	}
	// //检查是否没人
	// checkNobody() {
	// 	for (let i = 0; i < this.count; i ++) {
	// 		if (!this.members[i].getIdle()) return false
	// 	}
	// 	return true
	// }
	//小组准备
	setGroupPrepare() {
		this.members.forEach(mem => {
			if (!mem.getIdle()) {
				mem.setStatusPrepare()
				mem.setDoing()
			}
		})
		this.groupStatus = 'prepare'
	}
	//检查是否准备好
	checkPrepareOver() {
		if (this.groupStatus === 'prepare') {
			for (let i = 0; i < this.count; i ++) {
				if (!this.members[i].getIdle() && this.members[i].tense === 'doing') return false
			}
			return true//全部人员done
		}
		return false
	}
	//小组开始跑
	setGroupRun() {
		this.members.forEach(mem => {
			if (!mem.getIdle()) {
				mem.setStatusRun()
				mem.setDoing()
			}
		})
		this.groupStatus = 'run'
	}
	//检查是否跑完
	checkRunOver() {
		if (this.groupStatus === 'run') {
			for (let i = 0; i < this.count; i ++) {
				if (!this.members[i].getIdle() && this.members[i].tense === 'doing') return false
			}
			return true
		}
		return false
	}
	//小组进入等待
	setGroupWait() {
		this.members.forEach(mem => {
			if (!mem.getIdle()) {
				mem.setStatusWait()
			}
		})
		this.groupStatus = 'wait'
	}
	//得到成绩，对测试个人进行操作
	setMemberScore(ch) {
		const mem = this.members[ch]
		if (!mem.getIdle()) {
			const result = mem.timer.realResponseTime - mem.timer.getDelayTime() - this.realStartTime
			const score = (result / 1000).toFixed(1)//转换成秒，保留一位小数
			mem.setScore(String(score))//转成字符串
		}
	}
}
/*
处理从外设返回的消息
主要在消息监听函数里使用，每收到一个消息创建一个新实例
*/
class HandleHex {
	constructor(hex, aGroup, nowTime) {
		this.ch = parseInt(hex.substring(6, 8))//外设地址，0到7
	    this.target = aGroup.members[this.ch]//根据外设地址获取该人
		this.f = hex.substring(8, 10).toLowerCase()//返回的指令，如果不是‘f1’则忽略（可能为‘20’）
		this.responseTime = parseInt(hex.substring(10, 14), 16)//外设计时器，时间系数和真实时间一样，但会被收发动作阻塞
		this.triggerTime = parseInt(hex.substring(14, 18), 16)//外设被触发时定格的计时器
		this.nowTime = nowTime//收到消息那一刻的真实时间
	}
	handle() {
		console.log(this.target.ch, this.responseTime, this.triggerTime, this.f)
		if (this.f === 'f1') {
			if (this.target.status === 'prepare' && this.target.tense === 'doing') {
				this.target.timer.setTriggerTime(this.triggerTime)
				this.target.setDone()
				console.log('ready')
			}
			else if (this.target.status === 'run' && this.target.tense === 'doing') {
				this.target.timer.setTriggerTime(this.triggerTime)
				//判断是否触发，如果新触发不等于老触发，则表示人过杆了
				if (this.target.timer.newTriggerTime !== this.target.timer.oldTriggerTime) {
					this.target.timer.setResponseTime(this.responseTime)//记录外设时间
					this.target.timer.setRealResponseTime(this.nowTime)//记录真实时间
					this.target.setDone()
					console.log('trigger')
				}
			}
		}
	}
}

export {
	Group,
	HandleHex
}