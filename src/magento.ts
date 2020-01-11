import { workspace, Uri, FileType, TextEditor, Position, Range, WorkspaceFolder, window, QuickPickItem, SnippetString, RelativePattern, FileStat } from 'vscode';
import * as path  from 'path';
import classList from './classlist';
import eventsList from './eventsList';
import * as Case from 'case';
import * as convert  from 'xml-js';
import * as NodeCache from 'node-cache';
import * as cp from 'child_process';
const fs = workspace.fs;

import { TextEncoder, TextDecoder } from 'util';
import Php, { ClassMethod, reservedWords } from './php';
import Indexer from './indexer';

export enum ExtentionKind  { Module, Theme, Library, Setup, Language }
export interface ExtensionInfo {
    /** Workspace folder of the extension */
    workspace: WorkspaceFolder;
    /** Vendor name */
    vendor: string;
    /** Extension name */
    extension: string;
    /** Extension folder path, relative to the workspace folder */
    extensionFolder: string;
    /** Extenstion folder Uri */
    extensionUri: Uri;
    /** Component name (ex: Magento_Catalog) */
    componentName: string;
}
export interface UriData extends ExtensionInfo {
    /** File type (model, controller, block, etc) */
    type: string;
    /** File namespace  */
    namespace: string;
    /** Filename */
    name: string;
    /** Filename extension (php,xml,js) */
    ext: string;
    /** Magento area (frontend,adminhtml) */
    area: string;
    /** Extension kind (Module or Theme) */
    kind: ExtentionKind;
    /** Parent theme */
    parent: string;
}

export interface Docblock {
    description?: string;
    params: [string, string][];
}

class Magento {
    encoder: (input?: string | undefined) => Uint8Array;
    decoder: (input?: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | DataView | ArrayBuffer | null | undefined, options?: any | undefined) => string;

    private uriDataCache: NodeCache;
    private composerCache: NodeCache;
    private classesCache: NodeCache;

    public indexer: { [folder: string]: Indexer } = {};

    // @ts-ignore
    folder: WorkspaceFolder;

    constructor() {
        let encoder = new TextEncoder();
        this.encoder = encoder.encode.bind(encoder);
        let decoder = new TextDecoder();
        this.decoder = decoder.decode.bind(decoder);
        this.uriDataCache = new NodeCache({ useClones: false, stdTTL: 60, checkperiod: 60 });
        this.composerCache = new NodeCache({ useClones: false, stdTTL: 60, checkperiod: 60 });
        this.classesCache = new NodeCache({ useClones: false, stdTTL: 60, checkperiod: 60 });
    }

    getIndexer(): Indexer {
        return this.indexer[this.folder.uri.fsPath];
    }

    /**
     * Appends path components to the end of the Uri
     *
     * @param {Uri} uri
     * @param {...string[]} args path components to append
     * @returns {Uri} modified Uri object
     * @memberof Magento
     */
    appendUri(uri: Uri, ...args: string[]): Uri {
        return uri.with({ path: path.join(uri.path, ...args) });
    }

    /**
     * Returns Uri of the Magento 2 /app/code folder
     *
     * @returns {Uri}
     * @memberof Magento
     */
    async getAppCodeUri(): Promise<Uri> {
        if (!this.indexer[this.folder.uri.fsPath]) {
            throw new Error('No Magento in this workspace folder');
        }
        let magentoRoot = await this.indexer[this.folder.uri.fsPath].magentoRoot;
        if (!magentoRoot) {
            throw new Error('No Magento in this workspace folder');
        }
        let uri = this.appendUri(magentoRoot, 'app', 'code');
        try {
            fs.stat(uri);
            return uri;
        } catch {
            throw new Error('There is no Magento folders in this workspace folder');
        }
    }

    /**
     * Returns Uri of the Magento 2 /app/design folder
     *
     * @returns {Uri}
     * @memberof Magento
     */
    async getAppDesignUri(): Promise<Uri> {
        if (!this.indexer[this.folder.uri.fsPath]) {
            throw new Error('No Magento in this workspace folder');
        }
        let magentoRoot = await this.indexer[this.folder.uri.fsPath].magentoRoot;
        if (!magentoRoot) {
            throw new Error('No Magento in this workspace folder');
        }
        let uri = this.appendUri(magentoRoot, 'app', 'design');
        try {
            fs.stat(uri);
            return uri;
        } catch {
            throw new Error('There is no Magento folders in this workspace folder');
        }
    }

