import { Uri, workspace, WorkspaceFolder, RelativePattern, ExtensionContext, WorkspaceConfiguration } from 'vscode';
import * as path  from 'path';
import magento, { UriData, ExtentionKind } from './magento';

interface ComponentsRegistrations {
    [componentName: string]: UriData;
}

interface RegistrationData {
    module: ComponentsRegistrations;
    library: ComponentsRegistrations;
    language: ComponentsRegistrations;
    theme: ComponentsRegistrations;
    setup: ComponentsRegistrations;
}

export default class Indexer {
    public workspaceFolder: WorkspaceFolder;
    private context: ExtensionContext;
    private php: string = 'php';
    private paths: RegistrationData = {
        module: {},
        library: {},
        language: {},
        theme: {},
        setup: {},
    };

    constructor(context: ExtensionContext, workspaceFolder: WorkspaceFolder) {
        this.workspaceFolder = workspaceFolder;
        this.context = context;
        this.readConfig();
        this.index();
    }

    private readConfig() {
        const config = workspace.getConfiguration('', this.workspaceFolder.uri);
        this.php = config.get('magentoWizard.tasks.php') || 'php';
    }

    async index(): Promise<void> {
        const files = await workspace.findFiles(new RelativePattern(this.workspaceFolder, 'app/**/registration.php'));
        files.forEach(file => {
            this.register(file);
        });
        return;
    }

    async register(file: Uri): Promise <string[]> {
        const commandLine =  this.php + ' ' + path.join(this.context.extensionPath,'php', 'ComponentRegistrar.php') + ' ' + file.fsPath;
        let { stdout, stderr } = await magento.exec(commandLine, {});
        try {
            const paths = JSON.parse(stdout);
            if (paths) {
                Object.assign(this.paths.language, paths.language);
                Object.assign(this.paths.library, paths.library);
                this.indexModule(paths.module).then(modules => {
                    Object.assign(this.paths.module, modules);
                });
                Object.assign(this.paths.setup, paths.setup);
                Object.assign(this.paths.theme, paths.theme);
            }
        } catch {

        }

        return [];
    }

    async indexModule(registrations: {[componentName: string]: string}): Promise<ComponentsRegistrations> {
        let components: ComponentsRegistrations = {};
        for(let componentName in registrations) {
            const extensionUri = Uri.parse(registrations[componentName]);
            let extensionNamespace = componentName.split('_').join('\\')+'\\';
            try {
                const composerJson = JSON.parse(await magento.readFile(magento.appendUri(extensionUri, 'composer.json')));
                for(let namespace in composerJson.autoload['psr-4']) {
                    if (composerJson.autoload['psr-4'][namespace] === '') {
                        extensionNamespace = namespace;
                        break;
                    }
                }
            } catch {
            }
            const [vendor, extension] = extensionNamespace.split('\\');

            components[componentName] = {
                kind: ExtentionKind.Module,
                extensionFolder: registrations[componentName],
                extensionUri,
                name: componentName,
                workspace: workspace.getWorkspaceFolder(extensionUri)!,
                namespace: extensionNamespace,
                vendor,
                extension,
                area: '',
                type: '',
                ext: '',

            };
        }
        return components;
    }
}