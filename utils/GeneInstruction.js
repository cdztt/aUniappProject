export default class {
	constructor(ch, prj, mst) {
		this.ch = ch
		this.prj = prj
		this.mst = mst
	}
	createInstruction(slv, f) {
		const vali = parseInt(this.ch, 16)
					^ parseInt(this.prj, 16)
					^ parseInt(this.mst, 16)
					^ parseInt(slv, 16)
					^ parseInt(f, 16)
		const bytesArr = []
		bytesArr.push(this.ch, this.prj, this.mst, slv, f)
		for (let i = 0; i < 26; i ++) {
			bytesArr.push('00')
		}
		bytesArr.push(vali.toString(16))
		return bytesArr
	}
}
