import { workspace, Uri, FileType, TextDocument, TextEditor, Position, Range, WorkspaceFolder, DocumentLink, window, QuickPickItem, SnippetString, RelativePattern } from 'vscode';
import { posix } from 'path';
import * as Handlebars from 'handlebars';
import Ast from './ast';
import classList from './classlist';
import eventsList from './eventsList';
import camelCase from 'camelcase';
import * as convert  from 'xml-js';

const fs = workspace.fs;

import { TextEncoder, TextDecoder } from 'util';
import * as Parser from 'php-parser';
import { fstat } from 'fs';

export interface ExtensionInfo {
    workspace: WorkspaceFolder;
    vendor: string;
    extension: string;
}
export interface UriData extends ExtensionInfo {
    vendor: string;
    extension: string;
    type: string;
    namespace: string;
    name: string;
    ext: string;
}

interface Docblock {
    description?: string;
    params: [string, string][];
}

interface Insert {
    line: number;
    column: number;
    text: string;
}

class Magento {
    encoder: (input?: string | undefined) => Uint8Array;
    decoder: (input?: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | DataView | ArrayBuffer | null | undefined, options?: any | undefined) => string;

    // @ts-ignore
    folder: WorkspaceFolder;

    constructor() {
        let encoder = new TextEncoder();
        this.encoder = encoder.encode.bind(encoder);
        let decoder = new TextDecoder();
        this.decoder = decoder.decode.bind(decoder);
    }

