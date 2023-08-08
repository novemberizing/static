#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import minimist from "minimist";
import _ from "lodash";

import Log from "@novemberizing/log";
import novemberizing from "./index.js";

import StaticExceptionInvalidParameter from "./static/exception/invalid/Parameter.js";

const tag = "cli";

Log.config = {
    name: "static"
};

const command = minimist(process.argv);
delete command._;

async function job(root, current, config, destination) {
    for(const file of await fs.readdir(`${root}/${current}`)) {
        const workPath = _.join(_.slice(_.split(`${root}/${current}`, '/'), 2), '/');
        const originalPath = `${root}/${current}/${file}`;
        const destinationPath = `${destination}${workPath ? `/${workPath}` : ''}/${file}`;

        const stat = await fs.lstat(originalPath);
        if(stat.isFile()) {
            if(config) {
                if(config[file]) {
                    if(originalPath.endsWith(".html")) {
                        const s = await fs.readFile(originalPath, { encoding: 'utf8' });
                        const output = novemberizing.dom.render(s, config[file]);
    
                        await fs.writeFile(destinationPath, output.html, { encoding: 'utf8' });
                    } else {
                        fs.cp(originalPath, destinationPath);
                    }
                } else if(config[file] !== false) {
                    fs.cp(originalPath, destinationPath);
                } else {
                    throw new Error();  // Check This
                }
            } else if(config !== false) {
                fs.cp(originalPath, destinationPath);
            }
        } else if(stat.isDirectory()) {
            if(config) {
                if(config[file] === false) {
                    continue;
                }
            }
            fs.mkdir(destinationPath);
            await job(`${root}/${current}`, file, config ? config[file] : null, destination);
        } else {
            Log.w(tag, `${originalPath} is not a file or a directory.`);

            await fs.cp(originalPath, destinationPath);
        }
    }
}

async function gen(command) {
    Log.v(tag, "validate parameter.");

    if(!command.theme) throw new StaticExceptionInvalidParameter(`theme is not defined. (ex: --theme="[theme name]")`);
    if(!command.destination) throw new StaticExceptionInvalidParameter(`destination is not defined. (ex: --destination="[path]")`);

    Log.v(tag, "initialize variable.");

    const { theme, destination } = command;

    Log.v(tag, "check work directory.");
        
    try {
        const stat = await fs.lstat(destination);
        if(!stat.isDirectory()) {
            Log.e(tag, `${destination} is not directory.`);

            return new StaticExceptionInvalidParameter(`${destination} is not directory.`);
        }
    } catch(e) {
        await fs.mkdir(destination, { recursive: true });
    }

    Log.v(tag, "clean work directory.");

    // TODO: NOT CLEAN DIR 파일을 삭제하는 것은 무섭다. 그렇기 때문에 버전 관리 시스템이 필요하다. 롤백 가능하도록 ...
    // TODO: 중간 중간 커밋되도록 하자. 크리에이터가 작업을 날리지 않도록,... 로그아웃하면 알아서 커밋하도록 하자. 세션이 종료
    // TODO: 보안 상 문제 되는 부분을 정리하고 이를 적용하자. 절대로 허가되지 않은 공간에 작업을 해서는 안된다.
    for(const file of await fs.readdir(destination)) {
        await fs.rm(path.join(destination, file), { recursive: true });
    }

    Log.v(tag, "check theme directory.");

    const stat = await fs.lstat(`theme/${theme}`);
    if(!stat.isDirectory()) {
        return new StaticExceptionInvalidParameter('theme is invalid.');
    }

    Log.v(tag, "load configure json.");

    // TODOL JSON TEMPLATE 을 만들자.
    const config = JSON.parse(await fs.readFile(`theme/${theme}.json`));

    Log.v(tag, "convert.")

    await job('theme', theme, config, destination);

    return {};
}

const result = await gen(command);

if(result) {
    if(result.name === 'Error') {
        throw new StaticException(result.message, result);
    }
}
