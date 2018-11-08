module.exports = {
  start (noDaemon) {
    this.autoConnect()
      .then(() => {
        return this.pm2.describePromise(easycmsServer.name)
          .then(list => {
            var info = null
            for (var i = 0; i < list.length; i++) {
              if (list[i].pm2_env && list[i].pm2_env.script === easycmsServer.script) {
                info = list[i]
                break
              }
            }
            if (!info) {
              return list.length > 0 ? Promise.reject(new Error(easycmsServer.name + '被占用')) : this.pm2.startPromise(easycmsServer)
            }
          }, e => {
            return this.pm2.startPromise(easycmsServer)
          })
      })
      .then(() => this.disconnect())
      .catch(e => {
        return this.disconnect()
          .then(() => Promise.reject(e))
      })
  },
  api: 'site'
}
