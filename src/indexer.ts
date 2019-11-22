import { Uri, workspace, WorkspaceFolder, RelativePattern, ExtensionContext, WorkspaceConfiguration } from 'vscode';
import * as path  from 'path';
import magento from './magento';

interface ComponentsRegistration {
    [componentName: string]: string;
}

interface RegistrationData {
    module: ComponentsRegistration;
    library: ComponentsRegistration;
    language: ComponentsRegistration;
    theme: ComponentsRegistration;
    setup: ComponentsRegistration;
}

export default class Indexer {
    public workspaceFolder: WorkspaceFolder;
    private context: ExtensionContext;
    private php: string = 'php';
    private user: string = '';
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
        this.user = config.get('magentoWizard.tasks.user') || '';
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
                Object.assign(this.paths.module, paths.module);
                Object.assign(this.paths.setup, paths.setup);
                Object.assign(this.paths.theme, paths.theme);
            }
        } catch {

        }

        return [];
    }
}