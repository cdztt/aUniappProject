<template>
	<view class='stl-win'>
		<view class='stl-item'>
			<!-- 外设道次 -->
			<view class='stl-ch'>
				<text
					v-if='!header'>
					第
					<text style="color: #007AFF; font-weight: 600;"
					v-text='" " + testListItem.sensorNum + " "'></text>
					道
				</text>
				<text class='stl-header'
					v-else>
					道次
				</text>
			</view>
			<!-- 测试状态 -->
			<view class='stl-status'>
				<text style='color: #007AFF; font-size: small;'
					v-if='!header'>
					{{testListItem.printedState}}
				</text>
				<text class='stl-header'
					v-else>
					状态
				</text>
			</view>
			<!-- 用户id -->
			<view class='stl-id'>
				<!-- 聚焦的时候发送当前序号，父组件清除该列 -->
				<input class='stl-id-input'
					v-if='!header'
					type="text"
					placeholder="请输入唯一值"
					:disabled="systemState === 2 || !hasSaved"
					maxlength='30'
					v-model="testListItem.personId"
					@confirm="hideKeyboard"
					@focus="$emit('selected-row', testListItem.sensorNum, 'focus')"
					@blur="$emit('selected-row', testListItem.sensorNum, 'blur')"
				/>
				<!-- 聚焦时自动填充，失焦时清除interval -->
				<input :class='["stl-header", "stl-id-input", {"stl-score-input-edit": idHeadFocused}]'
					placeholder-class='stl-id-placeholder'
					v-else
					type="text"
					placeholder="个 人 编 号"
					:disabled="systemState === 2 || !hasSaved"
					v-model="scannerInput"
					@focus='scannerAutoInput'
					@blur='clearScannerInterval'
				/>
			</view>
			<!-- 姓名 -->
			<view class='stl-name'>
				<input class="stl-name-input"
					v-if='!header'>
				</input>
				<text class='stl-header'
					v-else>
					姓名
				</text>
			</view>
			<!-- 成绩和编辑 -->
			<view class='stl-score'>
				<input :class="['stl-score-input', {'stl-score-input-edit': resultEditable}]"
					v-if='!header'
					maxlength='10'
					:disabled='!resultEditable'
					v-model="testListItem.examResult"
				/>
				<view class="stl-score-header"
					v-else>
					<text class='stl-header'>
						成绩（秒）
					</text>
					<button
						size="mini"
						@click="switchEditable"
						:disabled="systemState === 2"
						v-text="editable ? '锁定' : '编辑'">
					</button>
				</view>
			</view>
			
		</view>
	</view>
</template>

<script>
	export default {
		props: [
			'header',
			'testListItem',
			'resultEditable',
			'systemState',
			'hasSaved',
		],
		data() {
			return {
				editable: this.resultEditable,
				idHeadFocused: false,//id头聚焦时会改变边框颜色
				scannerInput: '',//扫描枪输入框的v-model
				scannerInterval: null,//setInterval的值
				SCAN_GAP: 300,//扫描间隔
			}
		},
		// 必须要注销setInterval，否则一直有效
		beforeDestroy() {
			this.clearScannerInterval()
		},
		methods: {
			switchEditable() {
				this.editable = !this.editable
				this.$emit('update-resultEditable', this.editable)
			},
			hideKeyboard() {
				uni.hideKeyboard()
			},
			// focus的时候
			scannerAutoInput() {
				// this.idHeadFocused = !this.idHeadFocused
				// 聚焦时发送scanner-start事件，父组件拿来重置输入框
				this.$emit('scanner-start')
				//扫描枪自动填充的主逻辑
				if (!this.scannerInterval) {
					let lastLen = 0, count = 0
					this.scannerInterval = setInterval(() => {
						const len = this.scannerInput.length
						console.log('start scanner', len)
						
						if (len > 0) {
							if (len === lastLen) {
								count ++
							}
							else {
								lastLen = len
								count = 1
							}
						}
						if (count > 1) {//一个字符长度出现2次即表示一次扫描结束
							// 一段值发送一次事件
							this.$emit('scanner-input', this.scannerInput)
							// 发送完之后的重置工作
							this.scannerInput = ''
							lastLen = 0
							count = 0
						}
					}, this.SCAN_GAP)//循环间隔毫秒
				}
				// focus完自动关闭键盘，防止手动拿键盘输入
				//因为扫描枪是没有键盘的，所以对扫描枪无效
				this.hideKeyboard()
			},
			// blur时
			clearScannerInterval() {
				// this.idHeadFocused = !this.idHeadFocused
				// 防止手动输入其他值，事实上因为聚焦后自动关闭键盘，所以这种情况很难出现
				setTimeout(() => {
					this.scannerInput = ''
				}, this.SCAN_GAP)
				// 清除interval
				if (this.scannerInterval) {
					clearInterval(this.scannerInterval)
					this.scannerInterval = null
					console.log('end scanner')
				}
			},
		},
	}
</script>

<style>
	.stl-win {
		border-bottom: 1rpx solid #d9d9e1;
		padding-bottom: 2rpx;
		margin-bottom: 6rpx;
	}
	.stl-item {
		display: flex;
		align-items: center;
	}
	.stl-ch {
		width: 50rpx;
		text-align: center;
	}
	.stl-status {
		width: 60rpx;
		text-align: center;
	}
	.stl-id {
		width: 200rpx;
		text-align: center;
		display: flex;
		justify-content: center;
	}
	.stl-id-input {
		border: 1rpx dotted #ceced6;
		border-radius: 2rpx;
		width: 180rpx;
	}
	.stl-name {
		width: 110rpx;
		text-align: center;
	}
	.stl-name-input {
		border-bottom: 1rpx dotted #ceced6;
	}
	.stl-round {
		width: 40rpx;
		text-align: center;
	}
	.stl-score {
		width: 140rpx;
		text-align: center;
		display: flex;
		justify-content: center;
	}
	.stl-score-header {
		display: flex;
		align-items: center;
	}
	.stl-score-input {
		border: 1rpx dotted #ceced6;
		border-radius: 2rpx;
		width: 120rpx;
	}
	.stl-score-input-edit {
		border-color: red;
	}
	.input-placeholder {
		color: #d9d9df;
	}
	.stl-header {
		color: #007AFF;
	}
	.stl-id-placeholder {
		color: #007AFF;
		font-size: small;
		padding-top: 2rpx;/* 把“个人编号”四个字稍微垂直居中 */
	}
</style>
