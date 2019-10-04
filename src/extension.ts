import * as vscode from 'vscode';
import createQuickPickCustom from './quickPickCustom';
import magento from './magento';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.newExtension', async () => {
        let vendors = magento.getVendors();
        do {
            let vendor = await createQuickPickCustom('Please select Vendor', vendors);
            var extension = await vscode.window.showInputBox({ placeHolder: 'Enter Extension Name'});
            if (extension) {
                await magento.createExtension(vendor, extension);
                vscode.window.showInformationMessage(`Created extension ${vendor}_${extension}`);
            }
        } while (extension === undefined);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.injectDependency', async () => {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            try {
                magento.injectDependency(textEditor);
            } catch(e) {
                vscode.window.showErrorMessage(e.message);
            }
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(textDocument => {
        magento.applyTemplate(textDocument);
    }));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(textDocument => {
        magento.applyTemplate(textDocument);
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {}
