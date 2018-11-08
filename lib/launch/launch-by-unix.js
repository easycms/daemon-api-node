'use strict'
/**
 * 启动后台守护线程 Unix内核
 */
module.exports = launchDaemonByUnix
// 文件模块
const fs = require('fs')
const path = require('path')
// 子进程模块
const childProcess = require('child_process')
// 调试
const debug = require('debug')('easycms:daemon:launch:unix')
const { unserialize } = require('../utils/error.serialize.js')
/**
 * 启动后台守护线程 Unix内核
 */
function launchDaemonByUnix () {
  let daemon = void 0
  let daemonTimer = void 0
  // 试图启动守护进程的提示
  debug('Try launchDaemonByUnix')
  // 实例化一个承诺
  return new Promise((resolve, reject) => {
    let onDaemonMessage = message => {
      // 消息
      debug('onDaemonMessage', message)
      if (typeof message === 'object' && message.easycmsIpcCb === true) {
        if (typeof daemon !== typeof void 0 && typeof daemon.removeListener === 'function') {
          // 解除进程通讯消息事件
          daemon.removeListener('message', onDaemonMessage)
          // 解除守护退出的时候事件
          daemon.removeListener('exit', onDaemonClose)
          // 解除守护进程关闭事件
          daemon.removeListener('close', onDaemonClose)
          // 解除错误事件
          daemon.removeListener('error', onDaemonError)
          try {
            debug('Try daemon.disconnect')
            // 试图断开ipc连接
            daemon.disconnect()
          } catch (e) {
            debug('Try daemon.disconnect', e)
          }

          daemon = onDaemonMessage = void 0
        }
        if (message.error) {
          reject(message.error)
        } else if (message.e) {
          reject(unserialize(message.e))
        } else {
          resolve(message && message.res)
        }
        reject = resolve = void 0
      }
    }
    let onDaemonClose = (code, signal) => {
      // 错误提示
      debug(`closeOrExit - code:${code} - signal:${signal}`)
      if (typeof reject === 'function') {
        reject(new Error(signal || (`daemon closeOrExit - code:${code} - signal:${signal}`)))
      }
      try {
        // 试图断开ipc连接
        daemon.disconnect()
      } catch (e) {}
      resolve = reject = void 0
    }
    let onDaemonError = e => {
      // 错误提示
      debug('error', e)
      if (typeof reject === 'function') {
        reject(e)
      }
      try {
        // 试图断开ipc连接
        daemon.disconnect()
      } catch (e) {}
      debug('daemon.connected:' + daemon.connected)
      resolve = reject = void 0
    }
    // 判断是否把cli的 标准输出 和 错误输出  是否使用文件还是try终端
    const isFileStdio = Boolean(!process.env.TRAVIS)
    // 打印调试信息
    debug('isFileStdio: ' + isFileStdio)
    /**
     * Redirect EASYCMS
     * internal err and out to STDERR STDOUT when running with Travis
     */
    const stdio = ['ipc'].concat(
      (isFileStdio
        ? [
          fs.openSync(process.env.EASYCMS_DAEMON_OUT_LOG_FILE_PATH, 'a'),
          fs.openSync(process.env.EASYCMS_DAEMON_ERR_LOG_FILE_PATH, 'a')
        ]
        : [
          process.stdout,
          process.stderr
        ])
    )
    // 工作目录
    const cwd = process.env.EASYCMS_CWD || process.env.PWD || process.cwd()
    // 取得先用参数
    const argv = [require.resolve('./child-daemon-process.js')]
    console.log(argv)
    // node的可执行文件
    const execPath = process.argv[0] || process.env.NODE_EXEC_PATH || process.env.NODE_PATH || process.execPath || 'node'
    // 手动垃圾回收模块
    argv.unshift('--expose-gc')
    // 启动守护线程
    daemon = childProcess.spawn(
      // 命令行运行文件
      execPath,
      // 命令行传参
      argv,
      // 配置项
      {
        // 子进程将会被作为新进程组的leader
        detached: true,
        // 工作目录
        cwd,
        // 环境变量
        env: Object.assign({
          // 在守护进程启动成功的时候，直接通过ipc发送状态
          'EASYCMS_DAEMONO_LAUNCH_IPC_CALLBACK': 'true',
          'EASYCMS_NO_RUN_DAEMON': 'true',
          // 使用颜色
          'DEBUG_COLORS': 'true'
        }, process.env),
        // 输入输出
        stdio
        // Number 设置用户进程的ID
        // uid:,
        // Number 设置进程组的ID
        // gid:
      }
    )
    // 关闭指针
    if (isFileStdio) {
      fs.closeSync(stdio[1])
      fs.closeSync(stdio[2])
    }
    stdio.length = 0
    // 绑定错误事件
    daemon.once('error', onDaemonError)
    // 绑定守护退出的时候事件
    daemon.once('exit', onDaemonClose)
    // 绑定守护进程关闭事件
    daemon.once('close', onDaemonClose)
    // 绑定进程通讯消息事件
    daemon.on('message', onDaemonMessage)
    // 父进程的事件循环引用计数中去除这个子进程
    daemon.unref()
    // 超时
    daemonTimer = setTimeout(() => {
      // 错误提示
      debug('timeout')
      onDaemonMessage({
        easycmsIpcCb: true,
        error: new Error('启动守护进程超时')
      })
    }, ((+process.env.EASYCMS_DAEMON_LAUNCH_TIMEOUT) || 3) * 1000)
  })
    .then(res => {
      clearTimeout(daemonTimer)
      daemonTimer = daemon = void 0
      return res
    }, e => {
      clearTimeout(daemonTimer)
      daemonTimer = daemon = void 0
      return Promise.reject(e)
    })
}
