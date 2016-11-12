"use strict";
class Image {
  constructor() {

  }
}

var platform = null;
//detect platform based on the node url argv[0]
if(process.argv[0].startsWith('/')) platform = 'UNX';
else if(/^[a-zA-Z]:\\/.test(process.argv[0])) platform = 'WIN';

var _pd_ = '/'; //WEB
if(platform == 'UNX') _pd_ = '/';
else if(platform == 'WIN') _pd_ = '\\';


console.log("Window location:" + process.cwd() + _pd_ + "splice.js");
module.exports = {
  console: console,
  location:{href:process.cwd() + _pd_ + 'splice.js'},
  Image: Image,
  __sjs_platform__:platform
};
