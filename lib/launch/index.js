'use strict'
/**
 * 导出整个守护进程对象
 */
module.exports = launchDaemon
/**
 * 启动守护进程 基于 类 win 系统
 * @type       {Function}
 */
const launchDaemonByWin = require('./launch-by-win.js')
/**
 * 启动守护进程 基于 类 unix 系统
 * @type       {Function}
 */
const launchDaemonByUnix = require('./launch-by-unix.js')
/**
 * 获取守护进程启动文件的路径
 * @type       {Function}
 */
const getEnterFilePath = require('./get-enter-file-path.js')
/**
 * 启动守护进程
 */
function launchDaemon () {
  /**
   * 判断是否不启动守护进程而直接启动守护程序
   */
  if (process.env.EASYCMS_NO_DAEMON) {
    return getEnterFilePath()
      .then(path => require(path)())
  } else {
    return launchDaemonByChildProcess()
  }
}
function launchDaemonByChildProcess () {
  // winNt内核
  if (process.platform === 'win32' || process.platform === 'win64') {
    return launchDaemonByWin()
  } else {
    // Unix内核
    return launchDaemonByUnix()
  }
}
