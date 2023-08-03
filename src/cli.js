#!/usr/bin/env node

import minimist from "minimist";

import Log from "@novemberizing/log";

import StaticException from "./static/Exception.js";
import Static from "./Static.js";

Log.config = {
    name: "static"
};

const command = minimist(process.argv);
delete command._;

const result = await Static.gen(command);

if(result) {
    if(result.name === 'Error') {
        throw new StaticException(result.message, result);
    }
}
