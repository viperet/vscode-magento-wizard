import magento, { ExtensionInfo, UriData } from '../magento';
import { workspace, CompletionItemProvider, TextDocument, Position, CancellationToken, ProviderResult, Definition, DefinitionLink, Uri, Range, window, CompletionContext, CompletionItem, CompletionList} from 'vscode';
import { ElementNode, getCurrentNode, XmlTagName } from "../utils/lexerUtils";

class MagentoCompletionProvider implements CompletionItemProvider {
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionItem[] | undefined> {
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
        const items: CompletionItem[] = [];
        if (currentNode.type === 'attribute') {
            if (
                currentNode.tag === 'instance'
                || (currentNode.tag === 'type' && currentNode.parent.tag === 'plugin' && extensionData.name === 'di')
            ) {
                const classes = await magento.searchClasses(extensionData.extensionFolder);
                for(let className of classes) {
                    items.push(new CompletionItem(className.substr(1)));
                }
            }
        }
        return items;
    }
}
export const completionProvider = new MagentoCompletionProvider();
