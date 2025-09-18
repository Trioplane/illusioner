// deno-lint-ignore-file ban-ts-comment
import { Statement, Root, Literal, Argument, Macro } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

interface CommandTree {
    type: string,
    children: Record<string, CommandTree>,
    executable?: boolean,
    parser?: string
}

export default class Parser {
    private tokens: Token[] = [];
    private commandTree: CommandTree = {} as CommandTree;

    constructor(commandTree: CommandTree) {
        this.commandTree = commandTree
    }

    public produceAST(sourceCode: string): Root {
        this.tokens = tokenize(sourceCode)
        console.log(this.tokens)

        const root: Root = {
            kind: "Root",
            body: []
        }

        while (this.tokens[0].type !== TokenType.EOF) {
            root.body.push(this.parse_statement())
        }

        return root
    }

    private eat() {
        return this.tokens.shift() as Token
    }

    private error(message: string, expects?: string[]) {
        console.error(message)
        if (expects) {
            const cutNumber = Math.min(expects.length, 9)
            const expectsToShow = expects.slice(0, cutNumber)
            const entriesRemaining = expects.length - (cutNumber + 1)
            let expectsMessage = `Expected ${expectsToShow.join(", ")}`
            if (entriesRemaining === 1) {
                expectsMessage += `, ..., and ${entriesRemaining} more entry.`
            } else if (entriesRemaining > 1) {
                expectsMessage += `, ..., and ${entriesRemaining} more entries.`
            }
            console.error(expectsMessage)
        }
    }

    private parse_statement(): Statement {
        const token = this.eat()
        switch (token.type) {
            case TokenType.Node: {
                const rootLiterals = this.commandTree.children // The actual command names
                const possibleNextLiterals = Object.keys(this.commandTree.children)

                if (possibleNextLiterals.includes(token.value)) {
                    return this.parse_literal(token, rootLiterals[token.value].children)
                } else throw this.error(`Unexpected token: ${token.value}`, possibleNextLiterals)
            }   
            case TokenType.Macro:
                return { kind: "Macro", value: token.value } as Macro
            default:
                throw new SyntaxError("PANIC! PANIC! WHAT THE HECK IS THIS TOKEN!!! (parse statement switch hit default)")
        }
    }

    private parse_literal(literal: Token, possibleChildren?: Record<string, CommandTree>): Literal {
        const tree: Literal = {kind: "Literal", name: literal.value}

        if (possibleChildren) {
            const possibleNextLiterals: string[] = [];
            let possibleNextArgument: CommandTree = {} as CommandTree;
            tree.children = [];

            for (const child in possibleChildren) {
                const childTree = possibleChildren[child]
                if (childTree.type === "literal") possibleNextLiterals.push(child)
                if (childTree.type === "argument") possibleNextArgument = childTree
            }

            const nextToken = this.eat()

            if (possibleNextLiterals.includes(nextToken.value)) {
                tree.children.push(this.parse_literal(nextToken, possibleChildren[nextToken.value].children))
            } else if (possibleNextArgument) {
                tree.children.push(this.parse_argument(nextToken, possibleNextArgument.parser, possibleNextArgument.children))
            } else throw this.error(`Unexpected token: ${nextToken.value}`, possibleNextLiterals)
        }

        return tree
    }

    private parse_argument(argument: Token, parser?: string, possibleChildren?: Record<string, CommandTree>): Argument {
        // this is the complicated part
        const tree: Argument = {kind: "Argument"} as Argument
        if (parser === "minecraft:message") {
            let message = this.tokens[0].type !== TokenType.EOF ? `${argument.value} ` : argument.value;
            while (this.tokens[0].type !== TokenType.EOF && this.tokens[0].type === TokenType.Node) {
                message += this.eat().value

                // @ts-ignore
                // TS is too dumb to see that this.tokens[0] changed after it got eaten.
                if (this.tokens[0].type === TokenType.Node) message += " "
            }

            tree.value = message
        }
        return tree
    }
}