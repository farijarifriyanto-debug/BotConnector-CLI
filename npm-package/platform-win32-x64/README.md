# botconnector-cli-win32-x64

Prebuilt Windows x64 binary for `botconnector-cli`. Not meant to be installed
directly -- install `botconnector-cli` instead, which pulls this in
automatically as an `optionalDependency`.

The `botconnector.exe` binary itself is **not** committed to this repo
(it's ~145MB, over GitHub's 100MB per-file limit). It's published to this
package on npm and attached to the corresponding GitHub Release. To
reproduce it locally, run the CLI build script from the repo root:

```
bun run ./packages/opencode/script/build.ts --single --skip-embed-web-ui
```

then copy the resulting binary from `packages/opencode/dist/` into this
directory before running `npm publish`.
