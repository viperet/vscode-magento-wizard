import magento from '../magento';
import { workspace, DefinitionProvider, TextDocument, Position, CancellationToken, ProviderResult, Definition, DefinitionLink, Uri, Range} from 'vscode';
class MagentoDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition | DefinitionLink[]> {
        let definition: DefinitionLink = {
            targetUri: Uri.parse('/Users/viperet/Documents/Work/Magento-CE-2.3.2-2019-06-13-03-19-34//app/code/Viperet/Test/registration.php'),
            targetRange: new Range(0, 0, 0, 4),
            targetSelectionRange: new Range(1, 0, 1, 5),
            originSelectionRange: new Range(position, position.translate(0, 10)),
        };
        return [definition];
    }
}
export const definitionProvider = new MagentoDefinitionProvider();
