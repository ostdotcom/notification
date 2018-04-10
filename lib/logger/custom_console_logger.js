"use strict";

/**
 * Custom console logger
 *
 * @module helpers/custom_console_logger
 */

const myProcess = require('process')
    , pid = String( myProcess.pid )
    , pIdPrexfix = "[" + pid + "]"
;

const CONSOLE_RESET = "\x1b[0m"
  , ERR_PRE = "\x1b[31m" //Error. (RED)
  , NOTE_PRE = "\x1b[91m" //Notify Error. (Purple)
  , INFO_PRE = "\x1b[35m" //Info (Magenta)
  , WIN_PRE = "\x1b[32m" //Success (GREEN)
  , LOG_PRE = CONSOLE_RESET //Log (Default Console Color)
  , DEBUG_PRE = "\x1b[36m" //Debug log (Cyan)
  , WARN_PRE = "\x1b[43m"
  , STEP_PRE = "\n\x1b[34m"
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

//Other Known Colors
//"\x1b[33m" // (YELLOW)

/**
 * Method to convert Process hrTime to Milliseconds
 *
 * @param {number} hrTime - this is the time in hours
 *
 * @return {number} - returns time in milli seconds
 */
const timeInMilli = function (hrTime) {
  return (hrTime[0] * 1000 + hrTime[1] / 1000000);
};

/**
 * Custom COnsole Logger
 *
 * @constructor
 */
const CustomConsoleLoggerKlass = function () {
};

CustomConsoleLoggerKlass.prototype = {
  /**
   * @ignore
   *
   * @constant {string}
   */
  STEP_PRE: STEP_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  WARN_PRE: WARN_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  LOG_PRE: LOG_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  DEBUG_PRE: DEBUG_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  WIN_PRE: WIN_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  INFO_PRE: INFO_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  ERR_PRE: ERR_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  NOTE_PRE: NOTE_PRE,

  /**
   * @ignore
   *
   * @constant {string}
   */
  CONSOLE_RESET: CONSOLE_RESET,

  /**
   * Log step
   */
  step: function () {
    var oThis = this;
    var args  = [oThis.getPrefix( this.STEP_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log info
   */
  info: function () {
    var oThis = this;
    var args  = [oThis.getPrefix( this.INFO_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log error
   */
  error: function () {
    var oThis = this;
    var args  = [oThis.getPrefix(this.ERR_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log warn
   */
  warn: function () {
    var oThis =  this;
    var args  = [oThis.getPrefix( this.WARN_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log win - on done
   */
  win: function () {
    var oThis =  this;
    var args  = [oThis.getPrefix( this.WIN_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log normal level
   */
  log: function () {
    var oThis =  this ;
    var args  = [oThis.getPrefix( this.LOG_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(this.CONSOLE_RESET);
    console.log.apply(console, args);
  },

  /**
   * Log level debug
   */
  debug: function () {
    if (coreConstants.DEBUG_ENABLED == 1) {
      var oThis = this;
      var args = [oThis.getPrefix(this.DEBUG_PRE)];
      args = args.concat(Array.prototype.slice.call(arguments));
      args.push(this.CONSOLE_RESET);
      console.log.apply(console, args);
    }
  },

  //Method to Log Request Started.
  requestStartLog: function (requestUrl, requestType) {
    const oThis = this
      , d = new Date()
      , dateTime = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" +
      d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds()
      , message = 'Started \'' + requestType + '\'  \'' + requestUrl + '\' at ' + dateTime
    ;

    oThis.info(message);
  },

  trace : function () {
    var oThis =  this;
    var args = [oThis.getPrefix( this.ERR_PRE )];
    args = args.concat(Array.prototype.slice.call(arguments));
    console.trace.apply(console, args);
    console.log( this.CONSOLE_RESET );
  },

  dir: function () {
    console.log( this.CONSOLE_RESET );
    console.dir.apply(console, arguments);
    console.log( this.CONSOLE_RESET );
  },

  /**
   * Method to append Request in each log line.
   *
   * @param {string} message
   */
  getPrefix : function( prefix ){

    var newMessage = pIdPrexfix;

    var hrTime = process.hrtime();
    newMessage += "[" + timeInMilli(hrTime) + "]";


    newMessage += prefix;
    return newMessage;
  },

  testLogger: function () {
    const oThis = this;

    console.log("Testing Basic Methods");
    try {
      oThis.step("step Invoked");
      oThis.info("info Invoked");
      oThis.error("error called");
      oThis.warn("warn called");
      oThis.win("win called");
      oThis.log("log called");
      oThis.debug("debug called");
      oThis.trace("trace called");
    } catch( e ) {
      console.error("Basic Test Failed. Error:\n", e);
      return;
    }
    console.log("All Basic Test Passed!");    
  }

};



module.exports = new CustomConsoleLoggerKlass();