    /**
     * Get info (vendor, extension name, etc) from file
     * of the Magento 2 extension. Only works for files
     * in the /app/code/ folder
     *
     * @param uri Uri of the file of Magento 2 extension
     */
    async getUriData(uri: Uri): Promise<UriData | undefined> {
        let currentWorkspace = workspace.getWorkspaceFolder(uri);
        if (!currentWorkspace) {
            throw new Error('File not in the workspace (not saved yet?)');
        }
        this.folder = currentWorkspace;
        let data: UriData | undefined;
        if (this.indexer[currentWorkspace.uri.fsPath]) {
            data = this.indexer[currentWorkspace.uri.fsPath].findByUri(uri);
            if (!data) {
                return;
            }
        } else {
            return;
        }
        const pathComponents = path.dirname(uri.fsPath).slice(data.extensionFolder.length).split(path.sep);
        data.namespace += pathComponents.join('\\');
        data.ext = path.extname(uri.fsPath).slice(1);
        data.name = path.basename(uri.fsPath, path.extname(uri.fsPath));
        data.type = pathComponents.length > 0 ? pathComponents[0] : '';
        if (data.type === 'view') {
            data.area = pathComponents.length > 1 ? pathComponents[1] : '';
        }
        return data;
    }

    /**
     * Returns list of existing Vendors
     *
     * @returns {Promise<string[]>}
     * @memberof Magento
     */
    async getVendors(): Promise<string[]> {
        let vendors = [];
        for(let module of this.indexer[this.folder.uri.fsPath].paths.module) {
            vendors.push(module.vendor);
        }
        // return unique vendors
        return [...new Set(vendors)].sort();
    }

    /**
     * Returns list of existing Extesions from given  Vendor
     *
     * @param {string} vendor
     * @returns {string[]}
     * @memberof Magento
     */
    async getExtensions(vendor: string): Promise<string[]> {

        let extensions = [];
        for(let module of this.indexer[this.folder.uri.fsPath].paths.module) {
            if (module.vendor === vendor) {
                extensions.push(module.extension);
            }
        }
        return extensions;
    }

