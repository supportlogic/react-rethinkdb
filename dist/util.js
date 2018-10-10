'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _rethinkdbWebsocketClient = require('rethinkdb-websocket-client');

var findIndex = function findIndex(arr, fn) {
  for (var i = 0; i < arr.length; ++i) {
    if (fn(arr[i])) {
      return i;
    }
  }
  return -1;
};

exports.findIndex = findIndex;
var ensure = function ensure(value, msg) {
  if (!value) {
    throw new Error(msg);
  }
};

exports.ensure = ensure;
var updateComponent = function updateComponent(component) {
  // Check for document because of this bug:
  // https://github.com/facebook/react/issues/3620
  if (component._rethinkMixinState.isMounted && typeof document !== 'undefined') {
    component.forceUpdate();
  }
};

exports.updateComponent = updateComponent;
// TODO is there a better way to distinguish cursors from single record
// responses?
var isCursor = function isCursor(x) {
  return x && typeof x === 'object' && typeof x.toArray === 'function';
};

exports.isCursor = isCursor;
// Return a copy of the RethinkDB query, in which the JSON encoding is
// normalized, so identical queries will always generate the same string for
// JSON.stringify(query.build()).
//
// This allows QueryRequest.toStringKey() to return the same value for
// identical queries, facilitating the sharing of results among components that
// subscribe to the same query.
//
// This also simplifies the query whitelist in the backend, since there are
// fewer variations of the same types of queries.
//
// This function performs two types of normalization:
// 1. Ensure objects are created with the same insertion order
// 2. Ensure var ids are consistent when re-generating the same query
//
// Object insertion order normalization will make these two queries identical:
//   r.table('turtles').insert({color: 'green', isSeaTurtle: true});
//   r.table('turtles').insert({isSeaTurtle: true, color: 'green'});
//
// Var ids are used in reql anonymous functions. For example, the query below
// is represents as follows in the RethinkDB JSON protocol:
//
// Query:
//   r.table('turtles').filter(t => t('color').eq('green'))
//
// JSON protocol:
//   [FILTER, [
//     [TABLE, ["turtles"]],
//     [FUNC, [
//       [MAKE_ARRAY, [123]],
//       [EQ, [
//         [BRACKET, [[VAR, [123]], "color"]],
//         "green"
//       ]]
//     ]]
//   ]]
//
// Normally, every time that query is generated, the var id representing the t
// argument (seen as 123 above) will increment due to a global counter in the
// RethinkDB driver. So even though the query is supposed to be the same every
// time it is generated, the RethinkDB protocol represents it differently. By
// wrapping the query with this function, the RethinkDB protocol will look the
// same regardless of what the var ids are.
var normalizeQueryEncoding = function normalizeQueryEncoding(query) {
  // Since we can't clone query objects, we'll make a new query and override
  // the build() method that the driver uses to serialize to the JSON protocol.
  // By using the expression [query], the toString() method will be readable,
  // which helps for error reporting in the browser console. We can't use
  // rethinkdb(query) verbatim since that just returns query itself, which we
  // don't want to mess with.
  var normalizedQuery = (0, _rethinkdbWebsocketClient.rethinkdb)([query]);
  normalizedQuery.build = function () {
    var nextNormalizedVarId = 0;
    var varIdToNormalizedMap = {};
    var normalizeVarId = function normalizeVarId(id) {
      if (!(id in varIdToNormalizedMap)) {
        varIdToNormalizedMap[id] = nextNormalizedVarId++;
      }
      return varIdToNormalizedMap[id];
    };
    var traverse = function traverse(term) {
      if (Array.isArray(term)) {
        var _term = _slicedToArray(term, 3);

        var termId = _term[0];
        var args = _term[1];
        var options = _term[2];

        if (termId === _rethinkdbWebsocketClient.protodef.Term.TermType.FUNC) {
          // The term looks like [FUNC, [[MAKE_ARRAY, [1, 2]], ...]]
          args[0][1] = args[0][1].map(normalizeVarId);
        } else if (termId === _rethinkdbWebsocketClient.protodef.Term.TermType.VAR) {
          // The term looks like [VAR, [1]]
          args[0] = normalizeVarId(args[0]);
        }
        var normalizedTerm = [termId, args.map(traverse)];
        if (options) {
          normalizedTerm.push(traverse(options));
        }
        return normalizedTerm;
      } else if (term && typeof term === 'object') {
        var _ret = (function () {
          var normalizedObject = {};
          var keys = Object.keys(term);
          keys.sort();
          keys.forEach(function (key) {
            normalizedObject[key] = traverse(term[key]);
          });
          return {
            v: normalizedObject
          };
        })();

        if (typeof _ret === 'object') return _ret.v;
      } else {
        return term;
      }
    };
    return traverse(query.build());
  };
  return normalizedQuery;
};
exports.normalizeQueryEncoding = normalizeQueryEncoding;