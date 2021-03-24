<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			//创建app的应用文件夹
			plus.io.resolveLocalFileSystemURL('/storage/emulated/0', entry => {
				entry.getDirectory('-汇洋体测', {
					create: true
				}, () => {
					console.log('成功创建文件夹')
				}, () => { console.log('失败创建文件夹') })
			}, () => { console.log('失败打开平板根目录') })
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	text {
		color: #4e4e51;
	}
	button {
		color: #ffffff;
		font-weight: 600;
		background-color: rgba(32, 129, 255, 0.5);
	}
	.button-hover {
		color: #ffffff;
		font-weight: 900;
		background-color: rgba(32, 129, 255, 1.0);
	}
</style>
