const CheckForUpdate = require('./')

const cfu = new CheckForUpdate({
  repositoryURL: 'harshjv/donut',
  currentVersion: '1.2.3'
})

cfu.on('error', (data) => console.error(data))
cfu.on('update_available', (data) => console.log(data))
