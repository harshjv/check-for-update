# 🔄 Check For Update

> **Heads up!** This works ***only*** with **Github** repositories that follows **[semver](http://semver.org)**.

Check for update manually or at configured interval with minimum configuration.


## API


### cfu = new CheckForUpdate(config)

Create `CheckForUpdate` instance with provided configuration.


```js
{
  packageJSON: Object,      // package.json object (optional when repositoryURL and currentVersion is given)
  repositoryURL: String,    // Github repository URL (optional when packageJSON is given)
  currentVersion: String,   // Current version of software (optional when packageJSON is given)
  checkOnLaunch: Boolean,   // Check for update when object is initiated
  intervalHrs: Number       // Interval to check for update in hours
}
```

### cfu.on('update_available', ({ currentVersion, newVersion, repoURL, updateURL }) => {})

Emitted when a new version/update is available.


### cfu.on('error', (error) => {})

Emitted when client encounters an error.


## Example

```js
const CheckForUpdate = require('check-for-update')

const cfu = new CheckForUpdate({
  packageJSON: require('./package.json'),
  checkOnLaunch: true,
  intervalHrs: 12
})

// or

const cfu = new CheckForUpdate({
  repositoryURL: 'harshjv/donut',
  currentVersion: '1.2.3',
  checkOnLaunch: true,
  intervalHrs: 12
})

cfu.on('error', (data) => console.error(data))

cfu.on('update_available', (data) => {
  const { currentVersion, newVersion, repoURL, updateURL } = data

  // ...
})
```

To start checking for update manually (or when `checkOnLaunch` is `false`);

```js
cfu.start()
```

To stop update checker;

```js
cfu.stop()
```


## License

MIT
