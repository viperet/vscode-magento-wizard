import * as vscode from 'vscode';
import createQuickPickCustom, { QuickPickCustomOptons } from './quickPickCustom';
import createWorkspacePick from './workspaceFolderPick';
import magento, { ExtensionInfo, ExtentionKind, UriData }  from './magento';
import createExtension from './actions/createExtension';
import injectDependency from './actions/injectDependency';
import addObserver from './actions/addObserver';
import addPlugin from './actions/addPlugin';
import addCRUD from './actions/addCRUD';
import generateCatalog from './actions/generateCatalog';
import Php, { ClassMethod, MethodVisibility } from './php';
import { MagentoTaskProvider } from './actions/magentoTaskProvider';
import { definitionProvider } from './actions/definitionProvider';
import { completionProvider } from './actions/completionProvider';
import Indexer, { BlockData } from './indexer';
import * as output from './output';
import * as Case from 'case';
import * as _ from 'lodash';
import * as semver from 'semver';
import { window, workspace } from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    async function getWorkspaceFolder(): Promise <vscode.WorkspaceFolder | undefined> {
        if (vscode.workspace.workspaceFolders) {
            let magentoFolders = [];
            for(let workspaceFolder of vscode.workspace.workspaceFolders) {
                if (!magento.indexer[workspaceFolder.uri.fsPath]) {
                    magento.indexer[workspaceFolder.uri.fsPath] = new Indexer(context, workspaceFolder);
                }
                if (await magento.indexer[workspaceFolder.uri.fsPath].magentoRoot) {
                    magentoFolders.push(workspaceFolder);
                }
            }
            if (magentoFolders.length === 1) {
                return magentoFolders[0];
            }

            return createWorkspacePick(magentoFolders, { title: 'Select workspace folder' });
        } else {
            // no workspace folders
            return undefined;
        }
    }

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
        currentWorkspace = await getWorkspaceFolder();
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
                // return magento.indexer[currentWorkspace.uri.fsPath].findByVendorExtension(vendor, extension);
                if (magento.indexer[currentWorkspace.uri.fsPath]) {
                    magento.folder = currentWorkspace;
                    let data = magento.getIndexer().findByVendorExtension(vendor, extension);
                    if (data) {
                        // extension exists, return it's data from index
                        return data;
                    }
                    // extension would be created
                    let extensionFolder = magento.appendUri(await magento.getAppCodeUri(), vendor, extension).fsPath;
                    return {
                        workspace: currentWorkspace,
                        vendor,
                        extension,
                        extensionFolder,
                        componentName: vendor+'_'+extension,
                        extensionUri: magento.appendUri(currentWorkspace.uri, extensionFolder),
                    };
                }
            }
        } else {
            return undefined;
        }
    }
    try {
        if (vscode.workspace.workspaceFolders) {
            for(let workspaceFolder of vscode.workspace.workspaceFolders) {
                context.subscriptions.push(vscode.tasks.registerTaskProvider(MagentoTaskProvider.MagentoScriptType, new MagentoTaskProvider(workspaceFolder)));
                try {
                    magento.indexer[workspaceFolder.uri.fsPath] = new Indexer(context, workspaceFolder);
                } catch(e) {
                    vscode.window.showErrorMessage(e.message);
                }
            }
        }

        // Watching for changes in the list of workspace folders
        vscode.workspace.onDidChangeWorkspaceFolders(change => {
            for(let workspaceFolder of change.added) {
                try {
                    magento.indexer[workspaceFolder.uri.fsPath] = new Indexer(context, workspaceFolder);
                } catch(e) {
                    vscode.window.showErrorMessage(e.message);
                }
            }
            for(let workspaceFolder of change.removed) {
                output.log(`Deleting index for ${workspaceFolder.name} (${workspaceFolder.uri.fsPath})`);
                magento.indexer[workspaceFolder.uri.fsPath].destroy();
                delete magento.indexer[workspaceFolder.uri.fsPath];
            }
        });

        context.subscriptions.push(vscode.commands.registerCommand('magentowizard.newExtension', async () => {
            try {
                const data = await getVendorExtension({ custom: true });
                if (!data) {
                    return;
                }
                magento.folder = data.workspace;
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
                    // TODO add separate message when there is no open file
                    throw new Error('Only supported for PHP files');
                }
                let data = await magento.getUriData(textEditor.document.uri);
                if (!data || !data.vendor || !data.extension) {
                    throw new Error('Not a Magento 2 extension file');
                }
                let folder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri);
                if (folder) {
                    magento.folder = folder;
                }
                if (textEditor) {
                    // TODO Recetly used feature should be moved inside createQuickPickCustom()
                    let recents:string[] = context.workspaceState.get('recentlyInjectedClasses', []);
                    let className = await createQuickPickCustom(magento.getClasses(data), { custom: true, step: 1, totalSteps: 2, title: 'Please select class or interface to inject' }, recents);
                    if (className) {
                        var varName = await vscode.window.showInputBox({
                            prompt: 'Enter variable name',
                            value: magento.suggestVariableName(className),
                            validateInput: value => { return !value.match(/^\$?[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/) ? 'Incorrect variable name' : '' ; },
                        });
                        if (varName) {
                            // Remove className from recents array in case it's already there
                            recents = _.without(recents, className);
                            // Add new value to the list
                            recents.push(className);
                            if (recents.length > 5){
                                recents.shift();
                            }
                            context.workspaceState.update('recentlyInjectedClasses', recents);
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

                let classFile = await magento.getClassFile(className);

                let methods: ClassMethod[] = [];
                if (classFile && await magento.fileExists(classFile)) {
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

        context.subscriptions.push(vscode.commands.registerCommand('magentowizard.addCRUD', async () => {
            let textEditor = vscode.window.activeTextEditor;
            let step = 1, totalSteps = 2;
            try {
                let extensionData;
                if (textEditor) {
                    try {
                        extensionData = await magento.getUriData(textEditor.document.uri);
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
                //let modelName = await createQuickPickCustom([], { custom: true, step, totalSteps, title: 'Please enter Model class name' });
                let modelName = await vscode.window.showInputBox({
                    prompt: `Please enter Model class name (${step}/${totalSteps})`,
                    value: '',
                    validateInput: value => !value.match(/^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff\/]*[a-zA-Z0-9_\x7f-\xff]$/) ? 'Incorrect class name' : '',
                });
                if (!modelName) { return; }
                step++;
                //let tableName = await createQuickPickCustom([], { custom: true, step, totalSteps, title: 'Please enter DB table name' });
                let tableName = await vscode.window.showInputBox({
                    prompt: `Please enter DB table name (${step}/${totalSteps})`,
                    value: Case.snake(modelName),
                    validateInput: value => !value.match(/^[A-Za-z][A-Za-z0-9_]*$/) ? 'Incorrect DB table name' : '',
                });
                if (!tableName) { return; }

                await addCRUD(extensionData, modelName, tableName);
            } catch (e) {
                vscode.window.showErrorMessage(e.message);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('magentowizard.generateCatalog', async () => {
            try {
                let currentWorkspace = await getWorkspaceFolder();
                if (currentWorkspace) {
                    magento.folder = currentWorkspace;
                    await generateCatalog(context, currentWorkspace);
                }
            } catch (e) {
                vscode.window.showErrorMessage(e.message);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('magentowizard.reindex', () => {
            if (vscode.workspace.workspaceFolders) {
                for(let workspaceFolder of vscode.workspace.workspaceFolders) {
                    try {
                        magento.indexer[workspaceFolder.uri.fsPath] = new Indexer(context, workspaceFolder, true);
                    } catch(e) {
                        vscode.window.showErrorMessage(e.message);
                    }
                }
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('magentowizard.switchtoblocktemplate', async () => {
            let textEditor = vscode.window.activeTextEditor;
            if (textEditor) {
                let extensionData;
                extensionData = await magento.getUriData(textEditor.document.uri);
                if (extensionData) {
                    if (extensionData.type === 'Block') {
                        // from Block to template
                        let blocks = [];
                        for(let block of magento.getIndexer().paths.blocks) {
                            if (`${extensionData.namespace}\\${extensionData.name}` === block.className) {
                                blocks.push(block.fullTemplateName);

                            }
                        }
                        let templateName:string | undefined;
                        blocks = _.uniq(blocks);
                        if (blocks.length > 1) {
                            templateName = await createQuickPickCustom(blocks, { title: 'Please select template' });
                        } else if (blocks.length > 0) {
                            templateName = blocks[0];
                        } else {
                            window.showInformationMessage('Can\'t find a template for this block');
                        }
                        if (templateName) {
                            let templateUri = await magento.getViewFile(extensionData, templateName);
                            if (templateUri) {
                                await window.showTextDocument(templateUri);
                            } else {
                                window.showInformationMessage('Can\'t find template '+templateName);
                            }
                        }
                    } else if (extensionData.type === 'view' && extensionData.ext === 'phtml') {
                        // from template to Block
                        let blocks = [];
                        for(let block of magento.getIndexer().paths.blocks) {
                            let templateUri = await magento.getViewFile(extensionData, block.fullTemplateName);
                            if (templateUri && templateUri.fsPath === textEditor.document.uri.fsPath) {
                                blocks.push(block.className);
                            }
                        }
                        blocks = _.uniq(blocks);
                        let className:string | undefined;
                        if (blocks.length > 1) {
                            className = await createQuickPickCustom(blocks, { title: 'Please select Block' });
                        } else if (blocks.length > 0) {
                            className = blocks[0];
                        } else {
                            window.showInformationMessage('Can\'t find a block for this template');
                        }
                        if (className) {
                            let classUri = await magento.getClassFile(className);
                            if (classUri) {
                                await window.showTextDocument(classUri);
                            } else {
                                window.showInformationMessage('Can\'t find block '+className);
                            }
                        }
                    }
                }
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

        window.onDidChangeActiveTextEditor(async (editor) => {
            if (editor) {
                var data = await magento.getUriData(editor.document.uri);
                if (data) {
                    vscode.commands.executeCommand('setContext', 'magentowizard.activeEditor.Type', data.type);
                    vscode.commands.executeCommand('setContext', 'magentowizard.activeEditor.Ext', data.ext);
                    vscode.commands.executeCommand('setContext', 'magentowizard.activeEditor.Area', data.area);
                    output.log('Context changed', data.type);
                    return;
                }
            }
            vscode.commands.executeCommand('setContext', 'magentowizard.activeEditor.Type', false);
            vscode.commands.executeCommand('setContext', 'magentowizard.activeEditor.Ext', false);
            vscode.commands.executeCommand('setContext', 'magentowizard.activeEditor.Area', false);
});

        context.subscriptions.push(vscode.languages.registerDefinitionProvider([
            {language: 'xml', scheme: 'file'},
            {language: 'xml', scheme: 'untitled'},
        ], definitionProvider));
        context.subscriptions.push(vscode.languages.registerCompletionItemProvider([
            {language: 'xml', scheme: 'file'},
            {language: 'xml', scheme: 'untitled'},
        ], completionProvider, '"'));
    } catch(e) {
        output.log('Unhandled exception', e.name, e.message, e.stack);
    }
    const extension = vscode.extensions.getExtension('viperet.vscode-magento-wizard');
    const previousVersion: string = context.globalState.get('version') || '';
    if (extension && previousVersion) {
        const currentVersion = extension.packageJSON.version;
        try {
            if (semver.gt(currentVersion, previousVersion)) {
                output.log(`MagentoWizard was updated from ${previousVersion} to ${currentVersion}`);
            }
        } catch {
            output.log(`MagentoWizard ${currentVersion} installed`);
        }
        context.globalState.update('version', currentVersion);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
    output.dispose();
}
