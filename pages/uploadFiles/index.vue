<template>
	<view class="uf-win">
		<!-- 主体 -->
		<view class="uf-body">
			<!-- 使用说明 -->
			<view class='uf-tutorial'>
				<text>
					使用说明：
					1. 在电脑的汇洋软件上开启本地服务器<br>
					2. 让平板和电脑连接<text style="font-weight: bolder; color: #007AFF;">同一个WiFi</text><br>
					3. 在下方输入本地服务器的IP地址<!-- 和端口号 --><br>
					4. 点击<text style="text-decoration: underline;">选择文件</text>选择要传给电脑的文件
				</text>
			</view>
			<!-- 表单 -->
			<view>
				<view class="uf-input">
					<text class='uf-input-label'>请输入IP地址：</text>
					<input placeholder="例如 192.168.0.1"
					class='uf-input-item'
					style="color: #007AFF;"
					:value='host'
					@confirm="confirmHost"
					@blur='blurHost'
					maxlength='15'
					/>
				</view>
				
				<view class="uf-input"
				style="visibility: hidden;">
					<text class='uf-input-label'>请输入端口号：</text>
					<input
					disabled
					placeholder="例如 12345"
					class='uf-input-item'
					type="number"
					:value='port'
					@confirm="confirmPort"
					@blur='blurPort'
					maxlength='8'
					/>
				</view>
			</view>
			<!-- 进度条 -->
			<view class="uf-progress">
				<view class="uf-progress-bar">
					<progress
					v-show="uploadPercent"
					:percent="uploadPercent"
					stroke-width="2"
					activeColor='#007AFF'></progress>
				</view>
				<view>
					<text class="uf-progress-txt">{{uploadState}}</text>
				</view>
			</view>
			<!-- 按钮 -->
			<view class="uf-btn">
				<button
				@click="chooseFiles">
					选择文件
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	const filesChooser = uni.requireNativePlugin('K-ChooseFilesModule')
	
	export default {
		data() {
			return {
				host: '',
				port: 0,
				uploadPercent: 0,//也用作v-show的布尔判断
				uploadState: ''
			}
		},
		computed: {
			url() {
				return `http://${this.host}:${this.port}/upload`
			}
		},
		onLoad() {
			this.host = uni.getStorageSync('upload_files_host') || '192.168.'
			this.port = uni.getStorageSync('upload_files_port') || 55555
		},
		methods: {
			confirmHost(ev) {
				this.host = ev.target.value
				uni.hideKeyboard()
			},
			confirmPort(ev) {
				this.port = ev.target.value
				uni.hideKeyboard()
			},
			//失焦也赋值
			blurHost(ev) {
				this.host = ev.target.value
			},
			blurPort(ev) {
				this.port = ev.target.value
			},
			chooseFiles() {
				const opts = {
					btnText: "传输文件",
					// fileTypes: []
				}
				filesChooser.chooseFileAction(opts, async result => {
					const files = result.data.map(el => {
						const rawName = el.split('/').slice(-1)[0]
						//有的文件名没有扩展名也就没有点号，区分对待
						//存在边界情况未处理，文件名有点号但不是扩展名的点号，这里暂不做处理
						const extAt = rawName.lastIndexOf('.') === -1 ? rawName.length : rawName.lastIndexOf('.')
						const nowTime = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(2, -5).replace(/:/g, '-')
						const fileName = `${rawName.slice(0, extAt)}_${nowTime}${rawName.slice(extAt)}`
						return {
							name: fileName,
							uri: `file://${el}`
						}
					})
					//分批上传，每次传step个文件
					const filesArr = []
					for (let begin = 0, step = 5; begin < files.length; begin += step) {
						filesArr.push(files.slice(begin, begin + step))
					}
					//初始进度
					this.uploadPercent = 1
					this.uploadState = `进度：${this.uploadPercent - 1} %`
					//分批上传
					for (let i = 0, goOn = true; i < filesArr.length && goOn; i ++) {
						const [err, res] = await uni.uploadFile({
							url: this.url,
							files: filesArr[i]
						})
						//如果服务器返回status === 'ok'
						if (res && JSON.parse(res.data).status === 'ok') {
							this.uploadPercent = Math.ceil(100 * (i + 1) / filesArr.length)
							this.uploadState = `进度：${this.uploadPercent - 1} %`
							//如果进度到100则显示完成
							if (this.uploadPercent === 100) {
								this.uploadPercent = 0
								this.uploadState = '完成！'
								uni.setStorage({
									key: 'upload_files_host',
									data: this.host,
								})
								uni.setStorage({
									key: 'upload_files_port',
									data: this.port,
								})
							}
						}
						else {
							//更改哨兵值
							goOn = false
							this.uploadPercent = 0
							this.uploadState = '失败！'
						}
					}
				})
			},
		}
	}
</script>

<style>
	.uf-win {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.uf-body {
		color: #47474a;
		margin-top: 20rpx;
	}
	.uf-tutorial {
		width: 200rpx;
		margin-bottom: 20rpx;
		font-size: small;
	}
	.uf-progress {
		text-align: center;
		margin-bottom: 10rpx;
	}
	.uf-progress-bar {
		height: 10rpx;
	}
	.uf-progress-txt {
		display: inline-block;
	}
	.uf-btn {
		display: flex;
	}
	.uf-input {
		width: 200rpx;
	}
	.uf-input-label {
		font-size: large;
	}
	.uf-input-item {
		border: 2px solid #ceced6;
		border-radius: 4px;
		margin-top: 5rpx;
		margin-bottom: 20rpx;
	}
</style>
