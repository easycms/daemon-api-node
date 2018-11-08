'use strict'
/**
 * 导出整个守护进程对象
 */
/**
 * 获取守护进程启动文件的路径
 * @type       {Function}
 */
const getEnterFilePath = require('./get-enter-file-path.js')
const serialize = require('../utils/error.serialize.js')

getEnterFilePath()
  .then(path => require(path)())
  .then(() => daemonCb(), e => daemonCb(e))

function daemonCb (e, res) {
  const isDaemonIpcCb = process.connected && typeof process.send === 'function' && Boolean(process.env.EASYCMS_DAEMONO_LAUNCH_IPC_CALLBACK)
  if (isDaemonIpcCb) {
    process.send({
      easycmsIpcCb: true,
      e: e ? serialize(e) : null,
      res
    })
    process.disconnect()
  } else {
    if (e) {
      console.error(e)
    } else {
      console.log('Successful startup')
    }
  }
}
