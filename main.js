import Vue from 'vue'
import App from './App'
import socket from './utils/socket.js'

Vue.prototype.$socket = socket
Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