    /**
     * Adds template content to the newly created empty file
     * based on it's file name
     *
     * @param {TextDocument} textDocument
     * @returns {Promise<undefined>}
     * @memberof Magento
     */
    async applyTemplate(textEditor: TextEditor): Promise<void> {
        const textDocument = textEditor.document;
        if (textDocument.getText().length !== 0) {
            // File is not empty, stop processing
            return;
        }
        try {
            var data = await this.getUriData(textDocument.uri);
        } catch {
            // getUriData may fail for files not in the worspace folders, no need to continue
            return;
        }
        if (!data || !data.vendor || !data.extension) {
            // File is not in the Magento 2 extension
            return;
        }
        let modelMatch = data.namespace.match(/\\ResourceModel\\(?<modelName>.+)$/);
        if (modelMatch) {
            Object.assign(data, { modelName: modelMatch.groups!.modelName });
        }
        const templates = require('./templates').default;
        for(let reg in templates) {
            const regexp = new RegExp(reg);
            if (regexp.test(textDocument.fileName)) {
                let templateText: string = templates[reg](data);
                templateText = templateText.replace(/(\$[^{\d])/g, '\\$1');
                const snippet = new SnippetString(templateText);
                textEditor.insertSnippet(snippet);
                break;
            }
        }
    }

    /**
     * Generate proper indent string using spaces/tabs based on the
     *  editor settings
     *
     * @param {TextEditor} textEditor
     * @param {number} indent number of indenting steps
     * @returns {string}
     * @memberof Magento
     */
    indentCode(textEditor: TextEditor | undefined, indent: number): string {
        if (!textEditor) {
            return " ".repeat(indent * 4);
        }
        if (textEditor.options.insertSpaces) {
            return " ".repeat(indent * (textEditor.options.tabSize as number));
        } else {
            return "\t".repeat(indent);
        }
    }

    /**
     * Create Docblock string
     *
     * @param {TextEditor} textEditor
     * @param {Docblock} docblock
     * @returns
     * @memberof Magento
     */
    docblock(textEditor: TextEditor, docblock: Docblock) {
        let indent = this.indentCode(textEditor, 1);
        let result = indent + '/**\n';
        if (docblock.description) {
            result += indent + ' * ' + docblock.description + '\n';
            result += indent + ' *\n';
        }
        for(let param of docblock.params) {
            result += indent + ' * ' + param[0] + ' ' + param[1] + '\n';
        }
        result += indent + ' */\n';
        return result;
    }

    /**
     * Returns array of classes to be used in DI
     *
     * @returns {string[]}
     * @memberof Magento
     */
    async * getClasses(data: ExtensionInfo): AsyncIterableIterator<string[]> {
        // return predefined Magento classes/interfaces
        yield classList;
        // if workspace folder is not set - can't search for additional classes
        if (!this.folder) {
            return [];
        }
        // search for classes in the extension folder
        yield this.searchClasses(data.extensionFolder);

        let keyword: string = (yield []) as any;
        while(1) {
            let classes: string[] = [];
            if (keyword.length >= 3) {
                for(let extensions of [this.getIndexer().paths.module, this.getIndexer().paths.library]) {
                    for(let module of extensions) {
                        if (('\\'+module.namespace).includes(keyword)) {
                            classes.push.apply(classes, await this.searchClasses(module.extensionFolder));
                        }
                    }
                }
            }
            keyword = (yield classes) as any;
        }
        // never returns
    }

    async searchClasses(path: string): Promise<string[]> {
        let classes: string[] | undefined = this.classesCache.get(path);

        if (classes === undefined) {
            classes = [];
            let pattern = new RelativePattern(
                    path,
                    '**/*.php'
                );
            let files = await workspace.findFiles(
                pattern,
                '**/registration.php'
            );
            for(let uri of files) {
                let data = await this.getUriData(uri);
                if (data && data.vendor && data.extension && data.namespace && data.name) {
                    classes.push(`\\${data.namespace}\\${data.name}`);
                    if (data.type === 'Model' && !data.namespace.includes('\\ResourceModel\\')) {
                        // Also add corresponding Factory class
                        classes.push(`\\${data.namespace}\\${data.name}Factory`);
                    }
                }
            }
            this.classesCache.set(path, classes);
        }
        return classes;
    }

    /**
     * Creates variable name (without $ symbol) from class name
     *
     * @param {string} className
     * @returns {string}
     * @memberof Magento
     */
    suggestVariableName(className: string): string {
        const shortNames = ['Data', 'Context', 'Item', 'Session'];
        let classes = className.split('\\');
        let varname = classes.pop();
        if (!varname) {
            return '';
        }
        if (shortNames.includes(varname)) {
            varname = classes.pop() + varname;
        }
        varname = varname.replace(/Interface$/, '');
        return Case.camel(varname);
    }

    /**
     * Returns array of event names
     *
     * @returns QuickPickItem[]
     * @memberof Magento
     */
    getEvents(): QuickPickItem[] {
        let values: QuickPickItem[] = [];
        for(let eventName in eventsList) {
            let data: string[] = [];
            for (let dataName in eventsList[eventName].data) {
                data.push('$'+dataName);
            }
            values.push({
                label: eventName,
                description: eventsList[eventName].description,
                detail: data.join(", "),
            });
        }
        return values;
    }

    /**
     * Creates observer class name from event name
     *
     * @param {string} eventName
     * @param {string} observerName
     * @returns {string}
     * @memberof Magento
     */
    suggestObserverName(eventName: string): string {
        return Case.pascal(eventName);
    }

    /**
     * Creates plugin name from class name
     *
     * @param {string} className
     * @returns {string}
     * @memberof Magento
     */
    suggestPluginName(className: string): string {
        let classes = className.split('\\');
        return (classes[3] ? classes[3]+'\\' : '') + Case.pascal(this.suggestVariableName(className));
    }

    async readFile(uri: Uri): Promise<string> {
        for(let textEditor of window.visibleTextEditors) {
            if (textEditor.document.uri.toString() === uri.toString()) {
                // return contents of the open document
                return textEditor.document.getText();
            }
        }
        // if no open document found, read from file
        let text = await fs.readFile(uri);
        return this.decoder(text);
    }

    async writeFile(uri: Uri, text: string): Promise<void> {
        for(let textEditor of window.visibleTextEditors) {
            if (textEditor.document.uri.toString() === uri.toString()) {
                // write to the open document
                let isDirty = textEditor.document.isDirty;
                let startPosition = new Position(0,0);
                let endPosition = textEditor.document.validatePosition(new Position(textEditor.document.lineCount-1, 100000));
                await textEditor.edit(editBuilder => {
                    editBuilder.delete(new Range(startPosition, endPosition));
                    editBuilder.insert(startPosition, text);
                });
                if (!isDirty) {
                    textEditor.document.save();
                }
                return;
            }
        }
        // if no open document found, write to file
        await fs.writeFile(uri, this.encoder(text));
        return;
    }

    async fileExists(uri: Uri): Promise<boolean> {
        try {
            let stat: FileStat = await fs.stat(uri);
            if (stat.type !== FileType.File ) {
                throw new Error(this.relativePath(uri)+' is not a file');
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns Uri path relative to the workspace folder
     *
     * @param {Uri} uri
     * @returns {string}
     * @memberof Magento
     */
    relativePath(uri: Uri): string {
        return workspace.asRelativePath(uri);
    }

    getExtensionFolder(vendor: string, extension: string): Uri | undefined {
        for(let module of this.getIndexer().paths.module) {
            if (module.vendor === vendor && module.extension === extension) {
                return module.extensionUri;
            }
        }
        for(let module of this.getIndexer().paths.theme) {
            if (module.vendor === vendor && module.extension === extension) {
                return module.extensionUri;
            }
        }
        return undefined;
    }

    /**
     * Get file Uri by class name
     *  Can return Uri of unexisting file
     *
     * @param {ExtensionInfo} extension
     * @param {string} className
     * @returns {(Uri | undefined)}
     * @memberof Magento
     */
    async getClassFile(extension: ExtensionInfo, className: string): Promise<Uri | undefined> {
        let module = this.indexer[this.folder.uri.fsPath].findByClassName(className);
        if (module) {
            return this.appendUri(module.extensionUri, className.slice(module.namespace.length).replace(/\\/g, path.sep)+'.php');
        }
        // use composer autoloader to find file as a last resort
        return this.composerFindFile(className);

        // let file: Uri;
        // const classPath = className.split('\\').filter(Boolean);
        // if (extension.vendor === classPath[0] && extension.extension === classPath[1]) {
        //     // class from current extension
        //     file = extension.extensionUri;
        // } else if (classPath[0] === 'Magento') {
        //     if (classPath[1] === 'Framework') {
        //         file = this.appendUri(extension.workspace.uri, 'vendor/magento/framework');
        //     } else {
        //         file = this.appendUri(extension.workspace.uri, 'vendor/magento/module-'+Case.kebab(classPath[1]));
        //     }
        // } else {
        //     // use composer autoloader to find file as a last resort
        //     return this.composerFindFile(className);
        // }
        // for(let i = 2; i < classPath.length-1; ++i) {
        //     file = this.appendUri(file, classPath[i]);
        // }
        // file = this.appendUri(file, classPath.pop()+'.php');
        // // if (!await this.fileExists(file)) {
        // //     // if file was not found - use composer autoloader
        // //     return this.composerFindFile(className);
        // // }
        // return file;
    }

    async composerFindFile(className: string): Promise<Uri | undefined> {
        try {
            let fileName: Uri | undefined = this.composerCache.get(className);
            if (fileName === undefined) {
                const magentoRoot = await this.getIndexer().magentoRoot;
                if (!magentoRoot) {
                    return undefined;
                }
                const _className = className.replace(/^\\?(.*)$/, '$1');
                const php = workspace.getConfiguration('', this.folder.uri).get('magentoWizard.tasks.php') || 'php';
                const commandLine = `${php} -r 'echo (include "vendor/autoload.php")->findFile("${_className}");'`;
                const { stdout, stderr } = await this.exec(commandLine, { cwd: magentoRoot.fsPath });
                if (stdout.startsWith(this.appendUri(magentoRoot,'vendor').fsPath)) {
                    fileName = Uri.file(stdout);
                    this.composerCache.set(className, fileName);
                }
            }
            return fileName;
        } catch {
            return undefined;
        }
    }

    /**
     * Parses PHP file and returns array of class methods
     *
     * @param {Uri} classFile
     * @returns {Promise<ClassMethod[]>}
     * @memberof Magento
     */
    async getClassMethods(classFile: Uri): Promise<ClassMethod[]> {
        let php = new Php();
        let name = path.basename(classFile.fsPath, '.php');
        php.parseCode(await this.readFile(classFile), name+'.php');
        const methods = await php.getMethods(name);
        return methods;
    }

    validateClassName(className: string) {
        // TODO Add proper class name validation, check for reserved words
        if (!className.match(/^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(\\[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)*$/)) {
            return false;
        }
        if (className.split('\\').some(elem => reservedWords.includes(elem.toLowerCase()))) {
            return false;
        }
        return true;
    }

    exec(command: string, options: cp.ExecOptions): Promise<{ stdout: string; stderr: string }> {
        return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            cp.exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    reject({ error, stdout, stderr });
                }
                resolve({ stdout, stderr });
            });
        });
    }

