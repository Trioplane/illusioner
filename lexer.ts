// deno-lint-ignore-file ban-ts-comment

export enum TokenType {
    Node,
    Macro,
    EOF
}

export interface Token {
    value: string,
    type: TokenType
}

function isSkippable(str: string): boolean {
    return /[ \r\n\t]/.test(str)
}

function token(value = "", type: TokenType) {
    return { value, type }
}

export function tokenize(sourceCode: string): Token[] {
    const tokens: Token[] = [];
    const src = sourceCode.split("")
    
    while (src.length > 0) {
        if (src[0] === "\\") {
            src.shift()
        } else {
            if (src[0] === "$") {
                // Macro token
                let macro = ""

                // @ts-ignore 
                // TS is too dumb to see that src[0] changed after it got shifted.
                while (src.length > 0 && src[0] !== "\n") {
                    // @ts-ignore
                    if (src[0] === "\\") { // allow multiline
                        src.shift()
                        while (isSkippable(src[0])) src.shift()

                    // @ts-ignore
                    // PESKY CRLF LINE ENDINGS GRR
                    } else if (src[0] === "\r") src.shift()
                    else macro += src.shift()
                }
                tokens.push(token(macro, TokenType.Macro))
            } else if (src[0] === "#") {
                // Remove comments
                // @ts-ignore
                while (src.length > 0 && src[0] !== "\n") {
                    // @ts-ignore
                    if (src[0] === "\\") { // allow multiline
                        src.shift()
                        while (isSkippable(src[0])) src.shift()

                    // @ts-ignore
                    // PESKY CRLF LINE ENDINGS GRR
                    } else if (src[0] === "\r") src.shift()
                    else src.shift()
                }
            } else if (!isSkippable(src[0])) {
                // Node token
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