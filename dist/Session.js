'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('./util');

var _SubscriptionManager = require('./SubscriptionManager');

// A Session encapsulates a RethinkDB connection and active queries that React
// components are currently subscribed to. You can have multiple independent
// Sessions (useful for isomorphic apps), or you can use the DefaultSession
// singleton for convenience. Each rethink mixin must be associated with a
// Session. The DefaultMixin singleton is associated with DefaultSession.
//
// Call connect() to open a RethinkDB websocket connection, and close() to
// disconnect. Call runQuery() to run a RethinkDB query on the connection,
// returning a Promise with the results. You must call connect() before calling
// runQuery() or mounting a component using a mixin for this session. You do
// not have to wait for it to finish connecting, as it will automatically wait
// on the connection promise.
//
// Call onceDoneLoading() with a callback to be notified when there are no
// active queries waiting on results.
//
// You may reopen a closed session. A typical use case is to have one session
// per application (likely DefaultSession), to call connect() when the user
// authenticates (including authentication information in the path), and
// close() when the user signs out.
//
// The exported MetaSession function allows dependency injection of
// RethinkdbWebsocketClient, so that we can the resulting Session class work in
// either node.js or the browser.

var MetaSession = function MetaSession(RethinkdbWebsocketClient) {
  var Promise = RethinkdbWebsocketClient.Promise;
  var _connect = RethinkdbWebsocketClient.connect;

  return (function () {
    function Session() {
      _classCallCheck(this, Session);

      var runQueryFn = this.runQuery.bind(this);
      this._connPromise = null;
      this._subscriptionManager = new _SubscriptionManager.SubscriptionManager(runQueryFn);
    }

    _createClass(Session, [{
      key: 'connect',
      value: function connect(_ref) {
        var _this = this;

        var host = _ref.host;
        var port = _ref.port;
        var path = _ref.path;
        var wsProtocols = _ref.wsProtocols;
        var wsBinaryType = _ref.wsBinaryType;
        var secure = _ref.secure;
        var db = _ref.db;
        var simulatedLatencyMs = _ref.simulatedLatencyMs;
        var autoReconnectDelayMs = _ref.autoReconnectDelayMs;

        (0, _util.ensure)(!this._connPromise, 'Session.connect() called when connected');
        var connectAfterDelay = function connectAfterDelay(delayMs) {
          var options = { host: host, port: port, path: path, wsProtocols: wsProtocols, wsBinaryType: wsBinaryType, secure: secure, db: db, simulatedLatencyMs: simulatedLatencyMs };
          _this._connPromise = new Promise(function (resolve, reject) {
            setTimeout(function () {
              _connect(options).then(resolve, reject);
            }, delayMs);
          });
          var onClose = function onClose() {
            _this._subscriptionManager.handleDisconnect();
            // Don't trigger on client initiated Session.close()
            if (_this._connPromise) {
              console.warn('RethinkDB WebSocket connection failure.', 'Reconnecting in ' + autoReconnectDelayMs + 'ms');
              connectAfterDelay(autoReconnectDelayMs);
            }
          };
          if (autoReconnectDelayMs !== undefined) {
            _this._connPromise.then(function (conn) {
              return conn.on('close', onClose);
            }, onClose);
          }
          _this._connPromise.then(function () {
            return _this._subscriptionManager.handleConnect();
          });
        };
        connectAfterDelay(0);
      }
    }, {
      key: 'close',
      value: function close() {
        (0, _util.ensure)(this._connPromise, 'Session.close() called when not connected');
        this._connPromise.then(function (conn) {
          return conn.close();
        });
        this._connPromise = null;
      }
    }, {
      key: 'runQuery',
      value: function runQuery(query, options) {
        (0, _util.ensure)(this._connPromise, 'Must connect() before calling runQuery()');
        // Rather than calling query.run(c), we create a new rethinkdb term and
        // use its run function. That way, if the provided query comes from a
        // different RethinkdbWebsocketClient, it'll run using the current
        // environment. This is mainly to workaround an instanceof check in the
        // rethinkdb driver.

        var _ref2 = new RethinkdbWebsocketClient.rethinkdb(null);

        var run = _ref2.run;

        return this._connPromise.then(function (c) {
          return run.bind(query)(c, options || {});
        });
      }
    }, {
      key: 'onceDoneLoading',
      value: function onceDoneLoading(callback) {
        this._subscriptionManager.onceDoneLoading(callback);
      }
    }]);

    return Session;
  })();
};
exports.MetaSession = MetaSession;