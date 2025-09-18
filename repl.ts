import Parser from "./parser.ts";

repl();

async function tryParse(parser: Parser, source: string) {
    try {
        const ast = parser.produceAST(source)
        await Deno.writeFile("./debug/result.json", new TextEncoder().encode(JSON.stringify(ast, null, 2)))
        console.log(ast)
    } catch (error) {
        console.error(error)
    }
}

async function repl() {
    const commandTreeFilePath = "./commands.json"
    const commandTreeString = new TextDecoder().decode(await Deno.readFile(commandTreeFilePath))
    const commandTree = JSON.parse(commandTreeString)
    
    const parser = new Parser(commandTree)
    const textDecoder = new TextDecoder()
    console.log(`\nMCFunction Parser Repl (using command tree from ${commandTreeFilePath})`)

    while (true) {
        const input = prompt("> ")
        if (!input) {
            continue
        }
        if (input.startsWith("read")) {
            const filePath = input.split(" ")[1]
            if (filePath === undefined) {
                console.log("Please provide a file")
                continue
            }

            const rawFile = await Deno.readFile(filePath)
            const fileString = textDecoder.decode(rawFile)
            await tryParse(parser, fileString)
            continue
        }
        if (input === "exit") {
            Deno.exit(1)
        }

        await tryParse(parser, input)
    }
}