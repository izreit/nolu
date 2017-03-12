var mockfs = require("mock-fs");
var fs = require("fs");
var nolu = require("../index");

// Promisified version of nolu() for tests.
function pnolu() {
  var arg = Array.prototype.slice.call(arguments);
  return new Promise((resolve, reject) => {
    arg.push((err) => (err) ? reject(err) : resolve());
    nolu.apply(null, arg);
  });
}

describe("nolu", function () {
  beforeEach(function () {
    mockfs({
      "test.json": '{ "prop1": 42, "words": ["aa", "bbb", "cc"] }',
      "test.txt": [
        "foo 100",
        "bar 200",
        "zoo 42"
      ].join("\n"),
      "test2.txt": [
        "foo/100:0",
        "bar/200:20",
        "zoo/42:5"
      ].join("\n"),
      "test3.txt": "ONE LINE TEXT"
    });
  });

  afterEach(function () {
    mockfs.restore();
  });

  describe("-e", function () {
    it("executes the specified code", function (done) {
      Promise.resolve()
        .then(() => pnolu(["-e", "fs.writeFileSync('./outtest.txt', 'foo')"], null, null))
        .then(() => {
          expect(fs.readFileSync("./outtest.txt").toString()).toBe("foo");
          done();
        })
        .catch(done.fail);
    });

    it("executes multiple codes in order", function (done) {
      Promise.resolve()
        .then(() => pnolu(["-e", "x = 99", "-e", "++x", "-e", "fs.writeFileSync('./outtest.txt', 'foo' + x)"], null, null))
        .then(() => {
          expect(fs.readFileSync("./outtest.txt").toString()).toBe("foo100");
          done();
        })
        .catch(done.fail);
    });
  });

  describe("-t", function () {
    it("assign a whole input into $_", function (done) {
      var is = fs.createReadStream("./test.txt");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-tpe", "$_ = $_.split('\\n').map(l => l[0]).join('')"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe("fbz");
          done();
        })
        .catch(done.fail);
    });

    it("works with -f", function (done) {
      var is = fs.createReadStream("./test.txt");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-tfpe", "input => input.split('\\n').map(l => l[0]).join('')"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe("fbz");
          done();
        })
        .catch(done.fail);
    });

    it("works with -J", function (done) {
      var is = fs.createReadStream("./test.txt");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-tJfpe", "input => input.split('\\n')"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe([
            '[',
            '  "foo 100",',
            '  "bar 200",',
            '  "zoo 42"',
            ']'
          ].join("\n"))
          done();
        })
        .catch(done.fail);
    });
  });

  describe("-j", function () {
    it("assign a whole input into $_ as JSON", function (done) {
      var is = fs.createReadStream("./test.json");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-jpe", "$_ = $_.words.join(':')"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe("aa:bbb:cc");
          done();
        })
        .catch(done.fail);
    });

    it("works with -J", function (done) {
      var is = fs.createReadStream("./test.json");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-jJpe", "$_ = $_.words"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe([
            '[',
            '  "aa",',
            '  "bbb",',
            '  "cc"',
            ']'
          ].join("\n"))
          done();
        })
        .catch(done.fail);
    });
  });

  describe("-n", function () {
    it("loops specified code for each line", function (done) {
      var is = fs.createReadStream("./test.txt");
      Promise.resolve()
        .then(() => pnolu(["-ne", "fs.writeFileSync('./outtest2.txt', 'test' + $_.length, { flag: 'a' })"], is, null))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe("test8test8test6");
          done();
        })
        .catch(done.fail);
    });

    it("works with -l", function (done) {
      var is = fs.createReadStream("./test.txt");
      var opts = [
        "-nl",
        "--BEGIN", "x=''",
        "-e", "x += $_",
        "--END", "fs.writeFileSync('./outtest3.txt', x)"
      ];
      Promise.resolve()
        .then(() => pnolu(opts, is, null))
        .then(() => {
          expect(fs.readFileSync("./outtest3.txt").toString()).toBe("foo 100bar 200zoo 42");
          done();
        })
        .catch(done.fail);
    });
  });

  describe("-p", function () {
    it("loops specified code for each line and print the result", function (done) {
      var is = fs.createReadStream("./test.txt");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-pe", "$_ = $_.toUpperCase()"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe([
            "FOO 100",
            "BAR 200",
            "ZOO 42"
          ].join("\n"));
          done();
        })
        .catch(done.fail);
    });

    it("handle files that includes just one line", function (done) {
      var is = fs.createReadStream("./test3.txt");
      var ofd = fs.openSync("./outtest3.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-pe", "$_ = $_.toLowerCase()"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest3.txt").toString()).toBe("one line text");
          done();
        })
        .catch(done.fail);
    });

    it("works with -l", function (done) {
      var is = fs.createReadStream("./test.txt");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      var opts = [
        "-pl",
        "--BEGIN", "x=''",
        "-e", "$_ = (x += $_)",
        "--END", "fs.writeFileSync('./outtest3.txt', x)"
      ];
      Promise.resolve()
        .then(() => pnolu(opts, is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe([
            "foo 100",
            "foo 100bar 200",
            "foo 100bar 200zoo 42"
          ].join("\n"));
          expect(fs.readFileSync("./outtest3.txt").toString()).toBe("foo 100bar 200zoo 42");
          done();
        })
        .catch(done.fail);
    });
  });

  describe("-f", function () {
    it("assumes the code is a function that should be called with $_", function (done) {
      Promise.resolve()
        .then(() => pnolu(["-fe", "() => fs.writeFileSync('./outtest2.txt', '-fe test')"], null, null))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe("-fe test");
          done();
        })
        .catch(done.fail);
    });

    it("works with -p", function (done) {
      var is = fs.createReadStream("./test.txt");
      var ofd = fs.openSync("./outtest2.txt", "wx");
      Promise.resolve()
        .then(() => pnolu(["-fpe", "line => line.replace(/\\d+/, '$')"], is, ofd))
        .then(() => {
          expect(fs.readFileSync("./outtest2.txt").toString()).toBe([
            "foo $",
            "bar $",
            "zoo $"
          ].join("\n"));
          done();
        })
        .catch(done.fail);
    });
  });

  describe("-a", function () {
    it("splits each line and exposes it as $F", function (done) {
      var is = fs.createReadStream("./test.txt");
      var opts = ["-an", "--BEGIN", "x=0", "-e", "x += Number($F[1])", "--END", "fs.writeFileSync('./outtest3.txt', 'result ' + x)"];
      Promise.resolve()
        .then(() => pnolu(opts, is, null))
        .then(() => {
          expect(fs.readFileSync("./outtest3.txt").toString()).toBe("result 342");
          done();
        })
        .catch(done.fail);
    });

    it("splits each line with the regexp given by -F", function (done) {
      var is = fs.createReadStream("./test2.txt");
      var opts = [
        "-anF", "[:/]",
        "--BEGIN", "x=0",
        "-e", "x += Number($F[1]) * Number($F[2])",
        "--END", "fs.writeFileSync('./outtest3.txt', 'result ' + x)"
      ];
      Promise.resolve()
        .then(() => pnolu(opts, is, null))
        .then(() => {
          expect(fs.readFileSync("./outtest3.txt").toString()).toBe("result 4210");
          done();
        })
        .catch(done.fail);
    });
  });
});
