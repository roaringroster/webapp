#!/usr/bin/env node

import { readEnv, generateIcons, exitOnError } from "./utils/utils.js";

exitOnError(() => {
  const env = readEnv();
  generateIcons(env.QENV, false);
});
