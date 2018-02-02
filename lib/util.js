"use strict";
const fs = require('fs');

var filePath = 'saved_messages.txt';

const util = {

  saveUnpublishedMessages: function(message){
    fs.appendFile(filePath, JSON.stringify(message)+'\n', function (err) {
      if (err)
        return console.log(err);
    });
  }

};

module.exports = util;