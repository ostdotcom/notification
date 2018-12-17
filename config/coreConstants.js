'use strict';
/**
 * Load all the core constants.
 *
 * @module config/coreConstants
 */

class CoreConstants {
  /**
   * Constructor for core constants
   *
   * @constructor
   */
  constructor() {}

  /**
   * Web3 pool size
   *
   * @returns {*}
   */
  get icNameSpace() {
    return 'openSTNotification';
  }
}

module.exports = new CoreConstants();
