import fs from "fs/promises";
import path from "path";
import mustache from "mustache";
import _ from "lodash";

import Log from "@novemberizing/log";

import StaticExceptionInvalidParameter from "./static/exception/invalid/Parameter.js";

export default class Static {
    static #tag = "Static";

    static async job(root, current, config, destination) {
        for(const file of await fs.readdir(`${root}/${current}`)) {
            const workPath = _.join(_.slice(_.split(`${root}/${current}`, '/'), 2), '/');
            const originalPath = `${root}/${current}/${file}`;
            const destinationPath = `${destination}${workPath ? `/${workPath}` : ''}/${file}`;

            const stat = await fs.lstat(originalPath);
            if(stat.isFile()) {
                const s = await fs.readFile(originalPath, { encoding: 'utf8' });
                
                if(config) {
                    if(config[file]) {
                        const output = mustache.render(s, config[file]);

                        await fs.writeFile(destinationPath, output, { encoding: 'utf8' });
                        continue;
                    }
                    if(config[file] === false) {
                        continue;
                    }
                }
                
                await fs.cp(originalPath, destinationPath);      
            } else if(stat.isDirectory()) {
                if(config) {
                    if(config[file] === false) {
                        continue;
                    }
                }
                
                fs.mkdir(destinationPath);
                await Static.job(`${root}/${current}`, file, config ? config[file] : null, destination);
            } else {
                Log.w(Static.#tag, `${originalPath} is not a file or a directory.`);

                await fs.cp(originalPath, destinationPath);
            }
        }
    }

    static async gen(command) {
        Log.v(Static.#tag, "validate parameter.");

        console.log(command);

        if(!command.theme) throw new StaticExceptionInvalidParameter(`theme is not defined. (ex: --theme="[theme name]")`);
        if(!command.destination) throw new StaticExceptionInvalidParameter(`destination is not defined. (ex: --destination="[path]")`);

        Log.v(Static.#tag, "initialize variable.");

        const { theme, destination } = command;

        Log.v(Static.#tag, "check work directory.");
        
        try {
            const stat = await fs.lstat(destination);
            if(!stat.isDirectory()) {
                Log.e(Static.#tag, `${destination} is not directory.`);

                return new StaticExceptionInvalidParameter(`${destination} is not directory.`);
            }
        } catch(e) {
            await fs.mkdir(destination, { recursive: true });
        }

        Log.v(Static.#tag, "clean work directory.");

        // TODO: NOT CLEAN DIR 파일을 삭제하는 것은 무섭다. 그렇기 때문에 버전 관리 시스템이 필요하다. 롤백 가능하도록 ...
        // TODO: 중간 중간 커밋되도록 하자. 크리에이터가 작업을 날리지 않도록,... 로그아웃하면 알아서 커밋하도록 하자. 세션이 종료
        // TODO: 보안 상 문제 되는 부분을 정리하고 이를 적용하자. 절대로 허가되지 않은 공간에 작업을 해서는 안된다.
        for(const file of await fs.readdir(destination)) {
            await fs.rm(path.join(destination, file), { recursive: true });
        }

        Log.v(Static.#tag, "check theme directory.");

        const stat = await fs.lstat(`theme/${theme}`);
        if(!stat.isDirectory()) {
            return new StaticExceptionInvalidParameter('theme is invalid.');
        }

        Log.v(Static.#tag, "load configure json.");

        // TODOL JSON TEMPLATE 을 만들자.
        const config = JSON.parse(await fs.readFile(`theme/${theme}.json`));

        Log.v(Static.#tag, "convert.")

        await Static.job('theme', theme, config, destination);

        return {};
    }
}