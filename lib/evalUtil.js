// Import all core modules to expose to the code executed by _eval().
// This is for compatibility with `node -e`.
var assert = require("assert");
var buffer = require("buffer");
var child_process = require("child_process");
var cluster = require("cluster");
var console = require("console");
var crypto = require("crypto");
var dgram = require("dgram");
var dns = require("dns");
var domain = require("domain");
var events = require("events");
var fs = require("fs");
var http = require("http");
var https = require("https");
var net = require("net");
var os = require("os");
var path = require("path");
var process = require("process");
var punycode = require("punycode");
var querystring = require("querystring");
var readline = require("readline");
var repl = require("repl");
var stream = require("stream");
var string_decoder = require("string_decoder");
var tls = require("tls");
var tty = require("tty");
var url = require("url");
var util = require("util");
var v8 = require("v8");
var vm = require("vm");
var zlib = require("zlib");

// The variables to be refered from the code executed by _eval()
var $_ = null;
var $F = null;

module.exports = {
  // This function cannot be named to prevent to be refered the name from the code passed to eval().
  // This function uses `this` as the argument to avoid to introduce an unneeded name.
  _eval: function () {
    return eval(this.valueOf());
  },

  $F: function (v) {
    if (arguments.length > 0)
      $F = v;
    return $F;
  },

  $_: function (v) {
    if (arguments.length > 0)
      $_ = v;
    return $_;
  }
};
