<template>
	<view class="sprint-win">
		<!-- 状态头 -->
		<view class='sprint-status-bar'>
			<!-- 测试小组的名称 -->
			<view class='sprint-group-name'>
				<text>
					组名：
					<text style="color: #007AFF; font-size: larger; font-style: italic;">
						{{groupName}}
					</text>
				</text>
			</view>
			<!-- 外设个数输入框 -->
			<view class='sprint-peri-count'>
				<text>外设道次</text>
				<input
					class='sprint-input-count'
					type='number'
					placeholder="1到8"
					maxlength='1'
					@blur='getCount'
				/>
				<button
					size='mini'
					@click="createTestListAndSetStorage">
					确定
				</button>
			</view>
			<!-- 连接状态显示 -->
			<view class='sprint-link-status'>
				<text>连接状态</text>
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
				<peri-test-list
					header
					:editable='editable'
					@update:editable='editable = $event'>
				</peri-test-list>
				<!-- 列表 -->
				<!-- 足球只显示最后一道 -->
				<peri-test-list
					:testListItem='testList[countOfPeri - 1]'
					:editable='editable'>
				</peri-test-list>
			</view>
			<!-- 控制面板 -->
			<view class='sprint-control-panel'>
				<view>
					<input
						class='sprint-input-flow'
						type='number'
						placeholder="输入初始流水号"
						maxlength='15'
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
				
				<view class='sprint-ctrl-btn'>
					<button
						:disabled="hasStarted"
						size='mini'
						@click="manualSave">
						保存并清空
					</button>
				</view>
				
				<view class='sprint-ctrl-btn'
					style="margin-top: 40rpx;">
					<button
						:disabled="!hasStarted"
						size='mini'
						@click="reset">
						犯规重置
					</button>
				</view>
				
				<view class='sprint-ctrl-btn'>
					<button
					@click="start"
					:disabled="!hasSaved || !hasFilled">
						开始测试
					</button>
				</view>
			</view>
		</view>
		
		<!-- 断开连接提示消息 -->
		<!-- <uni-popup ref='linkedPopup'
			type='message'>
			<uni-popup-message
				type='warn'
				:message="连接已断开"></uni-popup-message>
		</uni-popup> -->
	</view>
</template>

