import { TableNode } from "@/model/main/tableNode";
import { ConnectionManager } from "@/service/connectionManager";
import * as vscode from "vscode";
import { HoverProvider } from "vscode";

export class TableInfoHoverProvider implements HoverProvider {

    public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover> {

        const tableName = document.getText(document.getWordRangeAtPosition(position));
        const tableNode = ConnectionManager.tryGetConnection()?.getByRegion(tableName) as TableNode

        const sourceCode = await tableNode?.execute<any[]>(tableNode.dialect.showTableSource(tableNode.schema, tableNode.table))
        if (sourceCode) {
            const args = [`SELECT * FROM ${tableNode.table}`];
            const runCommandUri = vscode.Uri.parse(`command:mysql.codeLens.run?${encodeURIComponent(JSON.stringify(args))}`);
            const markdownStr = new vscode.MarkdownString(`[Query Table](${runCommandUri})`);
            markdownStr.isTrusted=true;
            markdownStr.appendCodeblock(sourceCode[0]['Create Table'], "sql");
            return new vscode.Hover(markdownStr);
        }

        const selections = vscode.window.activeTextEditor?.selections || []
        for (const selection of selections) {
            if (selection.contains(position)) {
                const args = [document.getText(selection)];
                const runCommandUri = vscode.Uri.parse(`command:mysql.runSQL?${encodeURIComponent(JSON.stringify(args))}`);
                const contents = new vscode.MarkdownString(`[Run Selected SQL](${runCommandUri})`);
                contents.isTrusted = true;
                const hover = new vscode.Hover(contents);
                return hover;
            }
        }

        return null;
    }

}
