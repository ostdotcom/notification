"use strict";

const EventEmitter = require('events')
  , emitObj = new EventEmitter;
;

const localEmitter = function () {
  this.emitObj = emitObj;
};

localEmitter.prototype = {

  constructor: localEmitter

};


module.exports = new localEmitter;