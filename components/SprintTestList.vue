<template>
	<view class='ptl-win'>
		<view class='ptl-item'>
			<!-- 外设道次 -->
			<view class='ptl-ch'>
				<text
					v-if='!header'>
					第
					<text style="color: #007AFF; font-weight: 600;"
					v-text='" " + testListItem.sensorNum + " "'></text>
					道
				</text>
				<text class='ptl-header'
					v-else>
					道次
				</text>
			</view>
			<!-- 测试状态 -->
			<view class='ptl-status'>
				<text style='color: #007AFF; font-size: small;'
					v-if='!header'>
					{{testListItem.printedState}}
				</text>
				<text class='ptl-header'
					v-else>
					状态
				</text>
			</view>
			<!-- 用户id -->
			<view class='ptl-id'>
				<input class='ptl-id-input'
					v-if='!header'
					type="text"
					placeholder="请输入唯一值"
					maxlength='30'
					v-model="testListItem.personId"
					@confirm="hideKeyboard"
				/>
				<text class='ptl-header'
					v-else>
					个人编号
				</text>
			</view>
			<!-- 姓名 -->
			<view class='ptl-name'>
				<input class="ptl-name-input"
					v-if='!header'>
				</input>
				<text class='ptl-header'
					v-else>
					姓名
				</text>
			</view>
			<!-- 成绩和编辑 -->
			<view class='ptl-score'>
				<input :class="['ptl-score-input', {'ptl-score-input-edit': resultEditable}]"
					type='number'
					v-if='!header'
					maxlength='10'
					:disabled='!resultEditable'
					v-model="testListItem.examResult"
				/>
				<view class="ptl-score-header"
					v-else>
					<text class='ptl-header'>
						成绩（秒）
					</text>
					<button
						size="mini"
						@click="switchEditable"
						v-text="editable ? '锁定' : '编辑'">
					</button>
				</view>
			</view>
			<!-- 轮次 -->
			<view class="ptl-round">
				<text
					v-if='!header'>
					{{testListItem.round}}
				</text>
				<text class='ptl-header'
					v-else>
					轮次
				</text>
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
		],
		data() {
			return {
				editable: this.resultEditable,
			}
		},
		methods: {
			switchEditable() {
				this.editable = !this.editable
				this.$emit('update-resultEditable', this.editable)
			},
			hideKeyboard() {
				uni.hideKeyboard()
			},
		},
	}
</script>

<style>
	.ptl-win {
		border-bottom: 1rpx solid #d9d9e1;
		padding-bottom: 2rpx;
		margin-bottom: 6rpx;
	}
	.ptl-item {
		display: flex;
		align-items: center;
	}
	.ptl-ch {
		width: 50rpx;
		text-align: center;
	}
	.ptl-status {
		width: 50rpx;
		text-align: center;
	}
	.ptl-id {
		width: 200rpx;
		text-align: center;
		display: flex;
		justify-content: center;
	}
	.ptl-id-input {
		border: 1rpx dotted #ceced6;
		border-radius: 2rpx;
		width: 180rpx;
	}
	.ptl-name {
		width: 100rpx;
		text-align: center;
	}
	.ptl-name-input {
		border-bottom: 1rpx dotted #ceced6;
	}
	.ptl-round {
		width: 40rpx;
		text-align: center;
	}
	.ptl-score {
		width: 140rpx;
		text-align: center;
		display: flex;
		justify-content: center;
	}
	.ptl-score-header {
		display: flex;
		align-items: center;
	}
	.ptl-score-input {
		border: 1rpx dotted #ceced6;
		border-radius: 2rpx;
		width: 120rpx;
	}
	.ptl-score-input-edit {
		border-color: red;
	}
	.input-placeholder {
		color: #e7e7ee;
	}
	.ptl-header {
		color: #007AFF;
	}
</style>
