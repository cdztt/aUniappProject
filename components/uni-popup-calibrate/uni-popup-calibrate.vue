<template>
	<view class="uni-popup-calibrate">
		<view class="uni-calibrate-title">
			<text :class="['uni-calibrate-title-text', 'uni-popup__info']">人为触发一次传感器，完成对该道的校准；</text>
			<text :class="['uni-calibrate-title-text', 'uni-popup__info']">不能在瞬间连续触发多次，不能同时触发多道；</text>
			<text :class="['uni-calibrate-title-text', 'uni-popup__info']"><span class='calibrate-color'>传感器重新开机后必须校准</span>，可单独校准某一道。</text>
		</view>
		<view class="uni-calibrate-content">
			<text class="uni-calibrate-content-text">
				道次
			</text>
			<text class="uni-calibrate-content-text">
				上次校准时间
			</text>
			<text class="uni-calibrate-content-text calibrate-color">
				本次校准时间
			</text>
		</view>
		<view v-for="sensor in sensorCalibrateArr"
		:key='sensor.num'
		class="uni-calibrate-content">
			<text class="uni-calibrate-content-text">
				{{sensor.num}}
			</text>
			<text class="uni-calibrate-content-text">
				{{sensor.lastCalibrateTime}}
			</text>
			<text class="uni-calibrate-content-text calibrate-color" style="font-weight: bold;">
				{{sensor.currentCalibrateTime}}
			</text>
		</view>
		<view class="uni-calibrate-button-group">
			<view class="uni-calibrate-button">
				<button @click="onAuto"
				size="mini"
				class="cali-btn"
				hover-class='cali-btn-hover'>
					自动校准
				</button>
			</view>
			<view class="uni-calibrate-button">
				<button @click="onOk"
				size="mini"
				class="cali-btn"
				hover-class='cali-btn-hover'>
					确定
				</button>
			</view>
		</view>

	</view>
</template>

<script>
	export default {
		name: "uniPopupCalibrate",
		props: {
			sensorCalibrateArr: {
				type: Array,
				default: []
			},
		},
		inject: ['popup'],
		created() {
			// 对话框遮罩不可点击
			this.popup.mkclick = false
		},
		methods: {
			/**
			 * 点击确认按钮
			 */
			onOk() {
				this.$emit('confirm', () => {
					this.popup.close()
				})
			},
			onAuto() {
				this.$emit('auto')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.uni-popup-calibrate {
		width: 400rpx;		//白色窗口总宽度
		border-radius: 15px;
		background-color: #fff;
	}

	.uni-calibrate-title {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: column;
		align-items: baseline;
		margin-left: 90rpx;		//这个距离是为了不让说明文字紧贴左侧
		padding: 5rpx 0;
	}

	.uni-calibrate-title-text {
		font-size: 12px;
		font-weight: 500;
	}

	.uni-calibrate-content {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		justify-content: center;
		margin-bottom: 5rpx;
	}

	.uni-calibrate-content-text {
		text-align: center;
		font-size: 14px;
		color: #6e6e6e;
		width: 110rpx;		//每一列的宽度
		border-bottom: 1rpx dotted #ceced6;
	}

	.uni-calibrate-button-group {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: center;
		border-top-color: #ceced6;
		border-top-style: solid;
		border-top-width: 1rpx;
		margin-top: 10rpx;
	}

	.uni-calibrate-button {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: center;
		align-items: center;
		height: 40rpx;
		width: 160rpx;
	}
	
	.uni-popup__success {
		color: $uni-color-success;
	}

	.uni-popup__warn {
		color: $uni-color-warning;
	}

	.uni-popup__error {
		color: $uni-color-error;
	}

	.uni-popup__info {
		color: #909399;
	}
	.calibrate-color {
		color: rgba(170, 170, 127, 1.0);
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
