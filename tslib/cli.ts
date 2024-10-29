import { BrevityParser, BrevityParserConfig } from "./brevityParser"
import { readFileSync } from 'fs'
const defaultConfig: BrevityParserConfig = {
    maxMem: 100
}

function main() {
    let inputText
    for(let i=2; i < process.argv.length; i++) {
        if(process.argv[i] == '-f') inputText = readFileSync(process.argv[++i], {encoding: 'utf-8'})
    }
    if(!inputText) throw Error("must specify input text")
    const parser = new BrevityParser(defaultConfig)
    const output = parser.parseBrevityScript(inputText)
    console.log(`${JSON.stringify(output, null, 2)}`)
}

main()