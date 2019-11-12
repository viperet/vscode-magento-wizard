import * as vscode from 'vscode';
import createQuickPickCustom, { QuickPickCustomOptons } from './quickPickCustom';
import magento, { ExtensionInfo, ExtentionKind }  from './magento';
import createExtension from './actions/createExtension';
import injectDependency from './actions/injectDependency';
import addObserver from './actions/addObserver';
import addPlugin from './actions/addPlugin';
import generateCatalog from './actions/generateCatalog';
import Php, { ClassMethod, MethodVisibility } from './php';
import { MagentoTaskProvider } from './actions/MagentoTaskProvider';
import { definitionProvider } from './actions/definitionProvider';

async function getVendorExtension(options?: QuickPickCustomOptons): Promise<ExtensionInfo | undefined> {
    if (!options) {
        options = {};
    }
    options.step = options.step || 1;
    options.totalSteps = options.totalSteps || 2;
    let currentWorkspace: vscode.WorkspaceFolder | undefined;
    if (!vscode.workspace.workspaceFolders) {
        throw new Error('No workspace folders found');
    }
    currentWorkspace = vscode.workspace.workspaceFolders[0];
    if (vscode.workspace.workspaceFolders.length > 1) {
        currentWorkspace = await vscode.window.showWorkspaceFolderPick();
    } else {
        currentWorkspace = vscode.workspace.workspaceFolders[0];
    }
    if (!currentWorkspace) {
        return undefined;
    }
    magento.folder = currentWorkspace;
    let vendors = magento.getVendors();
    let vendor = await createQuickPickCustom(vendors, Object.assign({}, options, { title: options.custom ? 'Please enter Vendor name' : 'Please select Vendor' }));
    let extension;
    if (vendor) {
        options.step++;
        if (options.custom) {
            extension = await createQuickPickCustom([], Object.assign({}, options, { title: 'Enter Extension Name' }));
        } else {
            let extensions = magento.getExtensions(vendor);
            extension = await createQuickPickCustom(extensions, Object.assign({}, options, { title: 'Please select Extension' }));
        }
        if (extension) {
            let extensionFolder = `app/code/${vendor}/${extension}`;
            return {
                workspace: currentWorkspace,
                vendor,
                extension,
                extensionFolder,
                extensionUri: magento.appendUri(currentWorkspace.uri, extensionFolder),
            };
        }
    } else {
        return undefined;
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.newExtension', async () => {
        const data = await getVendorExtension({ custom: true });
        if (!data) {
            return;
        }
        try {
            await createExtension(data.vendor, data.extension);
            vscode.window.showInformationMessage(`Created extension ${data.vendor}_${data.extension}`);
        } catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.injectDependency', async () => {
        let textEditor = vscode.window.activeTextEditor;
        try {
            if (!textEditor || textEditor.document.languageId !== 'php') {
                throw new Error('Only supported for PHP files');
            }
            let data = await magento.getUriData(textEditor.document.uri);
            if (!data.vendor || !data.extension) {
                throw new Error('Not a Magento 2 extension file');
            }
            let folder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri);
            if (folder) {
                magento.folder = folder;
            }
            if (textEditor) {
                let className = await createQuickPickCustom(magento.getClasses(data), { step: 1, totalSteps: 2, title: 'Please select class or interface to inject' });
                if (className) {
                    var varName = await vscode.window.showInputBox({
                        prompt: 'Enter variable name',
                        value: magento.suggestVariableName(className),
                        validateInput: value => { return !value.match(/^\$?[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/) ? 'Incorrect variable name' : '' ; },
                    });
                    if (varName) {
                        await injectDependency(textEditor, className, varName);
                    }
                }
            }
        } catch(e) {
            vscode.window.showErrorMessage(e.message);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.addObserver', async () => {
        let textEditor = vscode.window.activeTextEditor;
        let step, totalSteps;
        try {
            let extensionData;
            if (textEditor) {
                try {
                    extensionData = await magento.getUriData(textEditor.document.uri);
                    totalSteps = 2;
                    step = 1;
                } catch {}
            }
            if (!extensionData || !extensionData.vendor || !extensionData.extension) {
                totalSteps = 4;
                step = 3;
                extensionData = await getVendorExtension({ custom: false, totalSteps });
            }
            if (!extensionData || !extensionData.vendor || !extensionData.extension) {
                return;
            }
            let eventName = await createQuickPickCustom(magento.getEvents(), { custom: true, step, totalSteps, title: 'Please select event name' });
            if (eventName) {
                var observerName = await vscode.window.showInputBox({
                    prompt: 'Enter observer class name',
                    value: magento.suggestObserverName(eventName),
                    validateInput: value => { return !magento.validateClassName(value) ? 'Incorrect class name' : '' ; },
                });
                if (observerName) {
                    await addObserver(extensionData, eventName, observerName!);
                }
            }
        } catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.addPlugin', async () => {
        let textEditor = vscode.window.activeTextEditor;
        let step = 1, totalSteps = 4;
        try {
            let extensionData;
            if (textEditor) {
                try {
                    extensionData = await magento.getUriData(textEditor.document.uri);
                } catch {}
            }
            if (!extensionData || !extensionData.vendor || !extensionData.extension) {
                totalSteps = 6;
                step = 3;
                extensionData = await getVendorExtension({ custom: false, totalSteps });
            }
            if (!extensionData || !extensionData.vendor || !extensionData.extension) {
                return;
            }
            let className = await createQuickPickCustom(magento.getClasses(extensionData), { custom: true, step, totalSteps, title: 'Please enter or select class in which you want to intercept method call' });
            if (!className) { return; }

            let classFile = await magento.getClassFile(extensionData, className);

            let methods: ClassMethod[] = [];
            if (classFile) {
                methods = await magento.getClassMethods(classFile);
            }
            let methodsNames: string[] = [];
            if (methods) {
                methodsNames = methods
                    .filter(method => method.visibility === MethodVisibility.public && method.name !== '__construct' )
                    .map(method => {
                        let params: string[] = method.parameters.map(param => (param.type ? param.type + ' $' : '$') + param.name);
                        return method.name+'('+params.join(', ')+')';
                    });
            }
            step++;
            let methodSelected= await createQuickPickCustom(methodsNames, { custom: true, step, totalSteps, title: 'Please enter or select method you want to intercept' });
            if (!methodSelected) { return; }
            const methodMatches = methodSelected.match(/^([a-zA-Z0-9_]+)\(?/);
            if (!methodMatches) { return; }
            let methodName = methodMatches[1];
            let method = methods.find(function (this: string, method) { return method.name === this; }, methodName);
            if (!method) {
                method = {
                    name: methodName,
                    visibility: MethodVisibility.public,
                    parameters: [
                        {
                            name: 'arg1',
                            type: '',
                            value: '',
                        }
                    ]
                };
            }

            step++;
            let pluginType = await createQuickPickCustom(['before', 'after', 'around'], { custom: false, step, totalSteps, title: 'Please select plugin type' });
            if (!pluginType) { return; }

            var pluginName = await vscode.window.showInputBox({
                prompt: 'Enter plugin class name',
                value: magento.suggestPluginName(className),
                validateInput: value => { return !magento.validateClassName(value) ? 'Incorrect class name' : '' ; },
            });
            if (!pluginName) { return; }

            await addPlugin(extensionData, className, method, pluginType, pluginName);
        } catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('magentowizard.generateCatalog', async () => {
        let textEditor = vscode.window.activeTextEditor;
        try {
            let currentWorkspace;
            if (!vscode.workspace.workspaceFolders) {
                throw new Error('No open workspace folders');
            }
            if (vscode.workspace.workspaceFolders.length > 1) {
                currentWorkspace = await vscode.window.showWorkspaceFolderPick();
            } else {
                currentWorkspace = vscode.workspace.workspaceFolders[0];
            }
            if (currentWorkspace) {
                await generateCatalog(context, currentWorkspace);
            }
        } catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    }));

    let lastOpenedDocument: vscode.TextDocument | undefined;
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(textDocument => {
        lastOpenedDocument = textDocument;
    }));
    context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(async textEditors => {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (lastOpenedDocument && activeEditor && activeEditor.document.uri.toString() === lastOpenedDocument.uri.toString()) {
                await magento.applyTemplate(activeEditor);
            }
            lastOpenedDocument = undefined;
        } catch (e) {
            console.error(e);
        }
    }));
    if (vscode.workspace.workspaceFolders) {
        for(let workspaceFolder of vscode.workspace.workspaceFolders) {
            context.subscriptions.push(vscode.tasks.registerTaskProvider(MagentoTaskProvider.MagentoScriptType, new MagentoTaskProvider(workspaceFolder)));
        }
    }

    context.subscriptions.push(vscode.languages.registerDefinitionProvider('xml', definitionProvider));
}

// this method is called when your extension is deactivated
export function deactivate() {}
