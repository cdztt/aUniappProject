<template>
	<view class="sprint-win">
		<!-- 状态头 -->
		<view class='sprint-status-bar'>
			<!-- 测试小组的名称 -->
			<view class='sprint-group-name'>
				<text style="height: 20rpx; line-height: 20rpx;">
					组名:
					<text style="color: #007AFF; font-size: large; font-style: italic; border-bottom: 1rpx solid #007AFF;">
						{{groupName}}
					</text>
				</text>
			</view>
			<!-- 外设个数输入框 -->
			<view>
				<button
					size='mini'
					:disabled="systemState === 2 || !hasSaved"
					@click="openSettingPopup">
					设置
				</button>
			</view>
			<!-- 校准 -->
			<view>
				<button size="mini"
					:disabled="systemState === 2 || !linked || !hasSaved"
					class="cali-btn"
					hover-class='cali-btn-hover'
					@click="openCalibratePopup">
					校准
				</button>
			</view>
			<!-- 连接状态显示 -->
			<view class='sprint-status-btn'>
				<view :class='{"sprint-off-status": !linked, "sprint-on-status": linked}'
				class='sprint-status-color'>
				</view>
				<button
				size='mini'
				@click="$socket.init(channel, ip, port)"
				:disabled="linked ? true : false">
					连接
				</button>
			</view>
		</view>

		<!-- 主面板 -->
		<view class='sprint-body-panel'>
			<!-- 测试（成绩）列表 -->
			<view class="sprint-test-list">
				<!-- 表头 -->
				<sprint-test-list
					header
					:resultEditable='resultEditable'
					:systemState='systemState'
					:hasSaved='hasSaved'
					@update-resultEditable='resultEditable = $event'
					@scanner-input='handleScannerInput'
					@scanner-start='startScanner'>
				</sprint-test-list>
				<!-- 列表 -->
				<sprint-test-list
					v-for="item in testList"
					:key='item.sensorNum'
					:testListItem='item'
					:resultEditable='resultEditable'
					:hasSaved='hasSaved'
					@selected-row='handleSelectedRowId'>
				</sprint-test-list>
			</view>

			<!-- 控制面板 -->
			<view class='sprint-control-panel'>
				<!--  -->
				<view class='sprint-ctrl-btn'>
					<button
						:disabled="systemState === 2"
						size='mini'
						@click="fillFlowNum">
						递增编号
					</button>
				</view>
				<!--  -->
				<view class='sprint-ctrl-btn'>
					<button
						:disabled="systemState === 2"
						size='mini'
						@click="saveAndClear">
						保存清空
					</button>
				</view>
				<!--  -->
				<view class='sprint-ctrl-btn'>
					<button
						size='mini'
						:disabled="!(systemState === 2 || !hasSaved)"
						@click="openResetPopup">
						重置
					</button>
				</view>
				<!--  -->
				<view class='sprint-ctrl-btn'
					style="text-align: center;">
					<button
					@click="startTest"
					:disabled="systemState === 2 || !hasFilledPersonId || !hasSaved || !linked">
						开始测试
					</button>
				</view>
			</view>
		</view>

		<uni-popup ref="settingPopup"
			type="setting">
			<uni-popup-setting
				:max_lane="countOfSensor"
				:timeout_value='RUN_TIMEOUT / 1000'
				@confirm='confirmSetting'>
			</uni-popup-setting>
		</uni-popup>

		<!-- 设置道次的模态 -->
		<!-- <uni-popup ref="maxLanePopup"
			type="dialog">
			<uni-popup-dialog
				type="info"
				mode='input'
				title="设置道数"
				placeholder="在此输入数字1到8"
				@confirm="confirmMaxLane">
			</uni-popup-dialog>
		</uni-popup> -->
		<!-- 确定校准的模态 -->
		<uni-popup ref="calibratePopup"
			type="calibrate">
			<uni-popup-calibrate
				:sensorCalibrateArr="sensorCalibrateArr"
				@confirm="confirmCalibrate"
				@auto="autoCalibrate">
			</uni-popup-calibrate>
		</uni-popup>
		<!-- 重置的模态框 -->
		<uni-popup ref="resetPopup"
			type="dialog">
			<uni-popup-dialog
				title="重置"
				content='重置会清空但不会保存本次结果;
				会保留个人编号,以便重新测试'
				:plainConfirmButton='true'
				@confirm="confirmReset"></uni-popup-dialog>
		</uni-popup>
		<!-- 未保存成绩的提示消息 -->
		<uni-popup ref='notSavedPopup'
			type='message'>
			<uni-popup-message
				type='error'
				message="有成绩未保存!"></uni-popup-message>
		</uni-popup>
	</view>
