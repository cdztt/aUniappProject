<template>
	<view class='home-win'>
		<view class='home-entries'>
			<uni-icons type="flag"></uni-icons>
			<text>
				测试项目
			</text>
			<button
			@click='navToOldSprint'>
				老50米
			</button>
			
			<button
			@click='navToSprint50'>
				50米跑
			</button>
			
			<button
			@click='navToSprint100'
			disabled>
				100米跑
			</button>
			
			<button
			@click='navToSprint200'
			disabled>
				200米跑
			</button>
			<!-- <button
			@click='navToFootball'>
				足球
			</button> -->
			<!-- <button
			@click='navToBasketball'
			disabled>
				篮球
			</button> -->
		</view>
		<view class='home-entries'>
			<uni-icons type="gear"></uni-icons>
			<text>
				工具
			</text>
			<button
			@click="navToUploadFiles">
				上传文件(局域网)
			</button>
			
			<button
			@click="navToUploadFilesViaCloud">
				上传文件(云端)
			</button>
			
			<!-- <button
			@click="navToBLE"
			>
				测试蓝牙
			</button> -->
			
		</view>
		
	</view>
</template>

<script>
	import fitnessItemMap from '../../utils/fitnessItemMap.js'
	
	export default {
		methods: {
			//导航到上传文件
			navToUploadFiles() {
				uni.navigateTo({
					url: '../uploadFiles/index'
				})
			},
			//导航到云端上传文件
			navToUploadFilesViaCloud() {
				uni.navigateTo({
					url: '../uploadFilesViaCloud/index'
				})
			},
			// //导航到新50米
			// navToSprint50() {
			// 	uni.navigateTo({
			// 		url: '../newSprint/index'
			// 	})
			// },
			//导航到新100米
			navToSprint100() {
				uni.navigateTo({
					url: '../newSprint/index'
				})
			},
			//导航到新200米
			navToSprint200() {
				uni.navigateTo({
					url: '../newSprint/index'
				})
			},
			//创建各项目文件夹并导航
			initDirectoryAndNavigate(fitnessItemName) {
				plus.io.resolveLocalFileSystemURL('/storage/emulated/0/-汇洋体测', entry => {
					//新建测试项目文件夹
					entry.getDirectory(fitnessItemMap.get(fitnessItemName).nameZH, {
						create: true
					}, entry2 => {
						//新建excel文件夹
						entry2.getDirectory('导出', {
							create: true
						}, () => {
							console.log('成功新建导出文件夹')
						}, () => { console.log('失败新建导出文件夹') })
						//导航到测试项
						uni.navigateTo({
							url: `../testGroupSetting/index?fitnessItemName=${fitnessItemName}`
						})
					}, () => { console.log('失败新建测试项目文件夹') })
				}, () => { console.log('失败打开应用文件夹') })
			},
			//导航到老50米
			navToOldSprint() {
				this.initDirectoryAndNavigate('oldSprint')
			},
			//导航到50米
			navToSprint50() {
				this.initDirectoryAndNavigate('sprint50')
			},
			navToBLE() {
				uni.navigateTo({
					url: '../bluetooth/index'
				})
			},
			//导航到足球
			// navToFootball() {
			// 	this.initDirectoryAndNavigate('football')
			// },
			// navToBasketball() {
				
			// },
		}
	}
</script>

<style>
	.home-win {
		display: flex;
		justify-content: center;
		margin-top: 20rpx;
	}
	button {
		margin: 10rpx 0;
	}
	.home-entries {
		margin: 0 20rpx;
	}
</style>
