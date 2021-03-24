<template>
	<view>
		<button
		@click="uploadFilesViaCloud">
			上传文件
		</button>
		<button
		@click="loginTCB">
			登录tcb
		</button>
	</view>
</template>

<script>
	import cloudbase from '@cloudbase/js-sdk'
	
	// const app = cloudbase.init({
	// 	env: 'dan-1d7bba'
	// })
	// const auth = app.auth()
	
	export default {
		methods: {
			uploadFilesViaCloud() {
				uni.request({
					url: 'http://hugyoung.club/uploadData',
					data: [
						{
							name: 'chendan'
						},
					],
					method: 'POST',
					success(res) {
						console.log(res.data)
					},
					fail(err) {
						console.log(err)
					}
				})
			},
			async loginTCB() {
				console.log('tcb')
				// await auth.anonymousAuthProvider().singIn()
				// const loginState = await auth.getLoginState()
				// console.log(loginState.isAnonymousAuth)
			},
		},
	}
</script>

<style>
</style>