</template>

<script>
	import SprintTestList from '../../components/SprintTestList.vue'
	//初始化语音
	const FvvUniTTS = uni.requireNativePlugin('Fvv-UniTTS')
	FvvUniTTS.init(() => {})
	//初始化音频播放器
	const innerAudioContext = uni.createInnerAudioContext()
	innerAudioContext.src = '../../static/falingqiang.mp3'

	export default {
		components: {
			SprintTestList,
		},
		data() {
			return {
				channel: '1',//tcp插件的通道
				ip: '192.168.4.1',
				// ip: '172.20.10.10',
				port: '333',

				groupName: '',//上个页面传过来的小组名称
				groupId: 0,//上个页面传过来的小组id
				systemState: 0,//0空闲，1校准，2测试
				testStartAppTime: 0,//起跑发令时间
				sensorCalibrateArr: null,//用于校准界面
				countOfSensor: null,//实际使用的外设个数
				maxCountOfSensor: 8,//最大外设个数

				testList: [{
					sensorNum: '',
					printedState: '',
					personId: '',
					examResult: '',
				}],//小组名单列表

				linked: false,//tcp连接状态
				hasSaved: true,//上一次测试的成绩是否已保存
				resultEditable: false,//成绩框是否可编辑
				firstFlowNum: 1,//流水号，初始为1
				scannerInputCursor: 0,//扫描枪自动填充的游标

				runTimeout: null,//跑步超时setTimeout的返回值
				RUN_TIMEOUT: null,//跑步超时时间，单位毫秒
				ADJUST_TIME: 3400,//单位毫秒，修正成绩的时间
				countOfPerson: 0,//实际测试人数，因为有的道次空着
				countOfComplete: 0,//完成测试的人数，小于等于countOfPerson

				sendInterval: null,//重发的循环，用于clearInterval
				sendDone: false,

				foulDetective: false
			}
		},
		computed: {
			timeoutResult() {
				return (this.RUN_TIMEOUT / 1000).toFixed(1)
			},
			//是否已填充测试人的id
			hasFilledPersonId() {
				for (const item of this.testList) {
					if (item.personId) return true
				}
				return false
			},
		},
		// 处理返回按钮的逻辑
		onBackPress(evt) {
			if (this.systemState !== 0) {
				return true
			}
			if (this.systemState === 0 && !this.hasSaved) {
				this.$refs.notSavedPopup.open()
				return true
			}
		},
		onUnload() {
			//卸载页面的时候断开连接，将监听器设为一个空函数
			this.$socket.disconnect(this.channel)
			this.$socket.receivedMsgCallBack = () => {}
		},
		onLoad(args) {
			//接收上一页传的参数
			this.groupName = args.groupName
			this.groupId = Number(args.groupId)
			//从缓存读取，初始化
			this.initLaneAndTimeout()
			this.initSensorCalibrateArr()
			//创建测试列表
			this.createTestList()
			//页面准备好时自动连接一次tcp
			this.$socket.init(this.channel, this.ip, this.port)
			//注册tcp状态监听器
			this.$socket.receivedStatus = (channel, status) => {
				if (status === '0') {
					console.log('/////通道:' + channel + '连接成功')
					this.linked = true
				}
				else {
					console.log('*****通道:' + channel + '连接失败')
					this.linked = false
				}
			}
			/*
			* 注册消息处理，根据tcp传来的信息处理测试过程，项目的主逻辑
			*/
			this.$socket.receivedMsgCallBack = (channel, msg) => {
				let appTime
				//如果在校准，记录平板时间
				if (this.systemState === 1) {
					appTime = Date.now()
				}
				//如果在校准或测试
				if (!(this.systemState === 0)) {
					const sensorNum = Number(msg.substring(0, 1))//道次
					//如果sensorNum在当前的道数之内
					if (sensorNum <= this.countOfSensor) {
						const item = this.testList[sensorNum - 1]//道次对应的列表数据
						const mcuTime = Number(msg.substring(1))//单片机时钟
						// 如果在校准
						if (this.systemState === 1) {
							// 校准时间存在testList里，计算成绩也是用testList，而sensorCalibrateArr只是拿来渲染和存到缓存
							item.calibrateMcuTime = mcuTime
							item.calibrateAppTime = appTime
							FvvUniTTS.speak({
								text: `${sensorNum}`,
							})
							// 得到可读的时间，用来表示什么时候校准的，起到提示用户的作用
							const readableTime = new Date(appTime + 8 * 3600 * 1000).toISOString().slice(5, -8)//03-26T08:58
							//currentCalibrateTime会实时显示在校准界面
							this.sensorCalibrateArr[sensorNum - 1].currentCalibrateTime = readableTime
							this.sendDone = true
						}
						// 如果在测试
						else if (this.systemState === 2) {
							if (sensorNum) {
								if (item.printedState === '测试') {
									item.testEndMcuTime = mcuTime
									this.calcExamResult(item)
									item.printedState = '完成'
									this.countOfComplete ++
								}
								// 如果完成数等于测试人数
								if (this.countOfComplete === this.countOfPerson) {
									clearTimeout(this.runTimeout)//清除超时函数
									console.log('end')
									this.finishTest()
								}
							}
							else {
								if (this.foulDetective) {
									// FvvUniTTS.speak({ text: '抢跑' })
									// setTimeout(() => {
									// 	FvvUniTTS.speak({ text: '抢跑' })
									// 	setTimeout(() => {
									// 		FvvUniTTS.speak({ text: '抢跑' })
									// 	}, 1000)
									// }, 1000)
									this.openResetPopup()
								}
							}
						}
						// 如果在重发
						else if (this.systemState === 3) {
							item.testEndMcuTime = mcuTime
							this.calcExamResult(item)
							this.sendDone = true
						}
					}
				}
			}
		},
		methods: {
			// 计算测试结果
			calcExamResult(item) {
				const result =
					item.testEndMcuTime - (this.testStartAppTime - item.calibrateAppTime + item.calibrateMcuTime) - this.ADJUST_TIME
				item.examResult = (Math.round((result / 100)) / 10).toFixed(1)
				const foo = JSON.parse()
			},
			// 去除字符串里的所有空格字符
			trimSpace(str) {
				return String(str).replace(/\s/g, '')
			},
			//聚焦个人编号之后，把游标归零，清空列表
			startScanner() {
				this.scannerInputCursor = 0
				this.clearTestList()
			},
			// 清空选择行的personId，方便扫描枪重新输入
			//同时实现自动去除空格的效果，注：在输入法组合文字的时候blur会无效
			handleSelectedRowId(evt, type) {
				let selectedRow = this.testList[evt - 1]
				if (type === 'focus') {
					selectedRow.personId = ''
				}
				else if (type === 'blur') {
					selectedRow.personId = this.trimSpace(selectedRow.personId)
				}
			},
			//处理扫描枪连续输入，scannerInputCursor由输入框的focus事件置零
			handleScannerInput(evt) {
				if (this.scannerInputCursor < this.countOfSensor) {//填满就不填了
					this.testList[this.scannerInputCursor].personId = evt
					this.scannerInputCursor ++
				}
			},
			// 打开设置道次的模态
			// openMaxLanePopup() {
			// 	this.$refs.maxLanePopup.open()
			// },
			openSettingPopup() {
				this.$refs.settingPopup.open()
			},
			confirmSetting(done, maxLane, timeoutValue) {
				this.countOfSensor = maxLane
				this.RUN_TIMEOUT = timeoutValue * 1000
				//重新创建测试列表
				this.createTestList()
				//把外设个数存入缓存
				uni.setStorage({
					key: 'sprint_sensor_count',
					data: this.countOfSensor,
				})
				uni.setStorage({
					key: 'sprint_timeout',
					data: this.RUN_TIMEOUT,
				})
				done()
			},
			// 道次模态的确定按钮逻辑
			// confirmMaxLane(done, value) {
			// 	const count = Number(value)
			// 	if (!Number.isNaN(count)) {
			// 		if (count < 1) this.countOfSensor = 1
			// 		else if (count > 8) this.countOfSensor = 8
			// 		else this.countOfSensor = count
			// 	}
			// 	//重新创建测试列表
			// 	this.createTestList()
			// 	//把外设个数存入缓存
			// 	uni.setStorage({
			// 		key: 'sprint_sensor_count',
			// 		data: this.countOfSensor,
			// 	})
			// 	done()
			// },
			// 向外设发送指令
			sendMsg(msg) {
				this.sendDone = false
				return new Promise(resolve => {
					this.$socket.send(this.channel, msg)
					let times = 4
					this.sendInterval = setInterval(() => {
						if (this.sendDone || times === 0) {
							clearInterval(this.sendInterval)
							resolve()
						}
						else {
							this.$socket.send(this.channel, msg)
							times --
						}
					}, 500)
				})
			},
			// 打开校准的模态
			openCalibratePopup() {
				this.systemState = 1
				this.$refs.calibratePopup.open()
				FvvUniTTS.speak({
					text: `校准`,
				})
			},
			// 校准模态的确认按钮的逻辑，把校准值存入缓存
			confirmCalibrate(done) {
				this.systemState = 0
				this.sensorCalibrateArr.forEach((sensor, idx) => {
					if (sensor.currentCalibrateTime) {//如果这一道校准了
						sensor.lastCalibrateTime = sensor.currentCalibrateTime
						sensor.currentCalibrateTime = ''
						// 从testList里获取时钟值
						sensor.calibrateMcuTime = this.testList[idx].calibrateMcuTime
						sensor.calibrateAppTime = this.testList[idx].calibrateAppTime
						// sensor.num没有更改
					}
				})
				//把对象直接存入缓存
				uni.setStorage({
					key: 'sensor_calibrate_arr',
					data: this.sensorCalibrateArr
				})
				done()
			},
			// 自动校准
			async autoCalibrate() {
				for (let i = 1; i <= this.countOfSensor; i ++) {
					await this.sendMsg(`${i}1`)
				}
			},
			//把成绩写入数据库
			insertScoresToDb() {
				//时间格式2020-12-12T12:12:12
				const testTime = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, -5)
				this.testList.forEach(item => {
					//有id和成绩才保存
					if (item.personId && item.examResult) {
						plus.sqlite.executeSql({
							name: 'data',
							sql: `insert into scores('groupId', 'personId', 'score', 'testTime') values(${this.groupId}, "${item.personId}", "${item.examResult}", "${testTime}")`,
							success: () => {
								console.log('成功写入一条成绩')
							},
							fail: () => {
								console.log('失败写入一条成绩')
							}
						})
					}
				})
			},
			//保存并清空
			saveAndClear() {
				if (!this.hasSaved) {
					this.insertScoresToDb()
					this.hasSaved = true
				}
				this.clearTestList()
				this.clearCountOfRunner()
			},
			clearTestList() {
				this.testList.forEach(item => {
					item.printedState = '空闲'
					item.personId = ''
					item.examResult = ''
					// item.round = ''
				})
			},
			//根据外设个数赋值testList
			createTestList() {
				const list = []
				for (let i = 0; i < this.countOfSensor; i ++) {
					const item = {
						sensorNum: i + 1,
						printedState: '空闲',
						personId: '',
						examResult: '',
						// round: '',
						calibrateMcuTime: this.sensorCalibrateArr[i].calibrateMcuTime,
						calibrateAppTime: this.sensorCalibrateArr[i].calibrateAppTime,
						testEndMcuTime: 0,
					}
					list.push(item)
				}
				this.testList = list
			},
			//根据外设个数赋值sensorCalibrateArr
			initSensorCalibrateArr() {
				const sensor_calibrate_arr = uni.getStorageSync('sensor_calibrate_arr')
				//如果缓存中已经存在
				if (sensor_calibrate_arr) {
					this.sensorCalibrateArr = sensor_calibrate_arr
				}
				//如果缓存中还不存在
				else {
					const arr = []
					// 最新安装的app必定首先执行这一分支
					// 以最大外设8道来计
					for (let i = 1; i <= this.maxCountOfSensor; i ++) {
						const item = {
							num: i,
							lastCalibrateTime: '',
							currentCalibrateTime: '',
							calibrateMcuTime: 0,
							calibrateAppTime: 0
						}
						arr.push(item)
					}
					this.sensorCalibrateArr = arr
				}
			},
			//初始化countOfSensor
			initLaneAndTimeout() {
				const sprint_sensor_count = uni.getStorageSync('sprint_sensor_count')
				const sprint_timeout = uni.getStorageSync('sprint_timeout')
				if (sprint_sensor_count) {
					this.countOfSensor = sprint_sensor_count
				}
				else {
					this.countOfSensor = this.maxCountOfSensor
				}
				if (sprint_timeout) {
					this.RUN_TIMEOUT = sprint_timeout
				}
				else {
					this.RUN_TIMEOUT = 15000
				}
			},
			//填充流水号
			fillFlowNum() {
				// 如果索引值0有id，其他行没有id，这种情况把索引值0的id赋值给firstFlowNum
				if (this.countOfSensor > 1) {//必需至少是2道
					const firstId = this.testList[0].personId
					if (firstId) {
						let i = 1//从索引值1开始
						let sentry = false
						while (i < this.countOfSensor && !sentry) {
							if (this.testList[i].personId) {//如果其他行也有id则退出
								sentry = true
							}
							i ++
						}
						if (!sentry) {
							if (Number.isInteger(Number(firstId))) {//如果是整数
								this.firstFlowNum = Number(firstId)
							}
						}
					}
				}
				//保存并清空
				this.saveAndClear()
				//从索引值0开始赋值
				this.testList.forEach(item => {
					item.personId = this.firstFlowNum
					this.firstFlowNum ++
				})
			},
			//有犯规，重置测试列表
			openResetPopup() {
				this.$refs.resetPopup.open()
			},
			// 手动重置的确认
			confirmReset(done) {
				this.reset()
				this.clearCountOfRunner()
				done()
			},
			// 重置的相关操作
			reset() {
				clearTimeout(this.runTimeout)
				this.systemState = 0
				this.hasSaved = true//注意：重置后hasSaved为true
				this.testList.forEach(item => {
					item.printedState = '空闲'
					if (!String(item.examResult).startsWith('00')) {
						item.examResult = ''
					}
				})
			},
			// 保存成绩之后的一些收尾工作
			clearCountOfRunner() {
				this.countOfComplete = 0
				this.countOfPerson = 0
			},
			// 测试结束后的动作
			async finishTest() {
				this.systemState = 0
				this.hasSaved = false
				await this.checkAndResend()
				//对于重发之后依然不对的值，统一赋值为-1
				this.testList.forEach(item => {
					const result = Number(item.examResult)
					if (result < 0 || result >= this.timeoutResult) {
						item.examResult = -1
					}
				})
				FvvUniTTS.speak({
					text: '结束',
				})
			},
			// 自动重发，此函数作为finishTest的子函数
			async checkAndResend() {
				this.systemState = 3//进入重发状态
				for (let i = 0; i < this.countOfSensor; i ++) {
					const result = this.testList[i].examResult
					if (result < 0 || result >= this.timeoutResult) {
						await this.sendMsg(i + 1)
					}
				}
				this.systemState = 0
			},
			//开始测试主按钮
			startTest() {
				this.systemState = 2
				this.foulDetective = true
				// 发令
				innerAudioContext.play()//发令枪声
				this.testStartAppTime = Date.now()
				//
				setTimeout(() => {
					this.foulDetective = false
				}, this.ADJUST_TIME)
				//15秒之后未跑完就超时
				this.runTimeout = setTimeout(() => {
					if (this.systemState === 2) {
						// 把超时时间作为成绩
						this.testList.forEach(item => {
							if (item.printedState === '测试') {
								item.examResult = this.timeoutResult
								item.printedState = '完成'
							}
						})
						this.finishTest()
					}
				}, this.RUN_TIMEOUT + this.ADJUST_TIME)

				// 对于缺考的人预先在成绩栏写入缺考代码，如果成绩栏有值，该道直接完成
				this.testList.forEach(item => {
					if (item.personId) {//最终效果：没有id-空闲，有id没成绩-测试，有id有成绩-完成，此为状态的3种
						this.countOfPerson ++
						if (item.examResult) {//这里的成绩是缺考代码
							item.printedState = '完成'
							this.countOfComplete ++
						}
						else {
							item.printedState = '测试'
						}
					}
				})
			},
		}
	}
