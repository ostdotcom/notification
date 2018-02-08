"use strict";

/**
 * Utility methods
 *
 * @module lib/util
 */

const fs = require('fs');

var filePath = 'saved_messages.txt';

const util = {

  /**
   *
   * append passed messge to the local file
   *
   * @param {object} message
   *
   */
  saveUnpublishedMessages: function(message){
    fs.appendFile(filePath, JSON.stringify(message)+'\n', function (err) {
      if (err)
        console.log(err);
    });
  },

  /**
   * check if the value is undefined of passed null. Empty value is considered as present.
   *
   * @param {string} val
   * @returns {boolean}
   */
  valPresent: function (val) {
    return !((val===undefined) || (val===null));
  }

};

module.exports = util;