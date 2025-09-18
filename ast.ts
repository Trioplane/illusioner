export type NodeType =
    | "Root"
    | "Literal"
    | "Argument"
    | "Macro"
    | "NewlineSymbol"

export interface Statement {
    kind: NodeType
}

export interface Root extends Statement {
    kind: "Root",
    body: Statement[]
}

export interface Literal extends Statement {
    kind: "Literal",
    name: string,
    children?: Statement[]
}

export interface Argument extends Statement {
    kind: "Argument",
    value: string,
    children?: Statement[]
}

export interface Macro extends Statement {
    kind: "Macro",
    value: string,
}

export interface NewlineSymbol extends Statement {
    kind: "NewlineSymbol",
    value: "\\",
}