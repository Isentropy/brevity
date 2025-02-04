"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const brevityParser_1 = require("./brevityParser");
const fs_1 = require("fs");
const defaultConfig = {
    maxMem: 100
};
function main() {
    let inputText;
    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i] == '-f')
            inputText = (0, fs_1.readFileSync)(process.argv[++i], { encoding: 'utf-8' });
    }
    if (!inputText)
        throw Error("must specify input text");
    const parser = new brevityParser_1.BrevityParser(defaultConfig);
    const output = parser.parseBrevityScript(inputText);
    console.log(`${JSON.stringify(output, null, 2)}`);
}
main();
