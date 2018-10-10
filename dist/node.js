'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _Mixin = require('./Mixin');

var _QueryRequest = require('./QueryRequest');

var _Session = require('./Session');

var _rethinkdbWebsocketClientDistNode = require('rethinkdb-websocket-client/dist/node');

var RethinkdbWebsocketClient = _interopRequireWildcard(_rethinkdbWebsocketClientDistNode);

var r = RethinkdbWebsocketClient.rethinkdb;
var Session = (0, _Session.MetaSession)(RethinkdbWebsocketClient);

var ReactRethinkdb = {
  BaseMixin: _Mixin.BaseMixin,
  PropsMixin: _Mixin.PropsMixin,
  QueryRequest: _QueryRequest.QueryRequest,
  r: r,
  Session: Session
};

exports.BaseMixin = _Mixin.BaseMixin;
exports.PropsMixin = _Mixin.PropsMixin;
exports.QueryRequest = _QueryRequest.QueryRequest;
exports.r = r;
exports.Session = Session;
exports['default'] = ReactRethinkdb;