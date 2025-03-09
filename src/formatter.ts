import * as vsc from 'vscode';
import * as spyglassCore from '@spyglassmc/core';
import * as spyglassJe from '@spyglassmc/java-edition';
import * as spyglassMcf from '@spyglassmc/mcfunction';

function getLeaves(node: spyglassCore.AstNode, parent: spyglassCore.AstNode=null, leaves: spyglassCore.AstNode[]=[]) {
    console.log("finding...");
    if (!node.children) {
        console.log("got leaf");
        if (parent) { node.parent = parent; }
        leaves.push(node); 
    } else {
        for (const child of node.children) {
            console.log("found child: ", child.type);
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

        const source = new spyglassCore.Source("execute as @e[type=player,tag=this_is_a_tag] if block ~ ~ ~ minecraft:air run say hi");
        const node: spyglassCore.AstNode = this.functionParser(source, this.parserContext);

        const leaves = getLeaves(node) as any;
        let rebuiltCommand = "";
        let isInsideEntitySelector = false;
        for (const leaf of leaves) {
            console.log(leaf);
            if (leaf.parent.type === "mcfunction:entity_selector") {
                rebuiltCommand += "[";
                isInsideEntitySelector = true;
            }
            console.log(leaf.parent.type, leaf.parent.type.startsWith("mcfunction:entity_selector"))
            if (isInsideEntitySelector && !leaf.parent.type.startsWith("mcfunction:entity_selector")) {
                rebuiltCommand += "] ";
                isInsideEntitySelector = false;
            }
            if (leaf.type === "resource_location") {
                const namespace = leaf.namespace ? `${leaf.namespace}:` : "minecraft:";
                let value = "";
                for (let i = 0; i < leaf.path.length; i++) {
                    value += `${leaf.path[i]}${i !== leaf.path.length - 1 ? "/" : ""}`;
                }
                const content = namespace + value;
                rebuiltCommand += `${content} `;
                console.log(content);
                continue;
            }
            if (leaf.type === "mcfunction:coordinate") {
                const notation = leaf.notation;
                const content = `${notation}${leaf.value !== 0 ? leaf.value : ""}`;
                rebuiltCommand += `${content} `;
                console.log(content);
                continue;
            }
            const content = leaf.value;
            rebuiltCommand += `${content} `;
            console.log(content);
        }

        console.log(rebuiltCommand);

        return edits;
    }
}