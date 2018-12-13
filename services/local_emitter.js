'use strict';

/**
 * Singleton class to manage the local emitter.
 *
 * @module services/local_emitter
 */

const EventEmitter = require('events'),
  emitObj = new EventEmitter();

/**
 * Constructor for local emitter
 *
 * @constructor
 */
class LocalEmitterKlass {
  constructor() {
    this.emitObj = emitObj;
  }
}

module.exports = new LocalEmitterKlass();
