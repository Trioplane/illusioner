/*
    execute as @a run \
        say hi
    
    $say $(message)

    [NodeToken, NodeToken, NodeToken, NodeToken, NewlineToken, NodeToken, NodeToken, MacroToken]
*/

export enum TokenType {
    Node,
    Macro,
    NewlineSymbol,
    EOF
}

export interface Token {
    value: string,
    type: TokenType
}

function isSkippable(str: string): boolean {
    return /[ \n\t\r]/.test(str)
}

function token(value = "", type: TokenType) {
    return { value, type }
}

export function tokenize(sourceCode: string): Token[] {
    const tokens: Token[] = [];
    const src = sourceCode.split("")
    
    while (src.length > 0) {
        if (src[0] === "\\") {
            tokens.push(token(src.shift(), TokenType.NewlineSymbol))
        } else {
            // Node token
            if (src[0] === "$") {
                let macro = ""

                // deno-lint-ignore ban-ts-comment
                // @ts-ignore
                // TS is too dumb to see that src[0] changed after it got shifted.
                while (src.length > 0 && src[0] !== "\n") {
                    macro += src.shift()
                }
                tokens.push(token(macro, TokenType.Macro))
            } else if (!isSkippable(src[0])) {
                let node = ""
                while (src.length > 0 && !isSkippable(src[0])) {
                    node += src.shift()
                }
                tokens.push(token(node, TokenType.Node))
            } else if (isSkippable(src[0])) {
                src.shift()
            }
        }
    }
    tokens.push(token("", TokenType.EOF))

    return tokens
}