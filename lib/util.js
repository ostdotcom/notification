"use strict";

/**
 * Utility methods
 *
 * @module lib/util
 */

const fs = require('fs');

/**
 * Utility methods constructor
 *
 * @constructor
 */
const UtilKlass = function() {};

UtilKlass.prototype = {

  /**
   * NOTE: Not yet fully implemented
   * Handle messages not published on RMQ
   *
   * @param {object} - Message not published on RMQ
   */
  saveUnpublishedMessages: function(message){
    // var filePath = 'saved_messages.txt';
    // fs.appendFile(filePath, JSON.stringify(message)+'\n', function (err) {
    //   if (err)
    //     console.log(err);
    // });
  },

  /**
   * check if the value is undefined or null. Empty value is considered as present.
   *
   * @param {object} val - object to check for present
   *
   * @returns {boolean}
   */
  valPresent: function (val) {
    return !((val===undefined) || (val===null));
  }

};

module.exports = new UtilKlass();