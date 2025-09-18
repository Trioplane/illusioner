import Parser from "./parser.ts";

repl();

async function repl() {
    const commandTreeFilePath = "./commands.json"
    const commandTreeString = new TextDecoder().decode(await Deno.readFile(commandTreeFilePath))
    const commandTree = JSON.parse(commandTreeString)
    
    const parser = new Parser(commandTree)
    let prevCommand = ""

    console.log(`\nMCFunction Parser Repl (using command tree from ${commandTreeFilePath})`)

    while (true) {
        const input = prompt("> ")
        if (!input) {
            continue
        }
        if (input === "exit") {
            Deno.exit(1)
        }

        if (input === "$") {
            if (!prevCommand) {
                console.log("Please enter a command first.")
                continue
            }
            console.log(prevCommand)
            console.log(parser.produceAST(prevCommand))
            continue
        }

        prevCommand = input
        const ast = parser.produceAST(input)
        await Deno.writeFile("./result.json", new TextEncoder().encode(JSON.stringify(ast, null, 2)))
        console.log(ast)
    }
}