<script>
	import PeriTestList from '../../components/PeriTestList.vue'
	import { Group, HandleHex } from '../../utils/Process.js'
	import { waitTime } from '../../utils/waitTime.js'
	import GeneInstruction from '../../utils/GeneInstruction.js'
	const aInsGene = new GeneInstruction('0a', '05', '00')//50米的项目设置
	//初始化语音
	const FvvUniTTS = uni.requireNativePlugin('Fvv-UniTTS')
	FvvUniTTS.init(() => {})
	//初始化音频播放器
	const innerAudioContext = uni.createInnerAudioContext()
	innerAudioContext.src = '../../static/gunshot.mp3'
	//全局常量
	const PRE_INTERVAL = 230//prepare时的发送间隔，单位毫秒
	const RUN_INTERVAL = 370//run时的发送间隔
	
	export default {
		components: {
			PeriTestList
		},
		data() {
			return {
				channel: '1',//tcp插件的通道
				ip: '192.168.4.1',
				port: '333',
				linked: false,
				count: 8,//界面输入的外设个数，意义和值与countOfPeri一样但区分两者，避免出现奇怪的交互效果
				countOfPeri: 8,//初始时默认外设个数
				testList: [],//小组名单列表
				group: null,//初始为null，在界面交互中被实例化
				firstFlowNum: 1,//流水号，初始为1
				noGunVoice: false,//犯规重置按钮会取消鸣枪，如果还没来得及鸣枪的话
				hasSaved: true,
				hasStarted: false,
				scores: [],//用于在控制台查看成绩，生产环境无用
				editable: false,//成绩框是否可编辑
				groupName: '',//上个页面传过来的小组名称
				groupId: 0,//上个页面传过来的小组id
			}
		},
		computed: {
			//是否已填充测试人的id
			hasFilled() {
				for (let i = 0; i < this.testList.length; i ++) {
					if (this.testList[i].id) return true
				}
				return false
			},
		},
		onUnload() {
			//卸载页面的时候断开连接
			this.$socket.disconnect(this.channel)
		},
		onLoad(args) {
			//接收上一页传的参数
			this.groupName = args.groupName
			this.groupId = args.groupId
			//根据countOfPeri初始化testList
			//先从缓存读取
			const sprint_peri_count = uni.getStorageSync('sprint_peri_count')
			if (sprint_peri_count) {//如果缓存有值
				this.count = sprint_peri_count
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
					//自己自动连接，可能出现问题
					// this.linkSocket()
				}
			}
			//注册消息处理
			this.$socket.receivedHexMsgCallBack = (channel, hexMsg) => {
				//对个人数据的处理
				const nowTime = Date.now()
				const aHandler = new HandleHex(hexMsg, this.group, nowTime)
				aHandler.handle()
				const ch = aHandler.ch//用于索引前端的testList，也用于group写成绩
				this.testList[ch].status = aHandler.target.getPrintedStatus()//把状态写入前端
				//如果该人跑完了
				if (aHandler.target.status === 'run' && aHandler.target.tense === 'done') {
					this.group.setMemberScore(ch)//计算成绩
					this.testList[ch].score = aHandler.target.score//把成绩写入前端
					this.scores[ch] = aHandler.target.score//用于在控制台查看成绩，生产环境无用
				}
				//对小组状态的判断和处理，包括发令，结束
				//如果全部准备好了
				if (this.group.checkPrepareOver()) {
					this.group.setGroupRun()
					const randomDelay = (Math.random() * 1.5 + 1.5) * 1000//鸣枪延迟，毫秒
					FvvUniTTS.speak({
						text: '预备'
					})
					setTimeout(() => {
						if (!this.noGunVoice) {
							innerAudioContext.play()//鸣枪
							this.group.realStartTime = Date.now()//小组起跑的真实时间
						}
					}, randomDelay)
				}
				//如果全部跑完
				else if (this.group.checkRunOver()) {
					this.group.setGroupWait()
					FvvUniTTS.speak({
						text: '结束'
					})
				}
			}
		},
		methods: {
			//把成绩写入数据库
			insertScoresToDB() {
				this.testList.forEach(item => {
					//有id和成绩才保存
					if (item.id && item.score) {
						plus.sqlite.executeSql({
							name: 'data1',
							sql: `insert into scores('groupId', 'personId', 'score') values(${this.groupId}, "${item.id}", "${item.score}")`,
							success: () => {
								console.log('成功写入一条成绩')
							},
							fail: () => {
								console.log('失败写入一条成绩')
							}
						})
					}
				})
				this.hasSaved = true
			},
			//从输入框获取外设个数
			getCount(ev) {
				const count = Number(ev.target.value)
				if (!Number.isNaN(count)) {
					if (count < 1) this.count = 1
					else if (count > 8) this.count = 8
					else this.count = count
				}
			},
			//根据外设个数赋值testList
			createTestList() {
				this.countOfPeri = this.count
				const list = []
				for (let i = 1; i <= this.countOfPeri; i ++) {
					const item = {
						peri: i,
						id: '',
						status: '等待',
						score: ''
					}
					list.push(item)
				}
				this.testList = list
			},
			//把外设个数存入缓存
			createTestListAndSetStorage() {
				this.createTestList()
				//把外设个数存入缓存
				uni.setStorage({
					key: 'sprint_peri_count',
					data: this.countOfPeri,
				})
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
				// for (let i = 0; i < this.countOfPeri; i ++) {
					//对前端的this.testList操作，后续会用this.testList生成新的Group实例
					this.testList[this.countOfPeri - 1].id = this.firstFlowNum ++
					this.testList[this.countOfPeri - 1].score = ''//成绩清空
					this.testList[this.countOfPeri - 1].status = '等待'//设为等待
				// }
			},
			//手动保存并清空
			manualSave() {
				this.insertScoresToDB()
				// for (let i = 0; i < this.countOfPeri; i ++) {
					//对前端的this.testList操作，后续会用this.testList生成新的Group实例
					this.testList[this.countOfPeri - 1].id = ''//id清空
					this.testList[this.countOfPeri - 1].score = ''//成绩清空
					this.testList[this.countOfPeri - 1].status = '等待'//设为等待
				// }
			},
			//有犯规，重置测试列表
			reset() {
				if (this.group) {//前提是已有group实例
					this.group.setGroupWait()//手动把小组设为等待
					this.noGunVoice = true
					for (let i = 0; i < this.countOfPeri; i ++) {
						//更新前端的testList，只有id不变
						this.testList[i].score = ''
						this.testList[i].status = '等待'
					}
					this.hasSaved = true
					FvvUniTTS.speak({
						text: '犯规'
					})
				}
			},
			//开始测试主按钮
			async start() {
				this.group = null
				this.hasSaved = false
				this.hasStarted = true
				//实例化Group
				this.group = new Group(this.testList)
				this.group.setGroupPrepare()
				this.noGunVoice = false
				let i = 0
				while (this.group.groupStatus !== 'wait') {
					const mem = this.group.members[i ++]
					if (mem.tense === 'doing') {
						const f1 = aInsGene.createInstruction(`0${mem.ch}`, 'f1')
						this.$socket.sendBytes(this.channel, JSON.stringify(f1))
						if (this.group.groupStatus === 'prepare') {
							await waitTime(PRE_INTERVAL)
						}
						else {
							await waitTime(RUN_INTERVAL)
						}
					}
					if (i === this.countOfPeri) i = 0
				}
				console.log(this.scores)//用于在控制台查看成绩，生产环境无用
				this.hasStarted = false
			},
		}
	}
</script>

<style>
	.sprint-win {
		display: flex;
		flex-direction: column;
		margin: 0 20rpx;
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
	.sprint-peri-count {
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
		width: 120rpx;
		margin: 0 8rpx;
	}
	.sprint-link-status {
		display: flex;
		align-items: center;
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
		padding: 6rpx 0;
		margin: 6rpx 0;
	}
</style>

