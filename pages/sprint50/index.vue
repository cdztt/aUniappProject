<template>
	<view class="sprint-win">
		<!-- 状态头 -->
		<view class='sprint-status-bar'>
			<!-- 测试小组的名称 -->
			<view class='sprint-group-name'>
				<text>
					组名:
					<text style="color: #007AFF;font-size: large; font-style: italic; border-bottom: 1rpx solid #007AFF;">
						{{groupName}}
					</text>
				</text>
			</view>
			<!-- 设置轮数 -->
			<view class="sprint-status-btn">
				<button
					size="mini"
					@click="nextLoop">
					第 {{loopCount}} 轮
				</button>
			</view>
			<!-- 外设个数输入框 -->
			<view class='sprint-status-btn'>
				<button
					size='mini'
					@click="openMaxLanePopup">
					设置道数
				</button>
			</view>
			<!-- 校准 -->
			<view class="sprint-status-btn">
				<button size="mini"
					class="cali-btn"
					hover-class='cali-btn-hover'
					@click="openCalibratePopup"
					v-text="systemState === 1 ? '完成' : '校准'">
				</button>
			</view>
			<!-- 连接状态显示 -->
			<view class='sprint-status-btn'>
				<view :class='{"sprint-off-status": !linked, "sprint-on-status": linked}'
				class='sprint-status-color'></view>
				<button
				size='mini'
				@click="linkSocket"
				:disabled="linked ? true : false">连接</button>
			</view>
		</view>
		<!-- 主面板 -->
		<view class='sprint-body-panel'>
			<!-- 测试（成绩）列表 -->
			<view>
				<!-- 表头 -->
				<sprint-test-list
					header
					:resultEditable='resultEditable'
					@update-resultEditable='resultEditable = $event'>
				</sprint-test-list>
				<!-- 列表 -->
				<sprint-test-list
					v-for="item in testList"
					:key='item.sensorNum'
					:testListItem='item'
					:resultEditable='resultEditable'>
				</sprint-test-list>
			</view>
			<!-- 控制面板 -->
			<view class='sprint-control-panel'>
				<view class='sprint-auto-fill'>
					<view class="sprint-fill-id"
						v-if='loopCount === 1'>
						<view style="margin-bottom: 4rpx;">
							<input
								class='sprint-input-flow'
								type='number'
								placeholder="使用扫描枪自动填充"
								v-model="scanPool"
								@focus='scannerAutoInput'
								@blur='clearScannerInterval'
							/>
						</view>
						
						<view>
							<input
								class='sprint-input-flow'
								type='number'
								placeholder="输入初始流水号"
								maxlength='16'
								@blur='getFirstFlowNum'
							/>
						</view>
						
						<view class='sprint-ctrl-btn'>
							<button
								:disabled="hasStarted"
								size='mini'
								@click="fillFlowNum">
								保存并填充流水号
							</button>
						</view>
					</view>
					<view class="sprint-fill-id"
						v-else>
						<view class='sprint-ctrl-btn'>
							<button
								:disabled="hasStarted"
								size='mini'
								@click="fillExistingId">
								保存并填充编号
							</button>
						</view>
					</view>
				</view>
				
				<view class='sprint-ctrl-btn'>
					<button
						:disabled="hasStarted"
						size='mini'
						@click="saveAndClear">
						保存并清空
					</button>
				</view>
				
				<view class='sprint-ctrl-btn'>
					<button
						:disabled="!hasStarted"
						size='mini'
						@click="reset">
						犯规重置
					</button>
				</view>
				
				<view class='sprint-ctrl-btn'>
					<button :class="{'sprint-hidden': !askForRepeat}"
						size='mini'
						@click="prepareRepeatTest">
						准备第 {{repeatCount + 1}} 次测试
					</button>
				</view>
				
				<view class='sprint-ctrl-btn'
					style="text-align: center;">
					<text style="color: #007AFF;"
						:class="{'sprint-hidden': askForRepeat || !hasFilledPersonId}">
						第 {{loopCount}} 轮第 {{repeatCount}} 次
					</text>
					<button
					@click="start"
					:disabled="!hasSaved || !hasFilledPersonId">
						开始测试
					</button>
				</view>
			</view>
		</view>
		
		<!-- 进入下一轮 -->
		<uni-popup ref='nextRoundPopup'
			type='dialog'>
			<uni-popup-dialog
				type='info'
				:title='nextRoundPopupTitle'
				content='进入下一轮测试？'
				@confirm='confirmNextRound'></uni-popup-dialog>
		</uni-popup>
		<!-- 设置道次的模态 -->
		<uni-popup ref="maxLanePopup"
			type="dialog">
			<uni-popup-dialog
				type="info"
				mode='input'
				title="设置道数"
				placeholder="请输入数字1到8"
				@confirm="confirmMaxLane"></uni-popup-dialog>
		</uni-popup>
		<!-- 确定校准的模态 -->
		<uni-popup ref="calibratePopup"
			type="dialog">
			<uni-popup-dialog
				type="warn"
				title="开始校准吗？"
				@confirm="confirmCalibrate"></uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	import uniPopup from '@/components/uni-popup/uni-popup.vue'
	import uniPopupDialog from '@/components/uni-popup/uni-popup-dialog.vue'
	import SprintTestList from '../../components/SprintTestList.vue'
	//初始化语音
	const FvvUniTTS = uni.requireNativePlugin('Fvv-UniTTS')
	FvvUniTTS.init(() => {})
	//初始化音频播放器
	const innerAudioContext = uni.createInnerAudioContext()
	innerAudioContext.src = '../../static/gunshot.mp3'
	
	export default {
		components: {
			SprintTestList,
			uniPopup,
			uniPopupDialog,
		},
		data() {
			return {
				channel: '1',//tcp插件的通道
				ip: '192.168.43.2',
				port: '8080',
				
				testStartAppTime: 0,
				adjustTime: 600,
				systemState: 0,
				linked: false,
				countOfSensor: 8,//初始时默认外设个数
				testList: null,//小组名单列表
				group: null,//初始为null，在界面交互中被实例化
				foul: false,//犯规重置按钮会取消鸣枪，如果还没来得及鸣枪的话
				hasSaved: true,
				hasStarted: false,
				// scores: [],//用于在控制台查看成绩，生产环境无用
				resultEditable: false,//成绩框是否可编辑
				groupName: '',//上个页面传过来的小组名称
				groupId: 0,//上个页面传过来的小组id
				forceQuit: false,
				loopCount: 1,//测试轮数
				repeatCount: 1,//测试次数
				askForRepeat: false,
				firstFlowNum: 1,//流水号，初始为1
				personIds: [],
				personIdCursor: 0,
				scanPool: '',//扫描枪输入框的v-model
				scannerInterval: '',//扫描枪的setInterval，用于在其他地方clearInterval
			}
		},
		computed: {
			//是否已填充测试人的id
			hasFilledPersonId() {
				for (const item of this.testList) {
					if (item.personId) return true
				}
				return false
			},
			//获取轮次
			getRound() {
				return `${this.loopCount}${this.repeatCount}`
			},
			nextRoundPopupTitle() {
				return `该小组共 ${this.personIds.length} 人`
			},
		},
		onUnload() {
			//卸载页面的时候断开连接
			this.$socket.disconnect(this.channel)
			this.forceQuit = true
			this.clearScannerInterval()
		},
		onLoad(args) {
			//接收上一页传的参数
			this.groupName = args.groupName
			this.groupId = Number(args.groupId)
			//根据countOfSensor初始化testList
			//先从缓存读取
			const sprint_sensor_count = uni.getStorageSync('sprint_sensor_count')
			if (sprint_sensor_count) {//如果缓存有值
				this.countOfSensor = sprint_sensor_count
			}
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
			//注册消息处理
			this.$socket.receivedMsgCallBack = (channel, msg) => {
				let appTime
				if (this.systemState === 1) {
					appTime = Date.now()
				}
				if (!(this.systemState === 0)) {
					const lane = msg.substring(0, 1)
					const item = this.testList[lane - 1]
					const mcuTime = Number(msg.substring(1))
					if (this.systemState === 1) {
						item.calibrateMcuTime = mcuTime
						item.calibrateAppTime = appTime
						FvvUniTTS.speak({
							text: `第${lane}道`,
						})
						item.printedState = '#'
					}
					else if (this.systemState === 2) {
						item.testEndMcuTime = mcuTime
						const result =
							item.testEndMcuTime - (this.testStartAppTime - item.calibrateAppTime + item.calibrateMcuTime) - this.adjustTime
						item.examResult = (Math.round((result / 100)) / 10).toFixed(1)
						item.printedState = '完成'
					}
				}
			}
		},
		methods: {
			openMaxLanePopup() {
				this.$refs.maxLanePopup.open()
			},
			confirmMaxLane(done, value) {
				const count = Number(value)
				if (!Number.isNaN(count)) {
					if (count < 1) this.countOfSensor = 1
					else if (count > 8) this.countOfSensor = 8
					else this.countOfSensor = count
				}
				this.createTestList()
				//把外设个数存入缓存
				uni.setStorage({
					key: 'sprint_sensor_count',
					data: this.countOfSensor,
				})
				done()
			},
			openCalibratePopup(val) {
				if (this.systemState === 0) {
					this.$refs.calibratePopup.open()
				}
				else if (this.systemState === 1) {
					this.systemState = 0
					this.testList.forEach(item => {
						item.printedState = '空闲'
					})
				}
			},
			confirmCalibrate(done) {
				this.systemState = 1
				this.testList.forEach(item => {
					item.printedState = '...'
				})
				done()
			},
			scannerAutoInput() {
				this.saveAndClear()
				this.scanPool = ''
				//在this.scanPool = ''这个dom更新之后
				this.$nextTick(() => {
					if (!this.scannerInterval) {
						let oldLen = 1, count = 1, idx = 0
						this.scannerInterval = setInterval(() => {
							const len = this.scanPool.length
							console.log('scanner input focus', len)
							if (len > 0 && len === oldLen) {
								count ++
							}
							else {
								count = 1
							}
							if (count > 2) {//一个字符长度出现3次即表示一次扫描结束
								if (idx < this.testList.length) {
									this.testList[idx].id = this.scanPool
									this.scanPool = ''
								}
								idx ++
								if (idx === this.testList.length) {
									this.clearScannerInterval()
								}
							}
							oldLen = len
						}, 300)//循环间隔300毫秒
					}
				})
			},
			clearScannerInterval() {
				console.log('stop scanner')
				clearInterval(this.scannerInterval)
				this.scannerInterval = ''
			},
			//把成绩写入数据库
			insertScoresToDB() {
				//时间格式2020-12-12T12:12:12
				const testTime = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, -5)
				this.testList.forEach(item => {
					//有id和成绩才保存
					if (item.id && item.score) {
						plus.sqlite.executeSql({
							name: 'data',
							sql: `insert into scores('groupId', 'personId', 'score', 'round', 'testTime') values(${this.groupId}, "${item.id}", "${item.score}", "${this.getRound}", "${testTime}")`,
							success: () => {
								console.log('成功写入一条成绩')
							},
							fail: () => { console.log('失败写入一条成绩') }
						})
					}
				})
				this.hasSaved = true
				this.askForRepeat = false
			},
			//获取小组个人编号
			fetchGroupPersonId() {
				plus.sqlite.selectSql({
					name: 'data',
					//剔除重复值
					sql: `select distinct personId from scores where groupId = ${this.groupId} order by _id`,
					success: res => {
						console.log('成功获取小组个人编号')
						this.personIds = res.map(el => el.personId)
					},
					fail: () => { console.log('失败获取小组个人编号') }
				})
			},
			//进入下一轮测试的询问模态框
			nextLoop() {
				this.fetchGroupPersonId()
				this.$refs.nextRoundPopup.open()
			},
			//确定进入下一轮
			confirmNextRound(done) {
				this.saveAndClear()
				this.loopCount ++
				this.personIdCursor = 0
				done()
			},
			//从输入框获取外设个数
			getCount(ev) {
				const count = Number(ev.target.value)
				if (!Number.isNaN(count)) {
					if (count < 1) this.countOfSensor = 1
					else if (count > 8) this.countOfSensor = 8
					else this.countOfSensor = count
				}
			},
			//根据外设个数赋值testList
			createTestList() {
				const list = []
				for (let i = 1; i <= this.countOfSensor; i ++) {
					const item = {
						sensorNum: i,
						printedState: '空闲',
						personId: '',
						examResult: '',
						round: '',
						calibrateMcuTime: 0,
						calibrateAppTime: 0,
						testEndMcuTime: 0,
					}
					list.push(item)
				}
				this.testList = list
			},
			//手动连接一次tcp
			linkSocket() {
				this.$socket.init(this.channel, this.ip, this.port)
			},
			//获取初始流水号
			getFirstFlowNum(ev) {
				const num = Number(ev.target.value)
				if (!Number.isNaN(num)) {
					if (num > 0) this.firstFlowNum = num//流水号不能等于0
				}
			},
			//填充流水号
			fillFlowNum() {
				this.insertScoresToDB()
				for (let i = 0; i < this.countOfSensor; i ++) {
					//对前端的this.testList操作，后续会用this.testList生成新的Group实例
					this.testList[i].id = this.firstFlowNum ++
					this.clearScore(i)
				}
				this.repeatCount = 1//填充新id了肯定要从第一次开始测试了
			},
			//填充已有Id，第一轮测试以后
			fillExistingId() {
				this.insertScoresToDB()
				for (let i = 0; i < this.countOfSensor; i ++) {
					//对前端的this.testList操作，后续会用this.testList生成新的Group实例
					if (this.personIdCursor < this.personIds.length) {
						this.testList[i].id = this.personIds[this.personIdCursor ++]
					}
					else {
						this.testList[i].id = ''
					}
					this.clearScore(i)
				}
				this.repeatCount = 1
			},
			//保存并清空
			saveAndClear() {
				this.insertScoresToDB()
				for (let i = 0; i < this.countOfSensor; i ++) {
					//对前端的this.testList操作，后续会用this.testList生成新的Group实例
					this.testList[i].id = ''//id清空
					this.clearScore(i)
				}
				this.repeatCount = 1
			},
			//准备重复测试
			prepareRepeatTest() {
				this.insertScoresToDB()
				for (let i = 0; i < this.countOfSensor; i ++) {
					//对前端的this.testList操作，后续会用this.testList生成新的Group实例
					this.clearScore(i)
				}
				this.repeatCount ++
			},
			//有犯规，重置测试列表
			reset() {
				if (this.group) {//前提是已有group实例
					this.foul = true//设置犯规
					this.group.setGroupWait()//手动把小组设为等待
					for (let i = 0; i < this.countOfSensor; i ++) {
						//更新前端的testList，只有id不变
						this.clearScore(i)
					}
					this.hasSaved = true
					FvvUniTTS.speak({
						text: '犯规'
					})
				}
			},
			//清空成绩，用到的地方很多，为了不重复代码
			clearScore(idx) {
				this.testList[idx].score = ''
				this.testList[idx].round = ''
				this.testList[idx].status = '等待'
			},
			//开始测试主按钮
			start() {
				this.systemState = 2
				// const randomDelay = (Math.random() * 1.5 + 1.5) * 1000//鸣枪延迟，毫秒
				FvvUniTTS.speak({
					text: '预备'
				})
				setTimeout(() => {
					innerAudioContext.play()
					this.testStartAppTime = Date.now()
				}, 1000)
				this.testList.forEach(item => {					item.printedState = '测试中'				})
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
		width: 320rpx;
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
	.sprint-auto-fill {
		height: 90rpx;
		width: 130rpx;
	}
	.sprint-fill-id {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-items: center;
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
		/* align-items: center; */
		justify-content: space-between;
	}
	.input-placeholder {/* 组件的默认类名 */
		color: #e7e7ee;
	}
	.sprint-control-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.sprint-ctrl-btn {
		padding: 4rpx 0;
		margin: 4rpx 0;
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

