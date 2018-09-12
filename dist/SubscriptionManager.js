'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _QueryState = require('./QueryState');

// SubscriptionManager tracks active QueryStates, so that two components that
// have identical queries can share a QueryState rather than initiating
// redundant database queries.
//
// The constructor takes a runQuery function from the Session. The subscribe
// method registers a component with a new QueryRequest and an QueryResult
// to write the results into. It returns an object with an unsubscribe() method
// to be called when the component is no longer interested in that
// QueryRequest.

var SubscriptionManager = (function () {
  function SubscriptionManager(runQuery) {
    _classCallCheck(this, SubscriptionManager);

    this.runQuery = runQuery;
    this.queryKeyToState = {};
    this.doneLoadingCallbacks = [];
    this.connected = false;
  }

  _createClass(SubscriptionManager, [{
    key: 'handleConnect',
    value: function handleConnect() {
      var _this = this;

      this.connected = true;
      Object.keys(this.queryKeyToState).forEach(function (queryKey) {
        var queryState = _this.queryKeyToState[queryKey];
        queryState.handleConnect();
      });
    }
  }, {
    key: 'handleDisconnect',
    value: function handleDisconnect() {
      this.connected = false;
    }
  }, {
    key: 'subscribe',
    value: function subscribe(component, queryRequest, queryResult) {
      var _this2 = this;

      var queryKey = queryRequest.toStringKey();
      var queryState = this.queryKeyToState[queryKey];
      if (!queryState) {
        var onUpdate = function onUpdate() {
          return _this2._checkDoneLoading();
        };
        var onCloseQueryState = function onCloseQueryState() {
          delete _this2.queryKeyToState[queryKey];
        };
        queryState = new _QueryState.QueryState(queryRequest, this.runQuery, onUpdate, onCloseQueryState);
        if (this.connected) {
          queryState.handleConnect();
        }
        this.queryKeyToState[queryKey] = queryState;
      }
      var subscription = queryState.subscribe(component, queryResult);
      return {
        unsubscribe: subscription.unsubscribe
      };
    }
  }, {
    key: 'onceDoneLoading',
    value: function onceDoneLoading(callback) {
      this.doneLoadingCallbacks.push(callback);
      this._checkDoneLoading();
    }
  }, {
    key: '_checkDoneLoading',
    value: function _checkDoneLoading() {
      var _this3 = this;

      if (this.doneLoadingCallbacks.length) {
        var anyLoading = false;
        Object.keys(this.queryKeyToState).forEach(function (queryKey) {
          var queryState = _this3.queryKeyToState[queryKey];
          if (queryState.loading && !queryState.errors.length) {
            anyLoading = true;
          }
        });
        if (!anyLoading) {
          this.doneLoadingCallbacks.forEach(function (cb) {
            return cb();
          });
          this.doneLoadingCallbacks = [];
        }
      }
    }
  }]);

  return SubscriptionManager;
})();

exports.SubscriptionManager = SubscriptionManager;