    /**
     * Appends path components to the end of the Uri
     *
     * @private
     * @param {Uri} uri
     * @param {...string[]} args path components to append
     * @returns {Uri} modified Uri object
     * @memberof Magento
     */
    private appendUri(uri: Uri, ...args: string[]): Uri {
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
    getUriData(uri: Uri): UriData {
        let currentWorkspace = workspace.getWorkspaceFolder(uri);
        if (!currentWorkspace) {
            throw new Error('File not in the workspace (not saved yet?)');
        }
        let data: UriData = { workspace: currentWorkspace, vendor: '', extension: '', type: '', namespace: '', name: '', ext: '' };
        let matches = uri.path.match(/\/app\/code\/(?<vendor>\w+)\/(?<extension>\w+)\/(?<path>.*\/)?(?<fileName>\w+)\.(?<ext>\w+)$/);
        if (matches && matches.groups) {
            let path = matches.groups.path ? matches.groups.path.split('/').filter(Boolean) : '';
            data.vendor = matches.groups.vendor;
            data.extension = matches.groups.extension;
            data.name = matches.groups.fileName;
            data.ext = matches.groups.ext;
            if (path.length > 0) {
                data.type = path[0].toLowerCase();
                data.namespace = [data.vendor, data.extension, ...path].join('\\');
            }
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
     * Creates new Magento 2 extension
     *
     * @param {string} vendor extension Vendor name
     * @param {string} extension extension name
     * @returns {Promise<Uri>} Uri of the created extension folder
     * @memberof Magento
     */
    async createExtension(vendor: string, extension: string): Promise<Uri> {
        const codeUri = this.getAppCodeUri();
        const extensionUri = this.appendUri(codeUri, vendor, extension);
        const registrationPhpUri = this.appendUri(extensionUri, 'registration.php');
        const composerJsonUri = this.appendUri(extensionUri, 'composer.json');
        const moduleXmlUri = this.appendUri(extensionUri, 'etc', 'module.xml');
        try {
            await fs.createDirectory(extensionUri);
            await fs.createDirectory(this.appendUri(extensionUri, 'etc'));
        } catch {
            throw new Error('Error creating extension folder');
        }
        try {
            await fs.writeFile(
                registrationPhpUri,
                this.encoder(require('../templates/registration.php')({ vendor, extension }))
            );
            await fs.writeFile(
                moduleXmlUri,
                this.encoder(require('../templates/etc/module.xml')({ vendor, extension }))
            );
            await fs.writeFile(
                composerJsonUri,
                this.encoder(require('../templates/composer.handlebars')({ vendor, extension }))
            );
        } catch (e) {
            console.log(e);
            throw new Error('Error creating extension files');
        }
        await workspace.openTextDocument(moduleXmlUri);
        return extensionUri;
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
        let data = this.getUriData(textDocument.uri);
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
     * @private
     * @param {TextEditor} textEditor
     * @param {number} indent number of indenting steps
     * @returns {string}
     * @memberof Magento
     */
    private indentCode(textEditor: TextEditor | undefined, indent: number): string {
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
     * @private
     * @param {TextEditor} textEditor
     * @param {Docblock} docblock
     * @returns
     * @memberof Magento
     */
    private docblock(textEditor: TextEditor, docblock: Docblock) {
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
     * DI automation
     *
     * @param {TextEditor} textEditor
     * @param {string} className
     * @param {string} varName
     * @memberof Magento
     */
    async injectDependency(textEditor: TextEditor, className: string, varName: string): Promise<void> {
        // strip $ from the variable name
        varName = varName.startsWith('$') ? varName.substring(1) : varName;
        let document = textEditor.document;
        let data = this.getUriData(document.uri);
        let ast = new Ast();
        ast.parseCode(document.getText(), data.name+'.'+data.ext);
        let classNode = ast.findClass(data.name);
        if (!classNode) {
            throw new Error(`Can't find class '${data.name}'`);
        }
        let constructorNode = ast.findConstructor(classNode);

        let inserts: Insert[] = [];

        if (!constructorNode) {
            throw new Error(`Can't find constructor in the class '${data.name}'`);
        }

        // Adding argument to the constructor
        let previousArg: Parser.Parameter | undefined;
        if (constructorNode.arguments.length > 0) {
            // there are some arguments already
            for(var i = constructorNode.arguments.length-1; i >= 0; i--) {
                let arg = constructorNode.arguments[i];
                // skipping arguments with a default values
                if (!arg.value) {
                    break;
                }
            }

            if (i === constructorNode!.arguments.length-1) {
                // adding after the last argument
                let arg = previousArg = constructorNode!.arguments[i];
                let indentation = document.getText(new Range(arg.loc.start.line-1, 0, arg.loc.start.line-1, arg.loc.start.column));
                inserts.push({
                    line: arg.loc.end.line-1,
                    column: arg.loc.end.column,
                    text: `,\n${indentation}${className} $${varName}`,
                });
            } else {
                // adding before some argument
                previousArg = constructorNode!.arguments[i];
                let arg = constructorNode!.arguments[i+1];
                let indentation = document.getText(new Range(arg.loc.start.line-1, 0, arg.loc.start.line-1, arg.loc.start.column));
                inserts.push({
                    line: arg.loc.start.line-1,
                    column: 0,
                    text: `${indentation}${className} $${varName},\n`,
                });
            }
        } else {
            // there is no arguments yes, need to guess where to insert one
            let constructorCode = document.getText(new Range(
                    constructorNode.loc.start.line-1, constructorNode.loc.start.column,
                    constructorNode.loc.end.line-1, constructorNode.loc.end.column
                ));
            let constructorOffset = document.offsetAt(new Position(constructorNode.loc.start.line-1, constructorNode.loc.start.column));
            let argsOffset = constructorCode.indexOf('(');
            let argsPosition = document.positionAt(constructorOffset + argsOffset + 1);
            inserts.push({
                line: argsPosition.line,
                column: argsPosition.character,
                text: '\n'+this.indentCode(textEditor, 2)+`${className} $${varName}\n`+this.indentCode(textEditor, 1),
            });
        }

        // adding variable to the class
        let pos: Parser.Position;
        if (constructorNode.leadingComments) {
            pos = constructorNode.leadingComments[0].loc.start;
        } else {
            pos = constructorNode.loc.start;
        }
        let indent = this.indentCode(textEditor, 1);
        var docblock = this.docblock(textEditor, { params: [['@param', className]] });
        inserts.push({
            line: pos.line-1,
            column: 0,
            text: `${docblock}${indent}private $${varName};\n\n`,
        });

        // adding assignment to the constructor
        let assignmentPosition: Position | undefined;
        let statements = constructorNode.body.children;
        for(let statement of statements) {
            if (statement.kind === 'expressionstatement') {
                let expression = (statement as Parser.ExpressionStatement).expression;
                if (previousArg && expression.kind === 'assign') {
                    expression = expression as Parser.Expression;
                    if (
                        expression.left.kind === 'propertylookup' &&
                        expression.right.kind === 'variable' &&
                        expression.right.name as unknown as string === previousArg.name.name
                    ) {
                        // found assignment of the previous argument
                        assignmentPosition = new Position(expression.loc.start.line, 0);
                        break;
                    }
                }
            }
        }

        if (!assignmentPosition) {
            if (constructorNode.body.children.length > 0) {
                assignmentPosition = new Position(constructorNode.body.children[0].loc.start.line-1, 0);
            } else {
                assignmentPosition = new Position(constructorNode.body.loc.start.line, 0);
            }
        }
        inserts.push({
            line: assignmentPosition.line,
            column: assignmentPosition.character,
            text: this.indentCode(textEditor, 2) + `$this->${varName} = $${varName};\n`,
        });
        try {
            var result = await textEditor.edit(editBuilder => {
                for(let insert of inserts) {
                    editBuilder.insert(new Position(insert.line, insert.column), insert.text);
                }
            });
        } catch (e) {
            throw new Error('Can\'t apply edits');
        }
        if (!result) {
            throw new Error('Can\'t apply edits');
        }
    }

    /**
     * Returns array of classes to be used in DI
     *
     * @returns {string[]}
     * @memberof Magento
     */
    async * getClasses(): AsyncIterableIterator<string[]> {
        yield classList;
        // if workspace folder is not set - can't search for additional classes
        if (!this.folder) {
            return [];
        }
        let files = await workspace.findFiles(
            new RelativePattern(this.folder, 'app/code/**/*.php'),
            'register.php'
        );
        let extClasses: string[]  = [];
        files.forEach(uri => {
            let data = this.getUriData(uri);
            if (data.vendor && data.extension && data.namespace && data.name) {
                extClasses.push(`\\${data.vendor}\\${data.extension}\\${data.namespace}\\${data.name}`);
            }
        });
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
     * @returns any
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

    async addObserver(extensionData: ExtensionInfo, eventName: string, observerName: string): Promise<void> {
        if (!workspace.workspaceFolders) {
            throw new Error('No open workspace');
        }
        let eventsXmlUri = this.appendUri(workspace.workspaceFolders[0].uri, 'app', 'code', extensionData.vendor, extensionData.extension, 'etc', 'events.xml');
        let observerPhpUri = this.appendUri(workspace.workspaceFolders[0].uri, 'app', 'code', extensionData.vendor, extensionData.extension, 'Observer',  ...(observerName+'.php').split('\\'));

        if (await this.fileExists(observerPhpUri)) {
            throw new Error(this.relativePath(observerPhpUri)+' already exists');
        }

        let stats;
        try {
            stats = await fs.stat(eventsXmlUri);
        } catch {
            // file not found
            let eventsXml = require('../templates/etc/events.xml')(Object.assign({ eventName, observerName }, extensionData));
            this.writeFile(eventsXmlUri, eventsXml);
        }
        if (stats) {
            if (stats.type !== FileType.File) {
                throw new Error(this.relativePath(eventsXmlUri)+' is not a file');
            }
            let eventsXml = await this.readFile(eventsXmlUri);
            try {
                var xml = convert.xml2js(eventsXml, {
                    compact: false,
                    alwaysChildren: true,
                });
            } catch (e) {
                console.log(e);
                throw new Error('Error parsing '+this.relativePath(eventsXmlUri));
            }
            console.log(xml);
            let configNode;
            for (let element of xml.elements) {
                if (element.type === 'element' && element.name === 'config') {
                    configNode = element;
                }
            }
            if (configNode) {
                    configNode.elements.push({
                    type: 'element',
                    name: 'event',
                    attributes: { name: eventName },
                    elements: [{
                        type: 'element',
                        name: 'observer',
                        attributes: {
                            name: `${extensionData.vendor}_${extensionData.extension}_${observerName}`,
                            instance: `${extensionData.vendor}\\${extensionData.extension}\\Observer\\${observerName}`,
                        }
                    }]
                });

                let eventsXml = convert.js2xml(xml, {
                    spaces: this.indentCode(window.activeTextEditor, 1),
                    compact: false,
                });
                await this.writeFile(eventsXmlUri, eventsXml);
            } else {
                throw new Error('Error parsing '+this.relativePath(eventsXmlUri));
            }
        }

        let observerData = Object.assign({ data: eventsList[eventName].data }, this.getUriData(observerPhpUri));
        let observerPhp = require('../templates/observer.php')(observerData);
        await this.writeFile(observerPhpUri, observerPhp);
        await window.showTextDocument(observerPhpUri);
    }
}

export default new Magento();