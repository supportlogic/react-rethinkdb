'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _Mixin = require('./Mixin');

var _QueryRequest = require('./QueryRequest');

var _Session = require('./Session');

var _rethinkdbWebsocketClient = require('rethinkdb-websocket-client');

var RethinkdbWebsocketClient = _interopRequireWildcard(_rethinkdbWebsocketClient);

var r = RethinkdbWebsocketClient.rethinkdb;
var Session = (0, _Session.MetaSession)(RethinkdbWebsocketClient);

// Singleton session for convenience.
var DefaultSession = new Session();

// Singleton mixin for convenience, which uses the DefaultSession singleton as
// the session.
var DefaultMixin = (0, _Mixin.BaseMixin)(function () {
  return DefaultSession;
});

var ReactRethinkdb = {
  BaseMixin: _Mixin.BaseMixin,
  PropsMixin: _Mixin.PropsMixin,
  QueryRequest: _QueryRequest.QueryRequest,
  r: r,
  Session: Session,
  DefaultSession: DefaultSession,
  DefaultMixin: DefaultMixin
};

exports.BaseMixin = _Mixin.BaseMixin;
exports.PropsMixin = _Mixin.PropsMixin;
exports.QueryRequest = _QueryRequest.QueryRequest;
exports.r = r;
exports.Session = Session;
exports.DefaultSession = DefaultSession;
exports.DefaultMixin = DefaultMixin;
exports['default'] = ReactRethinkdb;