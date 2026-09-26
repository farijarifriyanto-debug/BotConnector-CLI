# bccli-win32-x64

Prebuilt Windows x64 binary for `bccli`. Not meant to be installed
directly -- install `bccli` instead, which pulls this in
automatically as an `optionalDependency`.

The `bccli.exe` binary itself is **not** committed to this repo
(it's ~145MB, over GitHub's 100MB per-file limit). It's published to this
package on npm and attached to the corresponding GitHub Release. To
reproduce it locally, run the CLI build script from the repo root:

```
bun run ./packages/botconnector/script/build.ts --single --skip-embed-web-ui
```

then copy the resulting binary from `packages/botconnector/dist/` into this
directory before running `npm publish`.
