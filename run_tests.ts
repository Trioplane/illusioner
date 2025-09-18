import Parser from "./parser.ts";

const commandTreeFilePath = "./trees/commands.json"
const commandTreeString = new TextDecoder().decode(await Deno.readFile(commandTreeFilePath))
const commandTree = JSON.parse(commandTreeString)
    
const parser = new Parser(commandTree)
const textDecoder = new TextDecoder()

const TESTS_DIR = "./tests"

async function tryParse(parser: Parser, source: string) {
    try {
        const ast = parser.produceAST(source)
        await Deno.writeFile("./debug/result.json", new TextEncoder().encode(JSON.stringify(ast, null, 2)))
        return [ast, null]
    } catch (error) {
        return [error]
    }
}

function diff(string1: string, string2: string): Record<number, {string1: string, string2: string}> {
    const lines1 = string1.split("\n")
    const lines2 = string2.split("\n")

    const diffs: Record<number, {string1: string, string2: string}> = {}

    if (lines1.length < lines2.length) {
        for (let i = 0; i < lines1.length; i++) {
            if (lines1[i] !== lines2[i]) {
                diffs[i] = {
                    string1: lines1[i],
                    string2: lines2[i]
                }
            }
        }
    } else {
        for (let i = 0; i < lines2.length; i++) {
            if (lines1[i] !== lines2[i]) {
                diffs[i] = {
                    string1: lines1[i],
                    string2: lines2[i]
                }
            }
        }
    }

    return diffs
}

function formatDiff(string1: string, string2: string): string {
    const raw = diff(string1, string2)
    let formatted = "";
    let maxLength = 0

    for (const lines in raw) {
        const length = Math.max(raw[lines].string1.length, raw[lines].string2.length)
        if (length > maxLength) maxLength = length
    }
    
    const str1Header = "String 1"
    const str2Header = "String 2"
    const linesHeader = "Lines"

    formatted += `${str1Header}${" ".repeat(maxLength - str1Header.length)}  |`
    formatted += `  ${str2Header}${" ".repeat(maxLength - str2Header.length)}  |`
    formatted += `  ${linesHeader}${" ".repeat(maxLength - linesHeader.length)}\n`
    formatted += `${"-".repeat(maxLength * 2 + 10 + linesHeader.length + 1)}\n`

    for (const lines in raw) {
        const str1 = raw[lines].string1
        const str2 = raw[lines].string2
        const str1Length = raw[lines].string1.length
        const str2Length = raw[lines].string2.length

        formatted += `${str1}${" ".repeat(maxLength - str1Length)}  |`
        formatted += `  ${str2}${" ".repeat(maxLength - str2Length)}  |`
        formatted += `  ${lines}\n`
    }

    return formatted
}

// yeah ik this isn't inefficient but i want fancy numbers and i have no wifi while making this whole thing.
const testFiles = []
for await (const entry of Deno.readDir("./tests")) {
    if (!entry.isFile || entry.name.startsWith("_") || !entry.name.endsWith(".mcfunction")) continue
    testFiles.push(entry.name.split(".")[0])
}

console.log(`\nRunning ${testFiles.length} test files, reading from ${TESTS_DIR} ...`)

let passed = 0;
let failed = 0;
for (let i = 0; i < testFiles.length; i++) {
    const fileName = testFiles[i]

    const MCFunctionFilePath = `${TESTS_DIR}/${fileName}.mcfunction`
    const MCFunctionFile = await Deno.readFile(MCFunctionFilePath)
    const MCFunctionFileString = textDecoder.decode(MCFunctionFile)

    const JSONFilePath = `${TESTS_DIR}/${fileName}.json`
    const JSONFile = await Deno.readFile(JSONFilePath)
    const JSONFileString = textDecoder.decode(JSONFile)
    const correctAst = JSON.stringify(JSON.parse(JSONFileString), null, 2)

    const indexStr = `${i+1}/${testFiles.length}`

    const maxBars = 30
    const barNumber = Math.round(maxBars * (i+1) / testFiles.length) 
    const loadingBar = `[${"=".repeat(barNumber)}${" ".repeat(maxBars - barNumber)}]`

    const [result, error] = await tryParse(parser, MCFunctionFileString)

    if (error !== null) {
        failed++
        console.log(`🔴 ${indexStr} ${loadingBar} "${MCFunctionFilePath}" failed (error)`)
        continue
    }

    if (result) {
        const resultAst = JSON.stringify(result, null, 2)
        if (resultAst !== correctAst) {
            console.log(`🔴 ${indexStr} ${loadingBar} "${MCFunctionFilePath}" failed (ast mismatch)\n`)
            console.log(formatDiff(resultAst,correctAst))
            continue
        }
    }

    passed++
    console.log(`✅ ${indexStr} ${loadingBar} "${MCFunctionFilePath}" passed`)
}

console.log(`\n${passed}/${testFiles.length} tests passed. A total of ${failed} tests failed.`)