</script>

<style>
	.sprint-win {
		display: flex;
		flex-direction: column;
		margin: 0 10rpx;
	}
	.sprint-status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10rpx;
		padding: 6rpx 0;
		border-bottom: 2rpx solid #ceced6;
	}
	.sprint-group-name {
		width: 360rpx;
	}
	.sprint-status-btn {
		display: flex;
		align-items: center;
	}
	.sprint-input-count {
		border: 1rpx solid #ceced6;
		border-radius: 2rpx;
		width: 40rpx;
		margin: 0 8rpx;
	}
	.sprint-input-flow {
		border: 1rpx solid #ceced6;
		border-radius: 2rpx;
		width: 128rpx;
	}
	.sprint-status-color {
		margin: 0 8rpx;
		width: 16rpx;
		height: 16rpx;
		border-radius: 8rpx;
	}
	.sprint-off-status {
		background-color: #ff0000;
	}
	.sprint-on-status {
		background-color: #00ff00;
	}
	.sprint-body-panel {
		display: flex;
		justify-content: space-between;
	}
	.sprint-test-list {
		margin-left: 5rpx;
	}
	.sprint-control-panel {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 0 10rpx 0 30rpx;
		border-left: 2rpx solid #ceced6;
	}
	.sprint-ctrl-btn {
		padding: 8rpx 0;
		margin: 8rpx 0;
	}
	.sprint-hidden {
		visibility: hidden;
	}
	.cali-btn {
		color: #ffffff;
		font-weight: 600;
		background-color: rgba(170, 170, 127, 0.5);
	}
	.cali-btn-hover {
		color: #ffffff;
		font-weight: 900;
		background-color: rgba(170, 170, 127, 1.0);
	}
</style>

