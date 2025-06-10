import * as vsc from 'vscode';
import * as spyglassCore from '@spyglassmc/core';
import * as spyglassJe from '@spyglassmc/java-edition';
import * as spyglassMcf from '@spyglassmc/mcfunction';

function getLeaves(node: spyglassCore.AstNode, parent: spyglassCore.AstNode=null, leaves: spyglassCore.AstNode[]=[]) {
    if (!node.children) {
        if (parent) { node.parent = parent; }
        leaves.push(node); 
    } else {
        for (const child of node.children) {
            getLeaves(child, node, leaves);
        }
    }
    return leaves;
}

export class MCFunctionFormatter implements vsc.DocumentFormattingEditProvider {
    functionParser: any;
    parserContext: spyglassCore.ParserContext;

    constructor(functionParser: any, parserContext: spyglassCore.ParserContext) {
        this.functionParser = functionParser;
        this.parserContext = parserContext;
    }

    provideDocumentFormattingEdits(document: vsc.TextDocument, options: vsc.FormattingOptions, token: vsc.CancellationToken): vsc.ProviderResult<vsc.TextEdit[]> {
        const indentSize: number = vsc.workspace.getConfiguration("illusioner").get("indentSize") as number;
        const indent: string = " ".repeat(indentSize);
        let edits: vsc.TextEdit[] = [];

        const source = new spyglassCore.Source("tp @e[type=pig,limit=5] ~0.5 ~0.5 ~0.5");
        const node: spyglassCore.AstNode = this.functionParser(source, this.parserContext);
        console.log(JSON.stringify(node, null, 4))
        console.log(node)

        const leaves = getLeaves(node) as any;
        
        return edits;
    }
}