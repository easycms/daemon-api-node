'use strict'
// 启动后台守护线程 winNt内核
module.exports = launchDaemonByWin
function launchDaemonByWin () {
  return new Promise(function launchDaemonRun (resolve, reject) {
    let config = {}
    config.EASYCMS_DAEMON_RPC_PORT = '\\\\.\\pipe\\daemon.rpc.ddv.sock'
    console.log(process.argv[0])
    console.log(process.argv[1])
    reject(new Error('开发中...'))
  })
}
