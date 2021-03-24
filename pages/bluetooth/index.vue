<template>
	<view>
		<text>
			fuck world
		</text>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				serviceId: '',
				characteristicId: '',
			}
		},
		onLoad() {
			uni.openBluetoothAdapter({
				success(res) {
					console.log(res)
				}
			})
			uni.startBluetoothDevicesDiscovery({
				success(res) {
					console.log(res)
				}
			})
			uni.onBluetoothDeviceFound(res => {
				const deviceId = res.devices[0].deviceId
				console.log(deviceId)
				uni.createBLEConnection({
					deviceId,
					success(res) {
						console.log(res)
						// uni.getBLEDeviceServices({
						// 	deviceId,
						// 	success(res) {
						// 		console.log(res)
						// 	}
						// })
						uni.getBLEDeviceCharacteristics({
							deviceId,
							success(res) {
								console.log(res)
							},
							fail(err) {
								console.log(err)
							}
						})
					}
				})
			})
		},
	}
</script>

<style>
</style>
