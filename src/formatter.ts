import * as vscode from "vscode";

export class MCFunctionExecuteFormatter implements vscode.DocumentFormattingEditProvider {
    getExecuteArguments(command: string) {
        const args = command.split(" ");
        const result = [];
        let index = 0;

        if (args[1] === "\\") { return [args.join(" ")]; }
    
        while (index < args.length) {
            const mainArgument = args[index];
    
            if (mainArgument === "execute" && result.length > 0) {
                result.push("execute");
                index++;
                continue;
            }
    
            switch (mainArgument) {
                case "align":
                case "anchored":
                case "as":
                case "at":
                case "in":
                case "on":
                    result.push(`${mainArgument} ${args[index + 1]}`);
                    index += 2;
                    break;
    
                case "facing":
                    result.push(
                        `facing ${args[index + 1]} ${args[index + 2]} ${
                            args[index + 3]
                        }`,
                    );
                    index += 4;
                    break;
    
                case "positioned":
                    if (args[index + 1] === "as" || args[index + 1] === "over") {
                        result.push(
                            `${mainArgument} ${args[index + 1]} ${args[index + 2]}`,
                        );
                        index += 3;
                    } else {
                        result.push(
                            `${mainArgument} ${args[index + 1]} ${
                                args[index + 2]
                            } ${args[index + 3]}`,
                        );
                        index += 4;
                    }
                    break;
                case "rotated":
                    if (args[index + 1] === "as") {
                        result.push(`${mainArgument} as ${args[index + 2]}`);
                        index += 3;
                    } else {
                        result.push(
                            `${mainArgument} ${args[index + 1]} ${args[index + 2]}`,
                        );
                        index += 3;
                    }
                    break;
                case "store": {
                    const dataType = args[index + 2];
    
                    switch (dataType) {
                        case "block":
                            result.push(
                                `${mainArgument} ${args[index + 1]} ${dataType} ${
                                    args[index + 3]
                                } ${args[index + 4]} ${args[index + 5]} ${
                                    args[index + 6]
                                } ${args[index + 7]} ${args[index + 8]}`,
                            );
                            index += 9;
                            break;
                        case "score":
                        case "bossbar":
                            result.push(
                                `${mainArgument} ${args[index + 1]} ${dataType} ${
                                    args[index + 3]
                                } ${args[index + 4]}`,
                            );
                            index += 5;
                            break;
                        case "entity":
                        case "storage":
                            result.push(
                                `${mainArgument} ${args[index + 1]} ${dataType} ${
                                    args[index + 3]
                                } ${args[index + 4]} ${args[index + 5]} ${
                                    args[index + 6]
                                }`,
                            );
                            index += 7;
                            break;
                    }
                    break;
                }
                case "summon":
                    result.push(`summon ${args[index + 1]}`);
                    index += 2;
                    break;
    
                case "if":
                case "unless": {
                    const conditionType = args[index + 1];
    
                    switch (conditionType) {
                        case "entity":
                        case "predicate":
                        case "dimension":
                        case "function":
                            result.push(
                                `${mainArgument} ${conditionType} ${
                                    args[index + 2]
                                }`,
                            );
                            index += 3;
                            break;
                        case "loaded":
                            result.push(
                                `${mainArgument} ${conditionType} ${
                                    args[index + 2]
                                } ${args[index + 3]} ${args[index + 4]}`,
                            );
                            index += 5;
                            break;
                        case "items":
                            switch (args[index + 2]) {
                                case "entity":
                                    result.push(
                                        `${mainArgument} ${conditionType} ${
                                            args[index + 2]
                                        } ${args[index + 3]} ${args[index + 4]} ${
                                            args[index + 5]
                                        }`,
                                    );
                                    index += 6;
                                    break;
                                case "block":
                                    result.push(
                                        `${mainArgument} ${conditionType} ${
                                            args[index + 2]
                                        } ${args[index + 3]} ${args[index + 4]} ${
                                            args[index + 5]
                                        } ${args[index + 6]} ${args[index + 7]}`,
                                    );
                                    index += 8;
                            }
                            break;
                        case "data": {
                            const dataType = args[index + 2];
    
                            switch (dataType) {
                                case "storage":
                                case "entity":
                                    result.push(
                                        `${mainArgument} ${conditionType} ${
                                            args[index + 2]
                                        } ${args[index + 3]} ${args[index + 4]}`,
                                    );
                                    index += 5;
                                    break;
                                case "block":
                                    result.push(
                                        `${mainArgument} ${conditionType} ${
                                            args[index + 2]
                                        } ${args[index + 3]} ${args[index + 4]} ${
                                            args[index + 5]
                                        } ${args[index + 6]}`,
                                    );
                                    index += 7;
                            }
    
                            break;
                        }
                        case "biome":
                        case "block":
                            result.push(
                                `${mainArgument} ${conditionType} ${
                                    args[index + 2]
                                } ${args[index + 3]} ${args[index + 4]} ${
                                    args[index + 5]
                                }`,
                            );
                            index += 6;
                            break;
                        case "score": {
                            const isMatches = args[index + 4] === "matches";
                            if (isMatches) {
                                result.push(
                                    `${mainArgument} score ${args[index + 2]} ${
                                        args[index + 3]
                                    } matches ${args[index + 5]}`,
                                );
                                index += 6;
                            } else {
                                result.push(
                                    `${mainArgument} score ${args[index + 2]} ${
                                        args[index + 3]
                                    } ${args[index + 4]} ${args[index + 5]} ${
                                        args[index + 6]
                                    }`,
                                );
                                index += 7;
                            }
                            break;
                        }
                        case "blocks":
                            result.push(
                                `${mainArgument} ${conditionType} ${
                                    args[index + 2]
                                } ${args[index + 3]} ${args[index + 4]} ${
                                    args[index + 5]
                                } ${args[index + 6]} ${args[index + 7]} ${
                                    args[index + 8]
                                } ${args[index + 9]} ${args[index + 10]} ${
                                    args[index + 11]
                                }`,
                            );
                            index += 12;
                            break;
                    }
                    break;
                }
                case "run": {
                    index++;
                    let commandAfterRun = [];
                    while (index < args.length) {
                        if (args[index] === "execute") {
                            break;
                        }
                        commandAfterRun.push(args[index]);
                        index++;
                    }
                        result.push(`run ${commandAfterRun.join(" ").trim()}`);
                    break;
                }
                default:
                    result.push(mainArgument);
                    index++;
                    break;
            }
        }
    
        return result.filter((arg) => arg.length > 0);
    }
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        const allLines = document.getText().split("\n");

        let linesWithExecute = allLines.map((text, index) => {
            return {
                text: text,
                lineNumber: index,
            };
        }).filter(line => line.text.startsWith("execute"));
        
        let edits: vscode.TextEdit[] = [];

        const indentSize: number = vscode.workspace.getConfiguration("mcfunction-execute-formatter").get("indentSize") as number;

        console.log(indentSize);

        for (let i = 0; i < linesWithExecute.length; i++) {
            const currentLine = linesWithExecute[i];
            const formattedText = this.getExecuteArguments(currentLine.text).join(` \\\n${" ".repeat(indentSize)}`);

            const range = new vscode.Range(
                new vscode.Position(currentLine.lineNumber, 0), 
                new vscode.Position(currentLine.lineNumber, currentLine.text.length)
            );

            edits.push(
                vscode.TextEdit.replace(range, formattedText)
            );
        }
        return edits;
    }
}
