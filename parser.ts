// deno-lint-ignore-file ban-ts-comment
import { Statement, Root, Literal, Argument, Macro, NodeParsers } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

interface CommandTree {
    type: string,
    children: CommandTreeChildren,
    executable?: boolean,
    parser?: NodeParsers,
    redirect?: string[],
    name?: string // this doesn't exist in the real command tree, just makes life easier
}

type CommandTreeChildren = Record<string, CommandTree>

export default class Parser {
    private tokens: Token[] = [];
    private commandTree: CommandTree = {} as CommandTree;
    private rootLiterals: CommandTreeChildren = {} as CommandTreeChildren;

    constructor(commandTree: CommandTree) {
        this.commandTree = commandTree
        this.rootLiterals = this.commandTree.children
    }

    /**
     * This should only be used when done checking all the necessary stuff to finally consume the token.
     * 
     * If not, a variable to `this.token[0]` should be used.
     */
    private eat() {
        return this.tokens.shift() as Token
    }

    private error(message: string, expects?: string[]) {
        console.error("\x1b[0;31m" + message + "\x1b[0m")
        console.error(this.tokens[0])
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
            console.error("\x1b[0;91m" + expectsMessage + "\x1b[0m")
        }
    }

    private getNext(children: CommandTreeChildren) {
        const nextLiterals: string[] = []
        let nextArgument: CommandTree | null = null;
        const nextRedirectLiterals: Record<string, string[]> = {}
        const nextRedirectArguments: Record<string, CommandTree | null> | null = {};
        
        for (const child in children) {
            const childTree = children[child]

            if (childTree.type === "literal") { nextLiterals.push(child) }
            if (childTree.type === "argument") nextArgument = { ...childTree, name: child }

            // Check for redirects and resolve their children

            // let childTree.redirect = [ "execute", "tp" ]
            if (childTree.redirect) {
                for (const redirect of childTree.redirect) {
                    // redirect = "execute" | "tp"
                    const redirectChildren = this.rootLiterals[redirect].children
                    nextRedirectLiterals[redirect] = []

                    for (const rChild in redirectChildren) {
                        const rChildTree = redirectChildren[rChild]

                        if (rChildTree.type === "literal") { nextRedirectLiterals[redirect].push(rChild) }
                        if (rChildTree.type === "argument") { nextRedirectArguments[redirect] = { ...rChildTree, name: rChild } }
                    }
                }
            }
        }

        return { nextLiterals, nextArgument, nextRedirectLiterals, nextRedirectArguments }
    }

    public produceAST(sourceCode: string): Root {
        this.tokens = tokenize(sourceCode)
        //console.log(this.tokens)

        const root: Root = {
            kind: "Root",
            body: []
        }

        while (this.tokens[0].type !== TokenType.EOF) {
            root.body.push(this.parse_statement())
        }

        return root
    }

    private parse_statement(): Statement {
        const token = this.tokens[0]

        switch (token.type) {
            case TokenType.Node: {
                // Only literals are expected in first children 'cause command names.
                const { nextLiterals } = this.getNext(this.rootLiterals)

                if (nextLiterals.includes(token.value)) {
                    return this.parse_literal(this.eat(), this.rootLiterals)
                } else throw this.error(`Unexpected token: ${token.value}`, nextLiterals)
            }   
            case TokenType.Macro:
                return { kind: "Macro", value: this.eat().value } as Macro
            default:
                console.log(token)
                throw new SyntaxError("PANIC! PANIC! WHAT THE HECK IS THIS TOKEN!!! (parse statement switch hit default)")
        }
    }

    private parse_literal(literal: Token, nextChildren?: CommandTreeChildren): Literal {
        const tree: Literal = {kind: "Literal", name: literal.value}

        const nextToken = this.tokens[0]

        if (nextChildren) {
            const { 
                nextArgument, 
                nextLiterals,
            } = this.getNext(nextChildren[literal.value].children)

            const { 
                nextRedirectArguments,
                nextRedirectLiterals                
            } = this.getNext(nextChildren)

            tree.children = []

            // Error if command ends too early
            if (
                nextToken.type === TokenType.EOF 
                && (nextLiterals.length > 0 || Object.keys(nextRedirectLiterals).length > 0 || nextArgument || Object.keys(nextRedirectArguments).length > 0) // cursed if statement
            ) {
                throw nextArgument && nextArgument.parser
                    ? this.error("Unexpected end of file", [nextArgument?.parser, ...nextLiterals])
                    : this.error("Unexpected end of file", nextLiterals)
            }

            console.log("PARSE LITERAL", nextToken)

            const redirects = nextChildren[literal.value]?.redirect

            // Try literals first before considering argument & redirects
            if (nextLiterals.includes(nextToken.value)) {
                console.log("literal block")
                tree.children.push(this.parse_literal(this.eat(), nextChildren[nextToken.value].children))
            } 
            else if (nextArgument && nextArgument.parser) {
                console.log("argument block")
                tree.children.push(this.parse_argument(this.eat(), nextArgument.parser, nextArgument.children, nextArgument.name))
            } 
            else if (redirects) {
                console.log("redirect block")
                for (const redirect of redirects) {
                    if (nextRedirectLiterals[redirect] && nextRedirectLiterals[redirect].includes(nextToken.value)) {
                        console.log("redirect literal block")
                        tree.children.push(this.parse_literal(this.eat(), this.rootLiterals[redirect].children))
                        break
                    } else if (nextRedirectArguments[redirect] && nextRedirectArguments[redirect].parser) {
                        console.log("redirect argument block")
                        tree.children.push(this.parse_argument(this.eat(), nextRedirectArguments[redirect].parser, this.rootLiterals[redirect].children, nextRedirectArguments[redirect].name))
                        break
                    }
                }

                // If nothing passed, we die
                throw this.error("Unexpected token, has redirect")
            } 
            else throw nextArgument && nextArgument.parser
                    ? this.error("Unexpected token", [nextArgument?.parser, ...nextLiterals])
                    : this.error("Unexpected token", nextLiterals)
        }

        return tree
    }

    private parse_argument(argument: Token, parser: NodeParsers, nextChildren?: CommandTreeChildren, name?: string): Argument {
        // this is the complicated part
        // Parsers translated from MC & Brigadier source code.
        const tree: Argument = { kind: "Argument", parser } as Argument

        if (!name) throw new SyntaxError("PANIC PANIC!!! THE ARGUMENT DOESNT HAVE A NAME!!!") 

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

        const nextToken = this.tokens[0]

        if (nextChildren) {
            const { 
                nextArgument, 
                nextLiterals,
            } = this.getNext(nextChildren[name].children)

            const { 
                nextRedirectArguments,
                nextRedirectLiterals                
            } = this.getNext(nextChildren)

            tree.children = []

            // Error if command ends too early
            if (
                nextToken.type === TokenType.EOF 
                && (nextLiterals.length > 0 || Object.keys(nextRedirectLiterals).length > 0 || nextArgument || Object.keys(nextRedirectArguments).length > 0) // cursed if statement
            ) {
                throw nextArgument && nextArgument.parser
                    ? this.error("Unexpected end of file", [nextArgument?.parser, ...nextLiterals])
                    : this.error("Unexpected end of file", nextLiterals)
            }

            console.log("PARSE ARG", nextToken)

            const redirects = nextChildren[name]?.redirect

            // Try literals first before considering argument & redirects
            if (nextLiterals.includes(nextToken.value)) {
                console.log("literal block")
                tree.children.push(this.parse_literal(this.eat(), nextChildren[nextToken.value].children))
            } 
            else if (nextArgument && nextArgument.parser) {
                console.log("argument block")
                tree.children.push(this.parse_argument(this.eat(), nextArgument.parser, nextChildren[name].children, nextArgument.name))
            } 
            else if (redirects) {
                console.log("redirect block")
                for (const redirect of redirects) {
                    if (nextRedirectLiterals[redirect] && nextRedirectLiterals[redirect].includes(nextToken.value)) {
                        console.log("redirect literal block")
                        tree.children.push(this.parse_literal(this.eat(), this.rootLiterals[redirect].children))
                        break
                    } else if (nextRedirectArguments[redirect] && nextRedirectArguments[redirect].parser) {
                        console.log("redirect argument block")
                        tree.children.push(this.parse_argument(this.eat(), nextRedirectArguments[redirect].parser, this.rootLiterals[redirect].children, nextRedirectArguments[redirect].name))
                        break
                    }
                }

                // If nothing passed, we die
                throw this.error("Unexpected token, has redirect")
            } 
            else throw nextArgument && nextArgument.parser
                    ? this.error("Unexpected token", [nextArgument?.parser, ...nextLiterals])
                    : this.error("Unexpected token", nextLiterals)
        }

        return tree
    }
}