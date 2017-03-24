
var fs = require('fs');
const LOG_PATH = "log/" + getFileDate() + ".txt";
const DEBUG_PATH = "debug/" + getFileDate() + ".txt";
const ERR_PATH = "error/" + getFileDate() + ".txt";

fs.mkdir("log");
fs.mkdir("debug");
fs.mkdir("error");

module.exports = {
  log: function(message){
    // Open the log file in append mode to add to it
    fs.open(LOG_PATH, 'a+', function(err, fd){
      // If we couldn't open the log file, debug print it
      if(err){
        console.error("Logger.log could not open file " + LOG_PATH);
      }

      fs.write(fd, getTimestamp() + message + "\n", function(err){
        if(err){
          console.error("Logger.log could not write to file " + LOG_PATH);
        }

        fs.close(fd, function(){
          // Successful log
        });
      });
    });
  },

  debug: function(message){
    // Open the log file in append mode to add to it
    fs.open(DEBUG_PATH, 'a+', function(err, fd){
      // If we couldn't open the log file, debug print it
      if(err){
        console.error("Logger.debug could not open file " + DEBUG_PATH);
      }

      fs.write(fd, getTimestamp() + message + "\n", function(err){
        if(err){
          console.error("Logger.debug could not write to file " + DEBUG_PATH);
        }

        fs.close(fd, function(){
          // Successful log
        });
      });
    });
  },

  error: function(message){
    // Open the log file in append mode to add to it
    fs.open(ERR_PATH, 'a+', function(err, fd){
      // If we couldn't open the log file, debug print it
      if(err){
        console.error("Logger.error could not open file " + ERR_PATH);
      }

      fs.write(fd, getTimestamp() + message + "\n", function(err){
        if(err){
          console.error("Logger.error could not write to file " + ERR_PATH);
        }

        fs.close(fd, function(){
          // Successful log
        });
      });
    });
  }
};

function getTimestamp(){
  var date = new Date();

  return date.getFullYear()
    + "/" + ("00" + (date.getMonth() + 1)).slice(-2)
    + "/" + ("00" + (date.getDate())).slice(-2)
    + " " + ("00" + (date.getHours())).slice(-2)
    + ":" + ("00" + (date.getMinutes())).slice(-2)
    + ":" + ("00" + (date.getSeconds())).slice(-2)
    + "." + ("000" + (date.getMilliseconds())).slice(-3) + " - ";
}

function getFileDate(){
  var date = new Date();

  return date.getFullYear()
    + ("00" + (date.getMonth() + 1)).slice(-2)
    + ("00" + (date.getDate())).slice(-2);
}
