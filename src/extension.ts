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
            let className = await createQuickPickCustom('Please select class or interface to inject', magento.getClasses());
            if (className) {
                var varName = await vscode.window.showInputBox({
                    prompt: 'Enter variable name',
                    value: magento.suggestVariableName(className),
                    validateInput: value => { return !value.match(/^\$?[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/) ? 'Incorrect variable name' : '' ; },
                });
                if (varName) {
                    // strip $ from the variable name
                    varName = varName.startsWith('$') ? varName.substring(1) : varName;

                    try {
                        magento.injectDependency(textEditor, className, varName);
                    } catch(e) {
                        vscode.window.showErrorMessage(e.message);
                    }
                }
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.addObserver', async () => {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            let eventName = await createQuickPickCustom('Please select event name', magento.getEvents());
            if (eventName) {
                var observerName = await vscode.window.showInputBox({
                    prompt: 'Enter observer class name',
                    value: magento.suggestObserverName(eventName),
                    validateInput: value => { return !value.match(/^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(\\[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)*$/) ? 'Incorrect class name' : '' ; },
                });
                if (observerName) {
                    try {
                        await magento.addObserver(textEditor!, eventName, observerName!);
                    } catch (e) {
                        vscode.window.showErrorMessage(e.message, { modal: true });
                    }
                }
            }
        }
    }));
    // context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(textDocument => {
    //     magento.applyTemplate(textDocument);
    // }));
    // context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(textDocument => {
    //     magento.applyTemplate(textDocument);
    // }));

    let lastOpenedDocument: vscode.TextDocument | undefined;
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(textDocument => {
        lastOpenedDocument = textDocument;
    }));
    context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(textEditors => {
        console.log(vscode.window.activeTextEditor);
        const activeEditor = vscode.window.activeTextEditor;
        if (lastOpenedDocument && activeEditor && activeEditor.document.uri.toString() === lastOpenedDocument.uri.toString()) {
            magento.applyTemplate(activeEditor);
        }
        lastOpenedDocument = undefined;
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {}
