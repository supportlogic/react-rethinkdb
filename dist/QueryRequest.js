'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('./util');

// An QueryRequest is used to represent a RethinkDB query that a component is
// subscribed to. It should be used for values in the object returned from the
// observe() function of components that use the provided mixin. See Mixin.js
// for the API.
//
// QueryRequests have have 3 required properties.
// * query:     the RethinkDB query to run
// * changes:   boolean specifying whether to subscribe to the realtime
//              changefeed too
// * initial:   value to be returned before the query finishes loading
// * transform: function applied after the query finishes loading
//
// Here is a simple example of an QueryRequest that a component might use in
// its observe() function:
//   new QueryRequest({
//     query: r.table('turtles'),
//     changes: true,
//     initial: [],
//     transform: (rows) => { // array-to-object, using id as key for O(1) lookup
//       rows.reduce((prev, cur) => {
//        prev[cur.id] = cur
//        prev
//      }, {})
//    }
//   })

var QueryRequest = (function () {
  function QueryRequest(_ref) {
    var query = _ref.query;
    var changes = _ref.changes;
    var initial = _ref.initial;
    var transform = _ref.transform;

    _classCallCheck(this, QueryRequest);

    this.query = (0, _util.normalizeQueryEncoding)(query);
    this.changes = changes;
    this.initial = initial;
    this.transform = transform;
  }

  // Convert the QueryRequest into a string that can be used as a
  // deterministic lookup key in an object. The key should be identical for two
  // QueryRequests that need access to the same data.

  _createClass(QueryRequest, [{
    key: 'toStringKey',
    value: function toStringKey() {
      return JSON.stringify({
        query: this.query.build(),
        changes: this.changes
      });
    }
  }]);

  return QueryRequest;
})();

exports.QueryRequest = QueryRequest;