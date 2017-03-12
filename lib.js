import EventEmitter from 'events'

import Debug from 'debug'
import semver from 'semver'
import request from 'request'
import parse from 'parse-github-repo-url'

const debug = Debug('check-for-update:main')

class CheckForUpdate extends EventEmitter {
  constructor (config) {
    super()

    if (!config) throw new Error('No configuration is supplied')

    this.config = Object.assign({
      packageJSON: null,
      repositoryURL: null,
      currentVersion: null,
      checkOnLaunch: true,
      intervalHrs: 12
    }, config)

    if (this.config.packageJSON) {
      this.config.repositoryURL = this.config.packageJSON.repository
      this.config.currentVersion = this.config.packageJSON.version
    }

    if (!(this.config.repositoryURL && this.config.currentVersion)) {
      throw new Error('No repositoryURL or currentVersion provided in configuration')
    }

    const parsedRepo = parse(this.config.repositoryURL)

    if (!parsedRepo) {
      throw new Error('Invalid Github repository url')
    }

    if ((
        ~this.config.repositoryURL.indexOf('://') &&
        !~this.config.repositoryURL.indexOf('://github.com/')
        ) || (
          ~this.config.repositoryURL.indexOf('git@') &&
          !~this.config.repositoryURL.indexOf('github.com:')
        )) {
      throw new Error('Invalid Github repository url')
    }

    try {
      this.config.currentVersion = semver.clean(this.config.currentVersion)
    } catch (e) {
      throw new Error('Invalid current version of repository')
    }

    const [ user, repo ] = parsedRepo

    this.userRepo = `${user}/${repo}`
    this.apiURL = `https://api.github.com/repos/${this.userRepo}/releases/latest`

    if (this.config.checkOnLaunch) {
      process.nextTick(() => {
        this.now()
      })
    }
  }

  start () {
    debug('Started checking for update periodically')

    this.intervalHandler = setInterval(() => {
      this.now()
    }, this.config.intervalHrs * 60 * 60 * 1000)
  }

  stop () {
    if (this.intervalHandler) clearInterval(this.intervalHandler)
  }

  now () {
    debug('Checking for update')

    const ref = this

    request({
      url: ref.apiURL,
      headers: {
        'User-Agent': 'harshjv/check-for-update'
      }
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let data

        try {
          data = JSON.parse(body)
        } catch (e) {
          ref.emit('error', `Unable to parse Github response at ${ref.apiURL}`)
        }

        if (data) {
          try {
            const newVersion = semver.clean(data.tag_name)

            if (semver.gt(newVersion, ref.config.currentVersion)) {
              debug('Update available')
              debug(`From v${ref.config.currentVersion} to v${newVersion}`)

              ref.emit('update_available', {
                currentVersion: ref.config.currentVersion,
                newVersion,
                repoURL: `https://github.com/${ref.userRepo}`,
                updateURL: `https://github.com/${ref.userRepo}/releases/tag/${data.tag_name}`
              })
            }
          } catch (e) {
            ref.emit('error', 'Unable to parse new version data')
          }
        }
      } else {
        ref.emit('error', 'Something went wrong while fetching update details')
      }
    })
  }
}

module.exports = CheckForUpdate
