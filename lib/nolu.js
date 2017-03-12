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
  var asJSON = arg.j;
  var asFunction = arg.f;
  var outAsJSON = arg.J;

  var autoSplit = arg.a;
  var trimLineEnding = arg.l;
  var splitPattern = arg.R ? new RegExp(arg.R) : (arg.F || /\s/);
  var loop = (arg.n || arg.p);

  var printNoNewline = (str) => fs.writeSync(outFd, str);
  var printLine = (str) => printNoNewline(str + "\n");
  var printJSON = (str) => printLine(JSON.stringify(str, null, 2));
  var print = outAsJSON ? printJSON : (trimLineEnding ? printLine : printNoNewline);

  var _eval = (code) => evalUtil.evaluate.call(code);
  var execute = (code) => _eval(code);
  var executeAsFunc = (code) => _eval(code)(evalUtil.$_());
  var executeAndPrint = (code) => (_eval(code), print(evalUtil.$_()));
  var executeAsFuncAndPrint = (code) => print(_eval(code)(evalUtil.$_()));
  var run;
  if (arg.p) {
    run = asFunction ? executeAsFuncAndPrint : executeAndPrint;
  } else {
    run = asFunction ? executeAsFunc : execute;
  }

  beginCodes.forEach(_eval);
  if (!loop && !asJSON) {
    codes.forEach(run);
    endCodes.forEach(_eval);
    callback();

  } else if (asJSON) {
    var jsonStr = "";
    inStream.setEncoding("utf8");
    inStream.on("error", callback);
    inStream.on("data", (chunk) => jsonStr += chunk);
    inStream.on("end", function(){
      evalUtil.$_(JSON.parse(jsonStr));
      codes.forEach(run);
      endCodes.forEach(_eval);
      callback();
    });
    inStream.resume();

  } else {
    var input = "";
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
        codes.forEach(run);
      });
    });
    inStream.on("end", () => {
      evalUtil.$_(input);
      if (autoSplit)
        evalUtil.$F(input.split(splitPattern));
      codes.forEach(run);
      endCodes.forEach(_eval);
      callback();
    });
    inStream.resume();
  }
}