    async getViewFile(data: UriData, viewFile: string): Promise<Uri | undefined> {
        const fileReferenceRe = /^(?<vendor>[a-zA-Z0-9]+)_(?<extension>[a-zA-Z0-9]+)::(?<path>[-a-zA-Z0-9@$=%#_/.]+)\.(?<ext>[-a-zA-Z0-9]+)$/;
        const matches = viewFile.trim().match(fileReferenceRe);
        if (matches && matches.groups) {
            let extensionUri: Uri;
            let extension: UriData | undefined;

            if (data.kind === ExtentionKind.Module) {
                // search for view file in the module
                extension = this.getIndexer().findByVendorExtension(matches.groups.vendor, matches.groups.extension);
                if (!extension) {
                    return undefined;
                }


                if (data.type === 'view' && data.ext === 'xml') {
                    // file is XML layout
                    let fileType;
                    if (matches.groups.ext === 'phtml') {
                        fileType = 'templates';
                    } else {
                        fileType = 'web';
                    }
                    if (!data.area) {
                        data.area = 'base';
                    }

                    let viewFileUri = this.appendUri(extension.extensionUri, 'view', data.area, fileType, matches.groups.path + '.' + matches.groups.ext);
                    if (await this.fileExists(viewFileUri)) {
                        return viewFileUri;
                    }
                    // if not found - try to look into 'base' folder
                    const viewFileBaseUri = this.appendUri(extension.extensionUri, 'view', 'base', fileType, matches.groups.path + '.' + matches.groups.ext);
                    if (await this.fileExists(viewFileBaseUri)) {
                        return viewFileBaseUri;
                    }
                    return viewFileUri;
                }
            } else if (data.kind === ExtentionKind.Theme) {
                extensionUri = data.extensionUri;
                let fileType;
                if (matches.groups.ext === 'phtml') {
                    fileType = 'templates';
                } else {
                    fileType = 'web';
                }
                let viewFileUri = this.appendUri(extensionUri,  matches.groups.vendor+'_'+matches.groups.extension, fileType, matches.groups.path + '.' + matches.groups.ext);
                if (await this.fileExists(viewFileUri)) {
                    return viewFileUri;
                } else {
                    let parentViewFileUri;
                    let parentTheme: UriData | undefined = data;
                    do {
                        parentTheme = await this.getParentTheme(parentTheme);
                        if (!parentTheme) {
                            break;
                        }
                        parentViewFileUri = this.appendUri(parentTheme.extensionUri,  matches.groups.vendor+'_'+matches.groups.extension, fileType, matches.groups.path + '.' + matches.groups.ext);
                        if (await this.fileExists(parentViewFileUri)) {
                            break;
                        } else {
                            parentViewFileUri = undefined;
                        }
                    } while (1);
                    if (parentViewFileUri) {
                        // file was found in the parents
                        return parentViewFileUri;
                    } else {
                        // lets find that file in a extension
                        let extensionUri = this.getExtensionFolder(matches.groups.vendor, matches.groups.extension);
                        if (!extensionUri) {
                            return undefined;
                        }
                        let extensionData = await this.getUriData(this.appendUri(extensionUri, 'etc/module.xml'));
                        if (extensionData) {
                            extensionData.type = 'view';
                            extensionData.area = 'frontend';
                            return this.getViewFile(extensionData, viewFile);
                        }
                    }
                }
            }
        }
        return undefined;
    }

    async getParentTheme(data: UriData): Promise<UriData | undefined> {

        let [area, vendor, theme] = data.parent.split('/');


        for(let module of this.indexer[this.folder.uri.fsPath].paths.theme) {
            if (module.area === area && module.vendor === vendor && module.extension === theme) {
                return module;
            }
        }
        return undefined;
    }

}

export default new Magento();