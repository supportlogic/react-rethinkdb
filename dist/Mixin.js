'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _QueryResult = require('./QueryResult');

var _util = require('./util');

var update = function update(component, props, state) {
  var observed = component.observe(props, state);
  var _component$_rethinkMixinState = component._rethinkMixinState;
  var session = _component$_rethinkMixinState.session;
  var subscriptions = _component$_rethinkMixinState.subscriptions;

  var subscriptionManager = session._subscriptionManager;

  // Close subscriptions no longer subscribed to
  Object.keys(subscriptions).forEach(function (key) {
    if (!observed[key]) {
      subscriptions[key].unsubscribe();
      delete component.data[key];
    }
  });

  // [Re]-subscribe to active queries
  Object.keys(observed).forEach(function (key) {
    var queryRequest = observed[key];
    var oldSubscription = subscriptions[key];
    var queryResult = component.data[key] || new _QueryResult.QueryResult(queryRequest.initial, queryRequest.transform);
    subscriptions[key] = subscriptionManager.subscribe(component, queryRequest, queryResult);
    component.data[key] = queryResult;
    if (oldSubscription) {
      oldSubscription.unsubscribe();
    }
  });
};

var unmount = function unmount(component) {
  var subscriptions = component._rethinkMixinState.subscriptions;

  Object.keys(subscriptions).forEach(function (key) {
    subscriptions[key].unsubscribe();
  });
};

// Mixin for RethinkDB query subscription support in React components. You'll
// generally want to use DefaultMixin or PropsMixin, which use BaseMixin to
// create more usable versions.
//
// In your component, you should define an observe(props, state) method that
// returns an object mapping query names to QueryRequests. See
// QueryRequest.js for the API.
//
// In the render() function, you will have access to this.data, which is an
// object mapping from the same query names returned in observe() to the
// results of each query as an QueryResult. See QueryResult.js for the
// API.
//
// Here is a simple example of the mixin API:
//   var App = React.createClass({
//     mixins: [DefaultMixin],
//
//     observe: function(props, state) {
//       return {
//         turtles: new QueryRequest({
//           query: r.table('turtles'),
//           changes: true,
//           initial: [],
//         }),
//       };
//     },
//
//     render: function() {
//       return <div>
//         {this.data.turtles.value().map(function(x) {
//           return <div key={x.id}>{x.firstName}</div>;
//         })};
//       </div>;
//     },
//   });
var BaseMixin = function BaseMixin(sessionGetter) {
  return {
    componentWillMount: function componentWillMount() {
      var componentName = this && this.constructor && this.constructor.displayName || '';
      var session = sessionGetter(this);
      (0, _util.ensure)(session && session._subscriptionManager, 'Mixin in ' + componentName + ' does not have Session');
      (0, _util.ensure)(this.observe, 'Must define ' + componentName + '.observe()');
      (0, _util.ensure)(session._connPromise, 'Must connect() before mounting ' + componentName);
      this._rethinkMixinState = { session: session, subscriptions: {} };
      this.data = this.data || {};
      update(this, this.props, this.state);
    },

    componentDidMount: function componentDidMount() {
      this._rethinkMixinState.isMounted = true;
    },

    componentWillUnmount: function componentWillUnmount() {
      unmount(this);
      this._rethinkMixinState.isMounted = false;
    },

    componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
      if (nextProps !== this.props || nextState !== this.state) {
        update(this, nextProps, nextState);
      }
    }
  };
};

exports.BaseMixin = BaseMixin;
// Mixin that uses rethink session from props. For example:
//   var MyComponent = React.createClass({
//     mixins: [PropsMixin('rethinkSession')],
//     ...
//   });
//   var session = new Session();
//   React.render(<MyComponent rethinkSession={session} />, mountNode);
var PropsMixin = function PropsMixin(name) {
  return BaseMixin(function (component) {
    return component.props[name];
  });
};
exports.PropsMixin = PropsMixin;