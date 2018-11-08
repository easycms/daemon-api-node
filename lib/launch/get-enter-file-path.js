'use strict'
/**
 * 导出整个守护进程对象
 */
module.exports = getEnterFilePath
/**
 * 获取的一个后台守护进程的入口
 *
 * @return     {<type>}  The enter file path.
 */
function getEnterFilePath () {
  if (process.env.EASYCMS_DAEMON_ENTER_FILE) {
    return Promise.resolve(process.env.EASYCMS_DAEMON_ENTER_FILE)
  }
  return Promise.resolve()
    .then(() => {
      try {
        return require.resolve('@easyke/daemon')
      } catch (e) {
        return Promise.reject(e)
      }
    })
    .then(path => {
      process.env.EASYCMS_DAEMON_ENTER_FILE = path
      return process.env.EASYCMS_DAEMON_ENTER_FILE
    })
}
