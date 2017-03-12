var fs = require("fs");
var minimist = require("minimist");
var evalUtil = require("./evalUtil");

module.exports = function nolu(argv, inStream, outFd, callback) {
  inStream = (inStream !== null) ? inStream : process.stdin;
  outFd = (outFd !== null) ? outFd : process.stdout.fd;  // Ugh! `stdout.fd` is undocumented. Should handle WriteStream directly...
  callback = callback || function () {};

  var asArray = (x) => (Array.isArray(x) ? x : (x ? [x] : []));
  var arg = minimist(argv);
  var beginCodes = asArray(arg.BEGIN).concat(asArray(arg.B));
  var endCodes = asArray(arg.END).concat(asArray(arg.E));
  var codes = asArray(arg.e);
  var reqs = asArray(arg.r);
  var useInputRaw = arg.i;
  var useInputAsJSON = arg.j;
  var asFunction = arg.f;
  var outAsJSON = arg.J;

  var autoSplit = arg.a;
  var trimLineEnding = arg.l;
  var splitPattern = arg.F ? new RegExp(arg.F) : /\s/;
  var loop = (arg.n || arg.p);

  var printNoNewline = (str) => fs.writeSync(outFd, str);
  var printLine = (str) => printNoNewline(str + "\n");
  var printJSON = (str) => printNoNewline(JSON.stringify(str, null, 2));
  var print = outAsJSON ? printJSON : (trimLineEnding ? printLine : printNoNewline);
  var printLast = outAsJSON ? printJSON : printNoNewline;

  var _eval = (code) => evalUtil.evaluate.call(code);
  var executeOnly = (code) => _eval(code);
  var executeAsFunc = (code) => _eval(code)(evalUtil.$_());
  var executeAndPrint = (code, last) => {
    _eval(code);
    (last ? printLast : print)(evalUtil.$_());
  };
  var executeAsFuncAndPrint = (code, last) => {
    var result = _eval(code)(evalUtil.$_());
    (last ? printLast : print)(result);
  }

  var execute;
  if (arg.p) {
    execute = asFunction ? executeAsFuncAndPrint : executeAndPrint;
  } else {
    execute = asFunction ? executeAsFunc : executeOnly;
  }

  var input = "";
  beginCodes.forEach(_eval);
  if (!loop && !useInputAsJSON) {
    codes.forEach((code) => execute(code, true));
    endCodes.forEach(_eval);
    callback();

  } else if (useInputRaw || useInputAsJSON) {
    inStream.setEncoding("utf8");
    inStream.on("error", callback);
    inStream.on("data", (chunk) => input += chunk);
    inStream.on("end", function(){
      evalUtil.$_(useInputRaw ? input : JSON.parse(input));
      codes.forEach((code) => execute(code, true));
      endCodes.forEach(_eval);
      callback();
    });
    inStream.resume();

  } else {
    inStream.setEncoding("utf8");
    inStream.on("error", callback);
    inStream.on("data", (chunk) => {
      input += chunk;
      var lines = input.split("\n");
      if (lines.length <= 1)
        return;
      input = lines.pop();
      lines.forEach((line) => {
        if (!trimLineEnding)
          line += "\n";
        evalUtil.$_(line);
        if (autoSplit)
          evalUtil.$F(line.split(splitPattern));
        codes.forEach((code) => execute(code, false));
      });
    });
    inStream.on("end", () => {
      evalUtil.$_(input);
      if (autoSplit)
        evalUtil.$F(input.split(splitPattern));
      codes.forEach((code) => execute(code, true));
      endCodes.forEach(_eval);
      callback();
    });
    inStream.resume();
  }
}
