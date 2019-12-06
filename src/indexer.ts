import { Uri, workspace, WorkspaceFolder, RelativePattern, ExtensionContext, WorkspaceConfiguration, window } from 'vscode';
import * as path  from 'path';
import magento, { UriData, ExtentionKind } from './magento';
import * as convert  from 'xml-js';
import * as PProgress from 'p-progress';

interface RegistrationData {
    module: UriData[];
    library: UriData[];
    language: UriData[];
    theme: UriData[];
    setup: UriData[];
}

export default class Indexer {
    public workspaceFolder: WorkspaceFolder;
    private context: ExtensionContext;
    private php: string = 'php';
    private paths: RegistrationData = {
        module: [],
        library: [],
        language: [],
        theme: [],
        setup: [],
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
        const statusText = 'MagentoWizard indexing extensions/themes ';
        const status = window.createStatusBarItem();
        status.text = statusText;
        status.show();
        const files = await workspace.findFiles(new RelativePattern(this.workspaceFolder, '**/{app,vendor}/**/registration.php'), '**/tests/**');
        const registrations =  PProgress.all(files.map(file => this.register.bind(this, file)), { concurrency: 5});
        registrations.onProgress(progress => status.text = statusText+Math.round(progress*100)+'%');
        await registrations;
        window.showErrorMessage(`Modules count: ${this.paths.module.length}`);
        status.dispose();
        return;
    }

    async register(file: Uri): Promise<undefined> {
        const commandLine =  this.php + ' ' + path.join(this.context.extensionPath,'php', 'ComponentRegistrar.php') + ' ' + file.fsPath;
        try {
            let { stdout, stderr } = await magento.exec(commandLine, {});
            const paths = JSON.parse(stdout);
            if (paths) {
                this.paths.module.push(...await this.indexModule(paths.module));
                this.paths.theme.push(...await this.indexTheme(paths.theme));
            }
        } catch(e) {
            console.log(e);
        }
        return;
    }

    async indexModule(registrations: {[componentName: string]: string}): Promise<UriData[]> {
        let components: UriData[] = [];
        for(let componentName in registrations) {
            let extensionUri = Uri.file(registrations[componentName]);
            let extensionNamespace = componentName.split('_').join('\\')+'\\';
            try {
                const composerJson = JSON.parse(await magento.readFile(magento.appendUri(extensionUri, 'composer.json')));
                for(let namespace in composerJson.autoload['psr-4']) {
                    if (composerJson.autoload['psr-4'][namespace] === '') {
                        extensionNamespace = namespace;
                        break;
                    }
                }
            } catch(e) {
                console.log(e);
            }
            const [vendor, extension] = extensionNamespace.split('\\');

            // let classes: string[] = [];
            // const files = await workspace.findFiles(new RelativePattern(registrations[componentName], '**/*.php'), 'registration.php');
            // files.forEach(file => {
            //     let className =  extensionNamespace+path.relative(registrations[componentName], path.dirname(file.fsPath)).split(path.sep).join('\\')+'\\'+path.basename(file.fsPath, '.php');
            //     classes.push(className);
            // });

            components.push({
                kind: ExtentionKind.Module,
                extensionFolder: path.dirname(registrations[componentName]),
                extensionUri,
                componentName,
                workspace: workspace.getWorkspaceFolder(extensionUri)!,
                namespace: extensionNamespace,
                vendor,
                extension,
                parent: '',
                name: '',
                area: '',
                type: '',
                ext: '',

            });
        }
        return components;
    }


    async indexTheme(registrations: {[componentName: string]: string}): Promise<UriData[]> {
        let components: UriData[] = [];
        for(let componentName in registrations) {
            const extensionUri = Uri.parse(registrations[componentName]);
            const [area, vendor, extension] = componentName.split('/');
            let parentTheme = '';
            try {
                const themeXml = await magento.readFile(magento.appendUri(extensionUri, 'theme.xml'));
                var xml = convert.xml2js(themeXml, { compact: true }) as any;
                parentTheme = area+'/'+xml.theme.parent._text;
            } catch {
            }

            components.push({
                kind: ExtentionKind.Theme,
                extensionFolder: registrations[componentName],
                extensionUri,
                componentName,
                workspace: workspace.getWorkspaceFolder(extensionUri)!,
                parent: parentTheme,
                namespace: '',
                area,
                vendor,
                extension,
                name: '',
                type: '',
                ext: '',
            });
        }
        return components;
    }

    findByUri(path: Uri): UriData | undefined {
        for(let extensions of [this.paths.module, this.paths.theme]) {
            for(let extension of extensions) {
                if (path.fsPath.startsWith(extension.extensionFolder)) {
                    return extension;
                }
            }
        }

        return undefined;
    }
}