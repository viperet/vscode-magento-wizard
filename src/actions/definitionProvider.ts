import magento, { ExtensionInfo, UriData } from '../magento';
import { workspace, DefinitionProvider, TextDocument, Position, CancellationToken, ProviderResult, Definition, DefinitionLink, Uri, Range, window} from 'vscode';

export interface ClassDefinitionLink extends DefinitionLink {
    resolved: boolean;
    targetName: string;
    targetType: string;
    originSelectionRange: Range;
}

interface FileCache {
    version: number;
    data: { [line: number]: ClassDefinitionLink[] };
}

class MagentoDefinitionProvider implements DefinitionProvider {
    private fileReferenceRe = /['">]([a-zA-Z0-9]+_[a-zA-Z0-9]+::[-a-zA-Z0-9@$=%#_/.]+)[<'"]/g;
    private classReferenceRe = /['">]([a-zA-Z0-9\\]+)[<:'"]/g;
    private definitionCache: { [fileName: string]: FileCache} = {};

    constructor() {

    }

    async provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Promise<Definition | DefinitionLink[]> {
        let fileCache = this.definitionCache[document.fileName];
        if (!fileCache) {
            fileCache = this.definitionCache[document.fileName] = {
                version: 0,
                data: {},
            };
        }
        if (fileCache.version !== document.version) {
            // clear cache if doc is changed
            fileCache.data = {};
            fileCache.version = document.version;
        }
        let targetDefinitions: DefinitionLink[] = [];
        const info = await magento.getUriData(document.uri);

        if (this.definitionCache[position.line]) {
            // we have data in cache for this line
            for(let definition of fileCache.data[position.line]) {
                if (definition.originSelectionRange.contains(position)) {
                    const resolvedDefinition = await this.resolveDefinition(info, definition);
                    if (resolvedDefinition) {
                        targetDefinitions.push(resolvedDefinition);
                    }
                    break;
                }
            }
        }

        // if we didn't found definition in cache - we need to
        // search current line for it
        if (targetDefinitions.length === 0) {
            const lineRange = new Range(position.with(undefined,0), position.with(position.line+1, 0));
            const line = document.getText(lineRange);
            const definitions = [];
            definitions.push(...this.findDefinitions(document, position, lineRange, line, this.classReferenceRe, 'class'));
            definitions.push(...this.findDefinitions(document, position, lineRange, line, this.fileReferenceRe, 'file'));

            for(let definition of definitions) {
                if (definition.originSelectionRange.contains(position)) {
                    const resolvedDefinition = await this.resolveDefinition(info, definition);
                    if (resolvedDefinition) {
                        targetDefinitions.push(resolvedDefinition);
                    }
                    break;
                }
            }
        }
        return targetDefinitions;
    }

    private findDefinitions(document: TextDocument, position: Position, lineRange: Range, line: string, re: RegExp, type: string): ClassDefinitionLink[] {
        let definitions: ClassDefinitionLink[] = [];
        let match;
        // tslint:disable-next-line: no-conditional-assignment
        while (match = re.exec(line)) {
            const sourceRange = lineRange.with(
                lineRange.start.with(undefined, match.index+1),
                lineRange.start.with(undefined, match.index+match[1].length+1),
            );
            let definition: ClassDefinitionLink = {
                resolved: false,
                targetName: match[1],
                targetType: type,
                targetUri: document.uri,
                targetRange: new Range(0, 0, 5, 0),
                originSelectionRange: sourceRange,
            };
            definitions.push(definition);
            // save definition to cache
            if (!this.definitionCache[document.fileName].data[position.line]) {
                this.definitionCache[document.fileName].data[position.line] = [];
            }
            this.definitionCache[document.fileName].data[position.line].push(definition);

        }
        // reset regexp object
        re.lastIndex = 0;

        return definitions;
    }

    public async resolveDefinition(uriData: UriData, definition: ClassDefinitionLink): Promise<DefinitionLink | undefined> {
        if (!definition.resolved) {
            let uri;
            if (definition.targetType === 'class') {
                uri = await magento.getClassFile(uriData, definition.targetName);
            } else if (definition.targetType === 'file') {
                uri = await magento.getViewFile(uriData, definition.targetName);
            }
            if (uri) {
                definition.targetUri = uri;
                definition.resolved = true;
                return definition;
            }
        return undefined;
        }
        return definition;
    }
}
export const definitionProvider = new MagentoDefinitionProvider();
