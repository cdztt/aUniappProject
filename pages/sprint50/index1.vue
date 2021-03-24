<template>
	<view>
		<button
		@click="linkSocket">
			连接外设
		</button>
		<button
		@click="calibrate">
			开始校准
		</button>
		<button
		@click="start">
			开始测试
		</button>
		<text>
			测试结果：
		</text><br>
		<text v-for="(item, index) in score" :key='index'>
			第{{index + 1}}路：{{item}}秒<br>
		</text>
	</view>
</template>

<script>
	//初始化语音
	const FvvUniTTS = uni.requireNativePlugin('Fvv-UniTTS')
	FvvUniTTS.init(() => {})
	//初始化音频播放器
	const innerAudioContext = uni.createInnerAudioContext()
	innerAudioContext.src = '../../static/gunshot.mp3'
	
	export default {
		data() {
			return {
				channel: '1',//tcp插件的通道
				ip: '192.168.43.2',
				port: '8080',
				systemState: 0,//0表示空闲，1表示校准，2表示测试
				calibrateValueArr: [],
				calibrateTimeArr: [],
				startTime: 0,
				finishTimeArr: [],
				testValueArr: [],
				examResultArr: [],
				score: [],
				maxLane: 7,
			}
		},
		onUnload() {
			this.$socket.disconnect(this.channel)
		},
		onLoad() {
			this.$socket.receivedStatus = (channel, status) => {
				if (status === '0') {
					console.log('/////通道:' + channel + '连接成功')
					FvvUniTTS.speak({
						text: `连接`
					})
					// this.linked = true
				}
				else {
					console.log('*****通道:' + channel + '连接失败')
					// this.linked = false
					FvvUniTTS.speak({
						text: `断开`
					})
				}
			}
			this.$socket.receivedMsgCallBack = (channel, msg) => {
				const nowTime = Date.now()
				console.log(this.systemState, msg)
				const laneNum = msg.substring(0, 1)
				const idx = laneNum - 1
				const sensorValue = Number(msg.substring(1))
				if (this.systemState === 1) {
					this.calibrateValueArr[idx] = sensorValue
					this.calibrateTimeArr[idx] = nowTime
					FvvUniTTS.speak({
						// text: `第${laneNum}路校准完成`
						text: `完成`
					})
					console.log(`第${laneNum}路校准完成`)
					if (this.calibrateValueArr.length === this.maxLane) {
						if (this.checkNotNull(this.calibrateValueArr)) {
							this.systemState = 0
							FvvUniTTS.speak({
								text: `结束`
							})
						}
					}
				}
				else if (this.systemState === 2) {
					this.testValueArr[idx] = sensorValue
					if (this.examResultArr[idx] == null) {
						this.examResultArr[idx] =
							Math.round((this.testValueArr[idx] - (this.startTime + 600 - this.calibrateTimeArr[idx] + this.calibrateValueArr[idx])) / 10) / 100
					}
					this.score = null
					this.score = this.examResultArr
					// this.score[idx] = result
					if (this.score.length === this.maxLane) {
						if (this.checkNotNull(this.score)) {
							this.systemState = 0
							FvvUniTTS.speak({
								text: `结束`
							})
						}
					}
					// this.systemState = 0
				}
			}
		},
		methods: {
			checkNotNull(arr) {
				for (let i = 0; i < this.maxLane; i ++) {
					if (!arr[i]) {
						return false
					}
				}
				return true
			},
			//连接tcp
			linkSocket() {
				this.$socket.init(this.channel, this.ip, this.port)
			},
			//校准
			calibrate() {
				this.systemState = 1
				console.log(this.systemState, '校准')
				FvvUniTTS.speak({
					text: '校准'
				})
			},
			//开始测试
			start() {
				this.systemState = 2
				this.score = null
				this.examResultArr = []
				console.log(this.systemState, '开始')
				FvvUniTTS.speak({
					text: '预备'
				})
				setTimeout(() => {
					innerAudioContext.play()
					// FvvUniTTS.speak({
					// 	text: '跑'
					// })
					this.startTime = Date.now()
					console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
				}, 1000)
			}
		},
	}
</script>

<style>
	button {
		width: 100rpx;
		margin-bottom: 10rpx;
	}
</style>
