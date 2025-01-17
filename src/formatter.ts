import * as vsc from 'vscode';
import * as spyglassCore from '@spyglassmc/core';
import * as spyglassJe from '@spyglassmc/java-edition';
import * as spyglassMcf from '@spyglassmc/mcfunction';

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
        const node = this.functionParser(source, this.parserContext);

        console.log("Source: ", source);
        console.log(node);

        return edits;
    }
}