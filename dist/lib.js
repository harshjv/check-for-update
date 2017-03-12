'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');

var semver = require('semver');
var request = require('request');
var parse = require('parse-github-repo-url');

var CheckForUpdate = function (_EventEmitter) {
  _inherits(CheckForUpdate, _EventEmitter);

  function CheckForUpdate(config) {
    _classCallCheck(this, CheckForUpdate);

    var _this = _possibleConstructorReturn(this, (CheckForUpdate.__proto__ || Object.getPrototypeOf(CheckForUpdate)).call(this));

    if (!config) throw new Error('No configuration is supplied');

    _this.config = Object.assign({
      packageJSON: null,
      repositoryURL: null,
      currentVersion: null,
      checkOnLaunch: true,
      intervalHrs: 12
    }, config);

    if (_this.config.packageJSON) {
      _this.config.repositoryURL = _this.config.packageJSON.repository;
      _this.config.currentVersion = _this.config.packageJSON.version;
    }

    if (!(_this.config.repositoryURL && _this.config.currentVersion)) {
      throw new Error('No repositoryURL or currentVersion provided in configuration');
    }

    var parsedRepo = parse(_this.config.repositoryURL);

    if (!parsedRepo) {
      throw new Error('Invalid Github repository url');
    }

    if (~_this.config.repositoryURL.indexOf('://') && !~_this.config.repositoryURL.indexOf('://github.com/') || ~_this.config.repositoryURL.indexOf('git@') && !~_this.config.repositoryURL.indexOf('github.com:')) {
      throw new Error('Invalid Github repository url');
    }

    try {
      _this.config.currentVersion = semver.clean(_this.config.currentVersion);
    } catch (e) {
      throw new Error('Invalid current version of repository');
    }

    var _parsedRepo = _slicedToArray(parsedRepo, 2),
        user = _parsedRepo[0],
        repo = _parsedRepo[1];

    _this.userRepo = user + '/' + repo;
    _this.apiURL = 'https://api.github.com/repos/' + _this.userRepo + '/releases/latest';

    if (_this.config.checkOnLaunch) {
      process.nextTick(function () {
        _this.now();
      });
    }
    return _this;
  }

  _createClass(CheckForUpdate, [{
    key: 'start',
    value: function start() {
      var _this2 = this;

      this.intervalHandler = setInterval(function () {
        _this2.now();
      }, this.config.intervalHrs * 60 * 60 * 1000);
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this.intervalHandler) clearInterval(this.intervalHandler);
    }
  }, {
    key: 'now',
    value: function now() {
      var ref = this;

      request({
        url: ref.apiURL,
        headers: {
          'User-Agent': 'harshjv/check-for-update'
        }
      }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var data = void 0;

          try {
            data = JSON.parse(body);
          } catch (e) {
            ref.emit('error', 'Unable to parse Github response at ' + ref.apiURL);
          }

          if (data) {
            try {
              var newVersion = semver.clean(data.tag_name);

              if (semver.gt(newVersion, ref.config.currentVersion)) {
                ref.emit('update_available', {
                  currentVersion: ref.config.currentVersion,
                  newVersion: newVersion,
                  repoURL: 'https://github.com/' + ref.userRepo,
                  updateURL: 'https://github.com/' + ref.userRepo + '/releases/tag/' + data.tag_name
                });
              }
            } catch (e) {
              ref.emit('error', 'Unable to parse new version data');
            }
          }
        } else {
          ref.emit('error', 'Something went wrong while fetching update details');
        }
      });
    }
  }]);

  return CheckForUpdate;
}(EventEmitter);

module.exports = CheckForUpdate;