'use strict';

/*

Request Constructor

Handles: 

- Creating pending requests
- Handling response data
- Timeout behavior

*/

var RSVP = require('rsvp');
var uuid = {
  v4: require('uuid-v4.js')
};

function Request (data, callback) {
  this.deferred = new RSVP.defer();
  this.callback = callback;
  this.envelope = {
    plugin: 'primus-reply',
    uuid: uuid.v4(),
    data: data
  };
}

Request.prototype.id = function () {
  return this.envelope.uuid;
};

// Proxy the request's deferred promise methods so it can be part of a promise chain
['then', 'catch', 'finally'].forEach(function (method) {
  Request.prototype[method] = function () {
    var promise = this.deferred.promise;
    return promise[method].apply(promise, arguments);
  };
});

Request.prototype.resolve = function (data) {
  // Resolve the deferred
  this.deferred.resolve(data);
  if (this.callback) {
    // If a callback was defined:
    // Call it node-style with this=null, err=null, and result=data
    this.callback.call(null, null, data);
  }
};

Request.prototype.reject = function (error) {
  // Reject the deferred
  this.deferred.reject(error);
  if (this.callback) {
    // If a callback was defined:
    // Call it node-style with this=null, err=error, and result=null
    this.callback.call(null, error, null);
  }
};

Request.prototype.timeout = 10000;

Request.prototype._ontimeout = function () {
  var error = new Error('The request timed out after ' + this.timeout + 'ms');
  this.reject(error);
};

module.exports = Request;