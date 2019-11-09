import { workspace, Uri, FileType, TextEditor, Position, Range, WorkspaceFolder, window, QuickPickItem, SnippetString, RelativePattern, FileStat } from 'vscode';
import { posix } from 'path';
import classList from './classlist';
import eventsList from './eventsList';
import * as Case from 'case';
import * as convert  from 'xml-js';
import * as NodeCache from 'node-cache';
import * as cp from 'child_process';
const fs = workspace.fs;

import { TextEncoder, TextDecoder } from 'util';
import Php, { MethodVisibility, ClassMethod } from './php';

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

    // @ts-ignore
    folder: WorkspaceFolder;

    constructor() {
        let encoder = new TextEncoder();
        this.encoder = encoder.encode.bind(encoder);
        let decoder = new TextDecoder();
        this.decoder = decoder.decode.bind(decoder);
        this.uriDataCache = new NodeCache({ useClones: false, stdTTL: 60, checkperiod: 60 });
        this.composerCache = new NodeCache({ useClones: false, stdTTL: 60, checkperiod: 60 });
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
        return uri.with({ path: posix.join(uri.path, ...args) });
    }

    /**
     * Returns Uri of the Magento 2 /app/code folder
     *
     * @param {WorkspaceFolder} folder workspace folder to use
     * @returns {Uri}
     * @memberof Magento
     */
    getAppCodeUri(): Uri {
        let uri = this.appendUri(this.folder.uri, 'app', 'code');
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
    async getUriData(uri: Uri): Promise<UriData> {
        let currentWorkspace = workspace.getWorkspaceFolder(uri);
        if (!currentWorkspace) {
            throw new Error('File not in the workspace (not saved yet?)');
        }
        this.folder = currentWorkspace;
        let data: UriData = { workspace: currentWorkspace, vendor: '', extension: '', type: '', namespace: '', name: '', ext: '', extensionFolder: '', extensionUri: currentWorkspace.uri, area: ''};
        let relativePath = workspace.asRelativePath(uri);
        let path: string[] = [];
        // Extension in /app/code
        let matches = relativePath.match(/^(?<rootPath>.*\/)?app\/code\/(?<vendor>\w+)\/(?<extension>\w+)\/(?<path>.*\/)?(?<fileName>\w+)\.(?<ext>\w+)$/);
        if (matches && matches.groups) {
            path = matches.groups.path ? matches.groups.path.split('/').filter(Boolean) : [];
            matches.groups.rootPath = matches.groups.rootPath || '';
            data.vendor = matches.groups.vendor;
            data.extension = matches.groups.extension;
            data.name = matches.groups.fileName;
            data.ext = matches.groups.ext;
            data.extensionFolder = `${matches.groups.rootPath}app/code/${data.vendor}/${data.extension}/`;
        } else {
            // Extension in /vendor
            matches = relativePath.match(/^(?<rootPath>.*\/)?vendor\/(?<vendor>[A-Za-z0-9_-]+)\/(?<extension>[A-Za-z0-9_-]+)\/(?<path>.*\/)?(?<fileName>\w+)\.(?<ext>\w+)$/);
            if (matches && matches.groups) {
                path = matches.groups.path ? matches.groups.path.split('/').filter(Boolean) : [];
                matches.groups.rootPath = matches.groups.rootPath || '';
                data.name = matches.groups.fileName;
                data.ext = matches.groups.ext;
                data.extensionFolder = `${matches.groups.rootPath}vendor/${matches.groups.vendor}/${matches.groups.extension}/`;
                let moduleXmlUri = this.appendUri(currentWorkspace.uri, data.extensionFolder, 'etc', 'module.xml');
                let name = this.uriDataCache.get(data.extensionFolder) as string[];
                try {
                    if (name === undefined) {
                        // handle cache miss - parse etc/module.xml
                        const moduleXml = await this.readFile(moduleXmlUri);
                        var xml = convert.xml2js(moduleXml, {
                            compact: true,
                            ignoreComment: true,
                        }) as any;
                        name = xml.config.module._attributes.name.split('_');
                        // store extension data in cache
                        this.uriDataCache.set(data.extensionFolder, name);
                    }
                    data.vendor = name[0];
                    data.extension = name[1];
                } catch (e) {
                    console.log(e);
                    //throw new Error('Error parsing '+this.relativePath(moduleXmlUri));
                }
            }
        }
        data.namespace = data.vendor+'\\'+data.extension;
        if (path && path.length > 0) {
            data.type = path[0].toLowerCase();
            data.namespace = [data.vendor, data.extension, ...path].join('\\');
            if (['base','frontend','adminhtml'].includes(path[1])) {
                data.area = path[1];
            }
        }
        data.extensionUri = this.appendUri(currentWorkspace.uri, data.extensionFolder);
        return data;
    }

    /**
     * Returns list of existing Vendors
     *
     * @returns {Promise<string[]>}
     * @memberof Magento
     */
    async getVendors(): Promise<string[]> {
        const codeUri = this.getAppCodeUri();
        var dir:[string, FileType][] = [];
        try {
             dir = await fs.readDirectory(codeUri);
        } catch {
        }

        return dir
            .filter(entry => { return entry[1] === FileType.Directory; })
            .map(entry => { return entry[0]; });
    }

    /**
     * Returns list of existing Extesions from given  Vendor
     *
     * @param {string} vendor
     * @returns {string[]}
     * @memberof Magento
     */
    async getExtensions(vendor: string): Promise<string[]> {
        const vendorUri = this.appendUri(this.getAppCodeUri(), vendor);
        var dir:[string, FileType][] = [];
        try {
             dir = await fs.readDirectory(vendorUri);
        } catch {
        }

        return dir
            .filter(entry => { return entry[1] === FileType.Directory; })
            .map(entry => { return entry[0]; });
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
        if (!data.vendor || !data.extension) {
            // File is not in the Magento 2 extension
            return;
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
        return this.searchClasses(data.extensionFolder);

        // search for classes in /app/code
        //return this.searchClasses('app/code/');
   }

    async searchClasses(path: string): Promise<string[]> {
        let pattern = new RelativePattern(
                this.appendUri(this.folder.uri, path).fsPath,
                '**/*.php'
            );
        let files = await workspace.findFiles(
            pattern,
            '**/registration.php'
        );
        let extClasses: string[]  = [];
        for(let uri of files) {
            let data = await this.getUriData(uri);
            if (data.vendor && data.extension && data.namespace && data.name) {
                extClasses.push(`\\${data.namespace}\\${data.name}`);
            }
        }
        return extClasses;
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

    getExtensionFolder(vendor: string, extension: string): Uri {
        if (vendor === 'Magento') {
            if (extension === 'Framework') {
                return this.appendUri(this.folder.uri, 'vendor/magento/framework');
            } else {
                return this.appendUri(this.folder.uri, 'vendor/magento/module-'+Case.kebab(extension));
            }
        } else {
            return this.appendUri(this.folder.uri, 'app/code', vendor, extension);
        }
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
        const classPath = className.split('\\').filter(Boolean);
        let file: Uri;
        if (extension.vendor === classPath[0] && extension.extension === classPath[1]) {
            // class from current extension
            file = extension.extensionUri;
        } else if (classPath[0] === 'Magento') {
            if (classPath[1] === 'Framework') {
                file = this.appendUri(extension.workspace.uri, 'vendor/magento/framework');
            } else {
                file = this.appendUri(extension.workspace.uri, 'vendor/magento/module-'+Case.kebab(classPath[1]));
            }
        } else {
            // use composer autoloader to find file as a last resort
            return await this.composerFindFile(className);
        }
        for(let i = 2; i < classPath.length-1; ++i) {
            file = this.appendUri(file, classPath[i]);
        }
        file = this.appendUri(file, classPath.pop()+'.php');
        if (!await this.fileExists(file)) {
            // if file was not found - use composer autoloader
            return await this.composerFindFile(className);
        }
        return file;
    }

    async composerFindFile(className: string): Promise<Uri | undefined> {
        try {
            let fileName: Uri | undefined = this.composerCache.get(className);
            if (fileName === undefined) {
                const _className = className.replace(/^\\?(.*)$/, '$1');
                const php = workspace.getConfiguration('', this.folder.uri).get('magentoWizard.tasks.php') || 'php';
                const commandLine = `${php} -r 'echo (include "vendor/autoload.php")->findFile("${_className}");'`;
                const { stdout, stderr } = await this.exec(commandLine, { cwd: this.folder.uri.fsPath });
                if (stdout.startsWith(this.appendUri(this.folder.uri,'vendor','composer').fsPath)) {
                    const relativePath = workspace.asRelativePath(posix.normalize(stdout));
                    fileName = this.appendUri(this.folder.uri, relativePath);
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
        const data = await this.getUriData(classFile);
        php.parseCode(await this.readFile(classFile), data.name+'.php');
        const methods = await php.getMethods(data.name);
        return methods;
    }

    validateClassName(className: string) {
        // TODO Add proper class name validation, check for reserved words
        return className.match(/^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(\\[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)*$/);
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
        if (matches) {
            if (matches.groups) {
                let extensionUri: Uri;
                if (matches.groups.vendor === data.vendor && matches.groups.extension === data.extension) {
                    extensionUri = data.extensionUri;
                } else if(matches.groups.vendor === 'Magento') {
                    extensionUri = this.appendUri(data.workspace.uri, 'vendor', 'magento', 'module-' + Case.kebab(matches.groups.extension));
                } else {
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

                    let viewFileUri = this.appendUri(extensionUri, 'view', data.area, fileType, matches.groups.path + '.' + matches.groups.ext);
                    if (await this.fileExists(viewFileUri)) {
                        return viewFileUri;
                    }
                    // if not found - try to look into 'base' folder
                    viewFileUri = this.appendUri(extensionUri, 'view', 'base', fileType, matches.groups.path + '.' + matches.groups.ext);
                    if (await this.fileExists(viewFileUri)) {
                        return viewFileUri;
                    }
                }
            }
        }
        return undefined;
    }

}

export default new Magento();