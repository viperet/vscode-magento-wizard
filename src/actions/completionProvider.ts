import magento, { ExtensionInfo, UriData } from '../magento';
import { workspace, CompletionItemProvider, TextDocument, Position, CancellationToken, ProviderResult, Definition, DefinitionLink, Uri, Range, window, CompletionContext, CompletionItem, CompletionList} from 'vscode';
import { ElementNode, getCurrentNode, XmlTagName } from "../utils/lexerUtils";

class MagentoCompletionProvider implements CompletionItemProvider {
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionItem[] | undefined> {
        const documentText: string = document.getText();
        const cursorOffset: number = document.offsetAt(position);
        const currentNode: ElementNode | undefined = getCurrentNode(documentText, cursorOffset);
        if (currentNode === undefined || currentNode.contentStart === undefined) {
            return undefined;
        }
        console.log(currentNode);
        const items: CompletionItem[] = [];
        items.push(new CompletionItem('asdfgh'));
        items.push(new CompletionItem('erererer'));
        return items;
    }
}
export const completionProvider = new MagentoCompletionProvider();
