// deno-lint-ignore-file ban-ts-comment
import { Statement, Root, Literal, Argument, Macro, NodeParsers } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

interface CommandTree {
    type: string,
    children: Record<string, CommandTree>,
    executable?: boolean,
    parser?: NodeParsers,
    redirect?: string[]
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
                console.log(token)
                throw new SyntaxError("PANIC! PANIC! WHAT THE HECK IS THIS TOKEN!!! (parse statement switch hit default)")
        }
    }

    private parse_literal(literal: Token, possibleChildren?: Record<string, CommandTree>): Literal {
        const tree: Literal = {kind: "Literal", name: literal.value}

        if (possibleChildren) {
            const possibleNextLiterals: string[] = [];
            let possibleNextArgument: CommandTree | null = null;
            tree.children = [];

            for (const child in possibleChildren) {
                const childTree = possibleChildren[child]
                if (childTree.type === "literal") possibleNextLiterals.push(child)
                if (childTree.type === "argument") possibleNextArgument = childTree
            }

            const nextToken = this.eat()
            // Error if command ends too early
            if (nextToken.type === TokenType.EOF && (possibleNextLiterals.length > 0 || possibleNextArgument)) {
                throw possibleNextArgument && possibleNextArgument.parser 
                    ? this.error("Unexpected end of file", [possibleNextArgument?.parser, ...possibleNextLiterals]) 
                    : this.error("Unexpected end of file", possibleNextLiterals)
            }

            // Try literals first before considering argument
            if (possibleNextLiterals.includes(nextToken.value)) {
                tree.children.push(this.parse_literal(nextToken, possibleChildren[nextToken.value].children))
            } else if (possibleNextArgument && possibleNextArgument.parser) {
                tree.children.push(this.parse_argument(nextToken, possibleNextArgument.parser, possibleNextArgument.children))
            } else throw this.error(`Unexpected token: ${nextToken.value}`, possibleNextLiterals)
        }

        return tree
    }

    private parse_argument(argument: Token, parser: NodeParsers, possibleChildren?: Record<string, CommandTree>): Argument {
        // this is the complicated part
        // Parsers translated from MC & Brigadier source code.
        const tree: Argument = { kind: "Argument", parser } as Argument

        switch (parser) {
            case "minecraft:entity": {
                break
            }
            case "minecraft:resource_key": {
                break
            }
            case "brigadier:string": {
                break
            }
            case "minecraft:resource": {
                break
            }
            case "brigadier:double": {
                break
            }
            case "minecraft:resource_location": {
                break
            }
            case "minecraft:game_profile": {
                break
            }
            case "minecraft:message": {
                let message = this.tokens[0].type !== TokenType.EOF ? `${argument.value} ` : argument.value;
                while (this.tokens[0].type === TokenType.Node) {
                    message += this.eat().value

                    // @ts-ignore
                    // TS is too dumb to see that this.tokens[0] changed after it got eaten.
                    if (this.tokens[0].type === TokenType.Node) message += " "
                }

                tree.value = message
                break
            }
            case "minecraft:component": {
                break
            }
            case "brigadier:integer": {
                break
            }
            case "brigadier:bool": {
                break
            }
            case "minecraft:item_predicate": {
                break
            }
            case "minecraft:block_pos": {
                break
            }
            case "minecraft:block_predicate": {
                break
            }
            case "minecraft:dimension": {
                break
            }
            case "brigadier:float": {
                break
            }
            case "minecraft:vec3": {
                break
            }
            case "minecraft:nbt_path": {
                break
            }
            case "minecraft:nbt_compound_tag": {
                break
            }
            case "minecraft:nbt_tag": {
                break
            }
            case "minecraft:function": {
                break
            }
            case "minecraft:gamemode": {
                break
            }
            case "minecraft:dialog": {
                break
            }
            case "minecraft:swizzle": {
                break
            }
            case "minecraft:entity_anchor": {
                break
            }
            case "minecraft:resource_or_tag": {
                break
            }
            case "minecraft:item_slots": {
                break
            }
            case "minecraft:loot_predicate": {
                break
            }
            case "minecraft:score_holder": {
                break
            }
            case "minecraft:objective": {
                break
            }
            case "minecraft:int_range": {
                break
            }
            case "minecraft:heightmap": {
                break
            }
            case "minecraft:rotation": {
                break
            }
            case "minecraft:uuid": {
                break
            }
            case "minecraft:block_state": {
                break
            }
            case "minecraft:column_pos": {
                break
            }
            case "minecraft:item_stack": {
                break
            }
            case "minecraft:item_slot": {
                break
            }
            case "minecraft:loot_modifier": {
                break
            }
            case "minecraft:resource_or_tag_key": {
                break
            }
            case "minecraft:loot_table": {
                break
            }
            case "minecraft:particle": {
                break
            }
            case "minecraft:template_rotation": {
                break
            }
            case "minecraft:template_mirror": {
                break
            }
            case "minecraft:time": {
                break
            }
            case "minecraft:objective_criteria": {
                break
            }
            case "minecraft:style": {
                break
            }
            case "minecraft:scoreboard_slot": {
                break
            }
            case "minecraft:operation": {
                break
            }
            case "minecraft:vec2": {
                break
            }
            case "minecraft:team": {
                break
            }
            case "minecraft:color": {
                break
            }
            case "minecraft:resource_selector": {
                break
            }
            case "minecraft:hex_color": {
                break
            }
        }

        if (possibleChildren) {
            const possibleNextLiterals: string[] = [];
            let possibleNextArgument: CommandTree | null = null;
            tree.children = [];

            for (const child in possibleChildren) {
                const childTree = possibleChildren[child]
                if (childTree.type === "literal") possibleNextLiterals.push(child)
                if (childTree.type === "argument") possibleNextArgument = childTree
            }

            const nextToken = this.eat()
            // Error if command ends too early
            if (nextToken.type === TokenType.EOF && (possibleNextLiterals.length > 0 || possibleNextArgument)) {
                throw possibleNextArgument && possibleNextArgument.parser 
                    ? this.error("Unexpected end of file", [possibleNextArgument?.parser, ...possibleNextLiterals]) 
                    : this.error("Unexpected end of file", possibleNextLiterals)
            }

            // Try literals first before considering argument
            if (possibleNextLiterals.includes(nextToken.value)) {
                tree.children.push(this.parse_literal(nextToken, possibleChildren[nextToken.value].children))
            } else if (possibleNextArgument && possibleNextArgument.parser) {
                tree.children.push(this.parse_argument(nextToken, possibleNextArgument.parser, possibleNextArgument.children))
            } else throw this.error(`Unexpected token: ${nextToken.value}`, possibleNextLiterals)
        }

        return tree
    }
}