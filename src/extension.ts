import * as vsc from 'vscode';
import * as spyglassCore from "@spyglassmc/core";
import * as spyglassJe from "@spyglassmc/java-edition";
import * as spyglassMcf from "@spyglassmc/mcfunction";
import { getPatch } from '@spyglassmc/java-edition/lib/mcfunction/tree/patch.js';
import { MCFunctionFormatter } from './formatter.js';
import { ReleaseVersion } from '@spyglassmc/java-edition/lib/dependency/common.js';
import { parser } from '@spyglassmc/java-edition/lib/mcfunction/index.js';
import { TextDocument } from 'vscode-languageserver-textdocument';

export async function activate(context: vsc.ExtensionContext) {
	const versions = await (await fetch('https://raw.githubusercontent.com/misode/mcmeta/summary/versions/data.json')).json() as spyglassJe.dependency.McmetaVersions;
	const packMcmeta = { pack: { pack_format: 63 } };
	const versionInfo = spyglassJe.dependency.resolveConfiguredVersion('auto', versions, packMcmeta, 'data', console);

	const commands = await (await fetch(`https://raw.githubusercontent.com/misode/mcmeta/${versionInfo.id}-summary/commands/data.json`)).json() as Record<string, any>;
	const tree = spyglassCore.merge(commands, getPatch(versionInfo.id as ReleaseVersion)) as spyglassMcf.RootTreeNode;

	const functionParser = spyglassMcf.entry(tree, parser.argument, {
		lineContinuation: true,
		macros: true
	});

	const parserContext: spyglassCore.ParserContext = {
		fs: null as any as spyglassCore.FileService,
		isDebugging: false,
		logger: console,
		meta: new spyglassCore.MetaRegistry(),
		profilers: spyglassCore.ProfilerFactory.noop(),
		roots: [],
		project: {},
		doc: TextDocument.create('file:///temp.mcfunction', 'mcfunction', 1, ''),
		config: spyglassCore.VanillaConfig,
		err: new spyglassCore.ErrorReporter(),
	};

	context.subscriptions.push(
		vsc.languages.registerDocumentFormattingEditProvider(
			{scheme:"file", language:"mcfunction"},
			new MCFunctionFormatter(functionParser, parserContext)
		)
	);
}