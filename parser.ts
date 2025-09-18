import { Statement, Root, Literal, Argument } from "./ast.ts";

interface CommandTree {
    type: string,
    children: Record<string, CommandTree>,
    executable?: boolean,
    parser?: string
}

export default class Parser {
    private src: string[] = [];
    private commandTree: CommandTree = {} as CommandTree;

    constructor(commandTree: CommandTree) {
        this.commandTree = commandTree
    }

    private eat() {
        return this.src.shift()
    }

    private isAlpha(char: string): boolean {
        return typeof char === "string" && /[a-zA-Z]/.test(char)
    } 

    public produceAST(sourceCode: string): Root {
        this.src = sourceCode.split("")

        const root: Root = {
            kind: "Root",
            body: []
        }

        while (this.src.length > 0) {
            root.body.push(this.parse_statement())
        }

        return root
    }

    private parse_statement(): Statement {
        const possibleChildren = this.commandTree.children

        const possibleNextLiterals: string[] = [];
        let possibleNextArgument: CommandTree = {} as CommandTree;

        let nextToken: string = ""
        while (this.isAlpha(this.src[0])) {
            nextToken += this.eat()
        }
        this.eat() // eat space

        for (const child in possibleChildren) {
            const childTree = possibleChildren[child]
            if (childTree.type === "literal") possibleNextLiterals.push(child)
            if (childTree.type === "argument") possibleNextArgument = childTree
        }

        if (possibleNextLiterals.includes(nextToken)) {
            return this.parse_literal(nextToken, possibleChildren[nextToken].children)
        } else if (possibleNextArgument !== undefined) {
            return this.parse_argument(nextToken, possibleNextArgument.parser, possibleNextArgument.children)
        } else throw new SyntaxError(`Unexpected token: ${nextToken}`)
    }

    private parse_literal(literal: string, possibleChildren?: Record<string, CommandTree>): Literal {
        const tree: Literal = {kind: "Literal", name: literal}
        if (possibleChildren === undefined) {
            return tree
        } else {
            tree.children = [];
        }

        const possibleNextLiterals: string[] = [];
        let possibleNextArgument: CommandTree = {} as CommandTree;

        for (const child in possibleChildren) {
            const childTree = possibleChildren[child]
            if (childTree.type === "literal") possibleNextLiterals.push(child)
            if (childTree.type === "argument") possibleNextArgument = childTree
        }

        let nextToken: string = ""
        while (this.isAlpha(this.src[0])) {
            nextToken += this.eat()
        }
        this.eat() // eat space

        if (possibleNextLiterals.includes(nextToken)) {
            tree.children.push(this.parse_literal(nextToken, possibleChildren[nextToken].children))
        } else if (possibleNextArgument !== undefined) {
            tree.children.push(this.parse_argument(nextToken, possibleNextArgument.parser, possibleNextArgument.children))
        } else throw new SyntaxError(`Unexpected token: ${nextToken}`)

        return tree
    }

    private parse_argument(argument: string, parser?: string, possibleChildren?: Record<string, CommandTree>): Argument {
        // this is the complicated part
        const tree: Argument = {kind: "Argument"} as Argument
        if (parser === "minecraft:message") {
            let message = argument + " ";
            while (this.src.length > 0) {
                message += this.eat()
            }

            tree.value = message
        }
        return tree
    }
}