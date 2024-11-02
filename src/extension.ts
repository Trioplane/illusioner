import * as vscode from 'vscode';
import { MCFunctionExecuteFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(
			{scheme:"file", language:"mcfunction"},
			new MCFunctionExecuteFormatter()
		)	
	);
	console.log("MCFunction Execute Formatter activated.");
}