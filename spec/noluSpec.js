var mockfs = require("mock-fs");
var fs = require("fs");
var nolu = require("../lib/nolu");

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
      "test.txt": [
        "foo 100",
        "bar 200",
        "zoo 42"
      ].join("\n")
    });
  });

  afterEach(function () {
    mockfs.restore();
  });

  describe("-e", function () {
    it("executes specified code", function (done) {
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
});
