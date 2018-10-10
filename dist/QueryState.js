'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilJs = require('./util.js');

// A QueryState represents the state of a single RethinkDB query, which may be
// shared among multiple components subscribing to the same data. It keeps
// track of the query results, the active cursors, the subscriptions from the
// active QueryRequests, and the loading and error status.
//
// The constructor takes an QueryRequest from the components interested in
// this query, a runQuery function from the Session, an onUpdate handler
// function that is called when any QueryResults/components have updated,
// and an onCloseQueryState handler function that is called when this
// QueryState is closed (when the last component has unsubscribed).
//
// The subscribe method registers a component and its corresponding
// QueryResult so that the component will have access to the query results.
// It returns an object with an unsubscribe() method to be called when the
// component is no longer interested in this query.

var QueryState = (function () {
  function QueryState(queryRequest, runQuery, onUpdate, onCloseQueryState) {
    _classCallCheck(this, QueryState);

    this.value = undefined;
    this.loading = true;
    this.errors = [];

    this.lastSubscriptionId = 0;
    this.subscriptions = {};
    this.updateHandler = onUpdate;
    this.closeHandlers = [onCloseQueryState];
    this.queryRequest = queryRequest;
    this.runQuery = runQuery;
  }

  _createClass(QueryState, [{
    key: 'handleConnect',
    value: function handleConnect() {
      if (this.loading || this.queryRequest.changes) {
        this.loading = true;
        this.errors = [];
        this._runQuery(this.queryRequest.query, this.runQuery, this.queryRequest.changes);
      }
    }
  }, {
    key: 'subscribe',
    value: function subscribe(component, queryResult) {
      var _this = this;

      this._initQueryResult(queryResult);
      var subscriptionId = ++this.lastSubscriptionId;
      this.subscriptions[subscriptionId] = { queryResult: queryResult, component: component };
      var unsubscribe = function unsubscribe() {
        delete _this.subscriptions[subscriptionId];
        if (!Object.keys(_this.subscriptions).length) {
          _this.closeHandlers.forEach(function (handler) {
            return handler();
          });
        }
      };
      return { unsubscribe: unsubscribe };
    }
  }, {
    key: '_runQuery',
    value: function _runQuery(query, runQuery) {
      var _this2 = this;

      var changes = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var changeQuery = query.changes({ includeStates: true, includeInitial: true });
      var promise = runQuery(changes ? changeQuery : query);
      this.closeHandlers.push(function () {
        return promise.then(function (x) {
          return (0, _utilJs.isCursor)(x) && x.close();
        });
      });
      promise.then(function (cursor) {
        var isFeed = !!cursor.constructor.name.match(/Feed$/);
        if (isFeed) {
          var isPointFeed = cursor.constructor.name === 'AtomFeed';
          _this2.value = isPointFeed ? undefined : [];
          cursor.each(function (error, row) {
            if (error) {
              _this2._addError(error);
            } else {
              if (row.state) {
                if (row.state === 'ready') {
                  _this2.loading = false;
                  _this2._updateSubscriptions();
                }
              } else {
                _this2._applyChangeDelta(row.old_val, row.new_val);
              }
            }
          });
        } else {
          if ((0, _utilJs.isCursor)(cursor)) {
            cursor.toArray().then(function (result) {
              _this2._updateValue(result);
            });
          } else {
            _this2._updateValue(cursor);
          }
        }
      }, function (error) {
        if (error.msg === 'Unrecognized optional argument `include_initial`.') {
          console.error('react-rethinkdb requires rethinkdb >= 2.2 on backend');
        }
        _this2._addError(error);
      });
    }
  }, {
    key: '_initQueryResult',
    value: function _initQueryResult(queryResult) {
      if (this.loading) {
        queryResult._reset();
      } else {
        queryResult._setValue(this.value);
      }
      queryResult._setErrors(this.errors);
    }
  }, {
    key: '_updateSubscriptions',
    value: function _updateSubscriptions() {
      var _this3 = this;

      Object.keys(this.subscriptions).forEach(function (subscriptionId) {
        var subscription = _this3.subscriptions[subscriptionId];
        subscription.queryResult._setValue(_this3.value);
        subscription.queryResult._setErrors(_this3.errors);
        (0, _utilJs.updateComponent)(subscription.component);
      });
      this.updateHandler();
    }
  }, {
    key: '_addError',
    value: function _addError(error) {
      console.error(error.stack || error.message || error);
      this.errors.push(error);
      this._updateSubscriptions();
    }
  }, {
    key: '_updateValue',
    value: function _updateValue(value) {
      this.loading = false;
      this.value = value;
      this._updateSubscriptions();
    }
  }, {
    key: '_applyChangeDelta',
    value: function _applyChangeDelta(oldVal, newVal) {
      var _this4 = this;

      if (Array.isArray(this.value)) {
        // TODO Make more efficient, with O(1) hashtables with cached
        // JSON.stringify keys. But this may not be necessary after RethinkDB
        // #3714 is implemented, since the server should give us the indices.
        var oldIndex = -1;
        if (oldVal) {
          (function () {
            var lookup = JSON.stringify(oldVal);
            oldIndex = (0, _utilJs.findIndex)(_this4.value, function (x) {
              return JSON.stringify(x) === lookup;
            });
          })();
        }
        if (oldIndex < 0) {
          if (newVal) {
            this.value.push(newVal);
          } else {
            throw new Error('Change delta deleted nonexistent element');
          }
        } else {
          if (newVal) {
            this.value[oldIndex] = newVal;
          } else {
            this.value.splice(oldIndex, 1);
          }
        }
      } else {
        this.value = newVal;
      }
      if (!this.loading) {
        this._updateSubscriptions();
      }
    }
  }]);

  return QueryState;
})();

exports.QueryState = QueryState;