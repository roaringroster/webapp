#!/usr/bin/env node

import { exitOnError, changeCordovaVersion } from "./utils/utils.js";

exitOnError(() => {
  changeCordovaVersion(process.env.npm_package_version);
});
