"use strict";

/**
 * Singleton class to manage the local emitter.
 *
 * @module services/local_emitter
 */

const EventEmitter = require('events')
  , emitObj = new EventEmitter;
;

/**
 * Constructor for local emitter
 *
 * @constructor
 */
const localEmitter = function () {
  this.emitObj = emitObj;
};

localEmitter.prototype = {

};


module.exports = new localEmitter;