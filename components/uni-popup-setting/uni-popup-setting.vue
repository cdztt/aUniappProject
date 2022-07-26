<template>
	<view class="uni-popup-setting">
		<!-- 总道次 -->
		<view class="uni-popup-setting-picker">
			<view>设置最大道次</view>
			<view class="picker-row">
				<text class='picker-col'>当前选择</text>
				<view class='picker-col'>
					<picker
					:range="lane"
					:value="lanePickerIndex"
					@change="onLanePickerChange">
						<view>
							<text class="picker-value">{{maxLane}}</text>
							<uni-icons type="arrowdown"></uni-icons>
						</view>
					</picker>
				</view>
			</view>			
		</view>
		<!-- 超时时间 -->
		<view>
			<view>设置超时时间(秒)</view>
			<view class="picker-row">
				<text class='picker-col'>当前选择</text>
				<view class='picker-col'>
					<picker
					:range="timeout"
					:value="timeoutPickerIndex"
					@change="onTimeoutPickerChange">
						<view>
							<text class="picker-value">{{timeoutValue}}</text>
							<uni-icons type="arrowdown"></uni-icons>
						</view>
					</picker>
				</view>
			</view>			
		</view>
		<!-- 确定按钮 -->
		<view class="btn-row">
			<view>
				<button @click="onCancel"
				size="mini"
				type="default">
					取消
				</button>
			</view>
			<view>
				<button @click="onOk"
				size="mini"
				type="default">
					确定
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: "uniPopupSetting",
		data() {
			return {
				lane: [1, 2, 3, 4, 5, 6, 7, 8],
				lanePickerIndex: 7,
				timeout: [15, 25, 35, 45, 55, 65],
				timeoutPickerIndex: 0,
			}
		},
		props: {
			max_lane: {
				type: Number,
				default: 8
			},
			timeout_value: {
				type: Number,
				default: 15
			}
		},
		inject: ['popup'],
		created() {
			// 对话框遮罩不可点击
			this.popup.mkclick = false
		},
		mounted() {
			this.lanePickerIndex = this.lane.indexOf(this.max_lane)
			this.timeoutPickerIndex = this.timeout.indexOf(this.timeout_value)
		},
		computed: {
			maxLane() {
				return this.lane[this.lanePickerIndex]
			},
			timeoutValue() {
				return this.timeout[this.timeoutPickerIndex]
			}
		},
		methods: {
			onLanePickerChange(e) {
				this.lanePickerIndex = e.target.value
			},
			onTimeoutPickerChange(e) {
				this.timeoutPickerIndex = e.target.value
			},
			onCancel() {
				this.popup.close()
			},
			onOk() {
				this.$emit('confirm', () => {
					this.popup.close()
				}, this.maxLane, this.timeoutValue)
			},
		}
	}
</script>

<style>
	.uni-popup-setting {
		width: 400rpx;
		border-radius: 15px;
		background-color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.uni-popup-setting-picker {
		margin-top: 20rpx;
	}
	
	.picker-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 10rpx;
	}
	
	.picker-col {
		width: 80rpx;
		height: 40rpx;
	}
	
	.picker-value {
		margin-right: 20rpx;
		color: #007AFF;
	}
	
	.btn-row {
		margin: 10rpx 0;
		width: 400rpx;
		display: flex;
		justify-content: space-around;
	}
</style>
