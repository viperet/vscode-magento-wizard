import magento, { UriData, ExtentionKind } from '../magento';
import { workspace, CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionList, CompletionItemKind, Uri} from 'vscode';
import { ElementNode, getCurrentNode, XmlTagName } from "../utils/lexerUtils";
import * as output from '../output';
import * as _ from 'lodash';
import * as path  from 'path';

class MagentoCompletionProvider implements CompletionItemProvider {
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList | CompletionItem[] | undefined> {

        const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return undefined;
        }
        magento.folder = workspaceFolder;
        const extensionData = await magento.getUriData(document.uri);
        if (!extensionData) {
            return undefined;
        }
        const documentText: string = document.getText();
        const cursorOffset: number = document.offsetAt(position);
        const currentNode: ElementNode | undefined = getCurrentNode(documentText, cursorOffset);
        if (currentNode === undefined || currentNode.contentStart === undefined) {
            return undefined;
        }
        const completionText = currentNode.text || '';
        if (currentNode.type === 'attribute') {
            if (currentNode.tag === 'instance' && currentNode.parent.tag === 'job' && extensionData.name === 'crontab') {
                return this.classesCompletion(completionText, extensionData, 'Cron');
            } else if (currentNode.tag === 'instance' && currentNode.parent.tag === 'observer' && extensionData.name === 'events') {
                return this.classesCompletion(completionText, extensionData, 'Observer');
            } else if (currentNode.tag === 'type' && currentNode.parent.tag === 'plugin' && extensionData.name === 'di') {
                return this.classesCompletion(completionText, extensionData, 'Plugin');
            } else if (currentNode.tag === 'class' && currentNode.parent.tag === 'service' && extensionData.name === 'webapi') {
                return this.classesCompletion(completionText, extensionData, 'Api');
            } else if (currentNode.tag === 'method' && currentNode.parent.tag === 'service' && extensionData.name === 'webapi') {
                const className = _.find(currentNode.parent.attributes, attribute => attribute.tag === 'class')?.text;
                if (className) {
                    return this.classMethodsCompletion(className);
                }
                return undefined;
            } else if (currentNode.tag === 'class' && currentNode.parent.tag === 'block' && extensionData.type === 'view') {
                return this.classesCompletion(completionText, extensionData, 'Block');
            } else if (currentNode.tag === 'template') {
                return this.templatesCompletion(completionText, extensionData);
            } else if (currentNode.tag === 'src' && currentNode.parent.tag === 'css') {
                return this.webCompletion(completionText, extensionData, 'css');
            } else if (currentNode.tag === 'src' && (currentNode.parent.tag === 'js' || currentNode.parent.tag === 'link')) {
                return this.webCompletion(completionText, extensionData, 'js');
            } else if (currentNode.tag === 'src' && currentNode.parent.tag === 'remove') {
                return this.webCompletion(completionText, extensionData, '{js,css}');
            } else if (currentNode.tag === 'layout' && currentNode.parent.tag === 'page') {
                return this.layoutCompletion(completionText, extensionData);
            } else if ( currentNode.tag === 'instance' ) {
                return this.classesCompletion(completionText, extensionData);
            }
        }
        return [];
    }

    async layoutCompletion(text: string, extensionData: UriData): Promise<CompletionList | undefined> {
        const layouts: string[] = ['empty', '1column', '2columns-left', '2columns-right', '3columns'];
        const items: CompletionItem[] = layouts.map(layout => new CompletionItem(layout, CompletionItemKind.Value));
        return new CompletionList(items);
    }

    async webCompletion(text: string, extensionData: UriData, type: string): Promise<CompletionList | undefined> {
        const items: CompletionItem[] = [];
        let basePath;
        if (extensionData.kind === ExtentionKind.Module) {
            basePath = `${extensionData.extensionFolder}view/${extensionData.area}/web/`;
        } else if (extensionData.kind === ExtentionKind.Theme) {
            basePath = `${extensionData.extensionFolder}web/`;
        } else {
            return undefined;
        }
        const files = await magento.searchViewFiles(basePath, `**/*.${type}`);
        for(let file of files) {
            const template = path.relative(basePath, file);
            items.push(new CompletionItem(template, CompletionItemKind.File));
        }
        return new CompletionList(items);
    }

    async templatesCompletion(text: string , extensionData: UriData): Promise<CompletionList | undefined> {
        const items: CompletionItem[] = [];
        let basePath;
        if (extensionData.kind === ExtentionKind.Module) {
            basePath = `${extensionData.extensionFolder}view/${extensionData.area}/templates/`;
        } else if (extensionData.kind === ExtentionKind.Theme) {
            basePath = `${extensionData.extensionFolder}`;
        } else {
            return undefined;
        }
        const files = await magento.searchViewFiles(basePath, '**/*.phtml');
        for(let file of files) {
            const template = path.relative(basePath, file);
            if (extensionData.kind === ExtentionKind.Theme) {
                const matches = template.match(/^(?<moduleName>[a-zA-Z0-9_]+)\/templates\/(?<templatePath>.*)$/);
                if (matches && matches.groups) {
                    items.push(new CompletionItem(`${matches.groups.moduleName}::${matches.groups.templatePath}`, CompletionItemKind.File));
                }
            } else {
                items.push(new CompletionItem(template, CompletionItemKind.File));
            }
        }
        return new CompletionList(items);
    }

    async classesCompletion(text: string , extensionData: UriData, type?: string): Promise<CompletionList> {
        const items: CompletionItem[] = [];
        const folder = extensionData.extensionFolder;
        const classes = await magento.searchClasses(folder);
        for(let className of classes) {
            if (!type || className.includes(`\\${type}\\`)) {
                items.push(new CompletionItem(className.substr(1), CompletionItemKind.Class));
            }
        }
        return new CompletionList(items);
    }

    async classMethodsCompletion(className: string): Promise<CompletionList> {
        const items: CompletionItem[] = [];
        const classFile = await magento.getClassFile(className);
        if (classFile) {
            const methods = await magento.getClassMethods(classFile);
            items.push(...methods.map(method => new CompletionItem(method.name, CompletionItemKind.Method)));
        }
        return new CompletionList(items);
    }
}
export const completionProvider = new MagentoCompletionProvider();
