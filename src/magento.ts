import { workspace, Uri, FileType, TextEditor, Position, Range, WorkspaceFolder, window, QuickPickItem, SnippetString, RelativePattern } from 'vscode';
import { posix } from 'path';
import classList from './classlist';
import eventsList from './eventsList';
import camelCase from 'camelcase';
import * as convert  from 'xml-js';
import * as NodeCache from 'node-cache';
const fs = workspace.fs;

import { TextEncoder, TextDecoder } from 'util';

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
}

export interface Docblock {
    description?: string;
    params: [string, string][];
}

class Magento {
    encoder: (input?: string | undefined) => Uint8Array;
    decoder: (input?: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | DataView | ArrayBuffer | null | undefined, options?: any | undefined) => string;

    private uriDataCache: NodeCache;

    // @ts-ignore
    folder: WorkspaceFolder;

    constructor() {
        let encoder = new TextEncoder();
        this.encoder = encoder.encode.bind(encoder);
        let decoder = new TextDecoder();
        this.decoder = decoder.decode.bind(decoder);
        this.uriDataCache = new NodeCache({ useClones: false, stdTTL: 60, checkperiod: 60 });
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
        let data: UriData = { workspace: currentWorkspace, vendor: '', extension: '', type: '', namespace: '', name: '', ext: '', extensionFolder: '', extensionUri: currentWorkspace.uri };
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
                try {
                    const moduleXmlUri = this.appendUri(currentWorkspace.uri, data.extensionFolder, 'etc', 'module.xml');
                    let name = this.uriDataCache.get(moduleXmlUri.fsPath) as string[];
                    if (name === undefined) {
                        // handle cache miss - parse etc/module.xml
                        const moduleXml = await this.readFile(moduleXmlUri);
                        var xml = convert.xml2js(moduleXml, {
                            compact: true,
                            ignoreComment: true,
                        }) as any;
                        name = xml.config.module._attributes.name.split('_');
                        // store extension data in cache
                        this.uriDataCache.set(moduleXmlUri.fsPath, name);
                    }
                    data.vendor = name[0];
                    data.extension = name[1];
                } catch {
                    throw new Error('Error parsing etc/module.xml');
                }
            }
        }
        data.namespace = data.vendor+'\\'+data.extension;
        if (path && path.length > 0) {
            data.type = path[0].toLowerCase();
            data.namespace = [data.vendor, data.extension, ...path].join('\\');
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
        let varname = className.split('\\').pop();
        if (!varname) {
            return '';
        }
        varname = varname.replace(/Interface$/, '');
        return camelCase(varname);
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
                data.push(dataName);
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
        return camelCase(eventName);
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
            let stat = await fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    relativePath(uri: Uri): string {
        return workspace.asRelativePath(uri);
    }
}

export default new Magento();