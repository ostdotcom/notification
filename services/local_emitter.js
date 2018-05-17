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
const LocalEmitterKlass = function () {
  this.emitObj = emitObj;
};

LocalEmitterKlass.prototype = {};


module.exports = new LocalEmitterKlass();