
# nolu


`nolu` is a small command-line tool to write one-liners in JavaScript ([Node.js](https://nodejs.org/)).

```
$ cat test.txt
Lorem 100
Ipsum 42
DolorSitAmet 1
$ cat test.txt | nolu -an --BEGIN "total = 0" -e "total += Number($F[1])" --END "console.log(total)"
143
```

The Node.js binary `node` provides nothing for one-liners except `-e <code>` option which simply executes `eval(code)`.
Nolu extends this `-e` with Ruby compatible options such as `-n` (process each line), `-a` (auto-split mode) and more.

## Install

You need to have Node.js. Install `nolu` globally with:

```
npm i -g nolu
```

Leave off `-g` if you don't want to install globally.

## Usage

```
$ nolu [options]
```

The following options are available:

|Option|Description|
|:----:|:------------|
|`-a`|Turns on auto-split mode when used with `-n` or `-p`. In auto-split mode, `$F = $_.split(/\s/)` at beginning of each loop.|
|`-B <code>`, `--BEGIN <code>`|Execute `code` before any `-e`s.|
|`-e <code>`|Execute `code`. Multiple `-e`'s are executed in given order.|
|`-E <code>`, `--END <code>`|Execute `code` after all `-e`'s.|
|`-f`|Assume your `code` for `-e` is a function and call it with `$_` and `$F`. When using with `-p`, print the return value instead of `$_`.|
|`-F <pattern>`|Use `pattern` (regexp) for split() in auto-split mode (`-a`).|
|`-h`, `--help`|Output the help.|
|`-j`|Read `process.stdin` as JSON and set it to `$_` before execute `-e`.|
|`-J`|Apply JSON.stringify() for printing (`-p`).|
|`-l`|Enables automatic line-ending processing, which means to chops every `"\n"` at the end of line. Works with `-n` or `-p`.|
|`-n`|Read `process.stdin` and store it `$_` and execute `-e` for each line.|
|`-p`|Same with `-n` but print `$_` (or the returned value when `-f`) after each loop.|
|`-t`|Read `process.stdin` and set it to `$_` before execute `-e` (after `--BEGIN`).|
|`-v`, `--version`|Output the version.|

## Examples

### A Classical Text Operation: Calculate The Average

```
$ cat test.txt
Lorem 100
Ipsum 42
DolorSitAmet 1
$ cat test.txt | nolu -an --BEGIN 'total = 0, lines = 0' -e 'lines++; total += Number($F[1])' --END 'console.log(total/lines)'
47.666666666666664
```

Use `--BEGIN` and `--END` options (`-B` and `-E` for short, respectively) instead of `BEGIN{...}` and `END{...}` block in Ruby.
Any variables are shared between all codes.

### Handling JSON

For simple JSON transformation, consider using [jq](https://stedolan.github.io/jq/).
`nolu` provides more plain-JavaScript friendly way to write complex filter.

A simple example:

```
$ cat test.json
{
  "value": 42,
  "v2": 100,
  "foo": 20
}
$ cat test.json | nolu -jJpe '$_ = Object.keys($_).map(k => $_[k])'
[
  42,
  100,
  20
]
```

When `-j` option is specified, nolu reads stdin as JSON (and store it to `$_`).
`-J` modifies `-p` to print `JSON.stringify($_, null, 2)`.

### More functional way

Instead of refering/assigning `$_`, you can use a function by `-f` options.

```
$ cat test.txt
Lorem
Ipsum
DolorSitAmet
$ cat test.txt | nolu -pfe 'line => line.toUpperCase()'
LOREM
IPSU
DOLORSITAMET
```

The return value of the funciton is used to print (`-p`).

### Simple pipe

The `-t` option simply read the whole content of `process.stdin` and give it to `$_`.

```
$ cat test.txt
Lorem
Ipsum
DolorSitAmet
$ cat test.txt | nolu -te 'fs.writeFileSync("out.txt", $_.toLowerCase())'
$ cat out.txt
lorem
ipsum
dolorsitamet
```

Note that `fs` is the `fs` core module of Node.js.
No `fs = require("fs")` is needed.
Any code evaluated in nolu are able to refer the core modules with their names.

## License

MIT. See LICENSE.
