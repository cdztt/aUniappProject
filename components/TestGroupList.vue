<template>
	<view class="tgl-win">
		<view class="tgl-item">
			<view class="tgl-select">
				<text
					v-if='header'>选择</text>
				<radio
					v-else
					:value="group.groupID"
					:checked="selected"></radio>
			</view>
			
			<view class='tgl-id'>
				<text
					v-if='header'>
					组别编号
				</text>
				<text :class="{'tgl-selected': selected}"
					v-else>
					{{group.groupID}}
				</text>
			</view>
			
			<view class="tgl-name">
				<text
					v-if='header'>
					小组名称
				</text>
				<text :class="{'tgl-selected': selected}"
					v-else>
					{{group.groupName}}
				</text>
			</view>
			
			<view class='tgl-create-time'>
				<text
					v-if='header'>
					创建日期
				</text>
				<text :class="{'tgl-selected': selected}"
					v-else>
					{{group.createTime}}
				</text>
			</view>
			
			<view class='tgl-export-time'>
				<text
					v-if='header'>
					导出日期
				</text>
				<text :class="{'tgl-selected': selected}"
					v-else>
					{{group.exportTime}}
				</text>
			</view>
		</view>
		
	</view>
</template>

<script>
	export default {
		props: [
			'header',//是否是表头
			'group',//一组的数据
			'selected'//radio的checked，被选择的行高亮显示
		],
	}
</script>

<style>
	.tgl-win {
		margin-top: 8rpx;
	}
	.tgl-item {
		display: flex;
	}
	.tgl-item>view {
		text-align: center;
	}
	.tgl-select {
		width: 40rpx;
	}
	.tgl-id {
		width: 70rpx;
	}
	.tgl-name {
		width: 230rpx;
	}
	.tgl-selected {
		color: #007AFF;
		font-weight: 900;
	}
	.tgl-create-time {
		width: 120rpx;
	}
	.tgl-export-time {
		width: 120rpx;
	}
</style>
