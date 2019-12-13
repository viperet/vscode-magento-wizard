import { Uri, workspace, WorkspaceFolder, RelativePattern, ExtensionContext, WorkspaceConfiguration, window, FileSystemWatcher, Disposable } from 'vscode';
import * as path  from 'path';
import magento, { UriData, ExtentionKind } from './magento';
import * as convert  from 'xml-js';
import * as PProgress from 'p-progress';
import * as fs from 'fs';
import * as _ from 'lodash';

interface RegistrationData {
    module: UriData[];
    library: UriData[];
    language: UriData[];
    theme: UriData[];
    setup: UriData[];
}

export default class Indexer {
    public workspaceFolder: WorkspaceFolder;
    public magentoRoot: Promise <Uri | undefined>;
    private context: ExtensionContext;
    private php: string = 'php';
    private disposables: { dispose: () => any }[] = [];
    public paths: RegistrationData = {
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
        this.magentoRoot = this.index();
        this.magentoRoot.then(magentoRoot => {
            if (magentoRoot) {
                // only watch for changes if this folder contains magento
                this.watch();
            }
        });
    }

    public dispose() {
        Disposable.from(...this.disposables).dispose();
    }

    private readConfig() {
        const config = workspace.getConfiguration('', this.workspaceFolder.uri);
        this.php = config.get('magentoWizard.tasks.php') || 'php';
    }

    async index(): Promise< Uri | undefined> {
        let magentoRoot: Uri;
        const statusText = 'MagentoWizard indexing extensions/themes ';
        const status = window.createStatusBarItem();
        status.text = statusText;
        status.show();

        const env = await workspace.findFiles(new RelativePattern(this.workspaceFolder, '**/app/etc/env.php'), '**/{tests,vendor}/**', 1);
        if (env.length > 0) {
            magentoRoot = magento.appendUri(env[0], '..', '..', '..');
        } else {
            status.dispose();
            return undefined;
        }
        const files = await workspace.findFiles(new RelativePattern(this.workspaceFolder, '**/{app,vendor}/**/registration.php'), '**/tests/**');
        const registrations =  PProgress.all(files.map(file => this.register.bind(this, file)), { concurrency: 5});
        registrations.onProgress(progress => status.text = statusText+Math.round(progress*100)+'%');
        await registrations;
        console.log('Modules '+this.paths.module.length);
        status.dispose();
        return magentoRoot;
    }

    async indexFolder(folder: Uri): Promise <unknown> {
        const files = await workspace.findFiles(new RelativePattern(folder.fsPath, '**/registration.php'));
        console.log('Found files', files);
        await Promise.all(files.map(file => this.register(file)));
        this.paths.module = _.uniqBy(this.paths.module, extension => extension.extensionFolder);
        this.paths.theme = _.uniqBy(this.paths.theme, extension => extension.extensionFolder);
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
                extensionFolder: path.normalize(registrations[componentName])+path.sep,
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
                extensionFolder: path.normalize(registrations[componentName])+path.sep,
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

    async watch() {
        let magentoRoot = (await this.magentoRoot)!.fsPath;
        let registrationWatcher = workspace.createFileSystemWatcher(new RelativePattern(magentoRoot, '{app,vendor}/**/registration.php'));
        registrationWatcher.onDidDelete(file => {
            console.log('Deleted - '+file.fsPath);
            this.paths.module = this.paths.module.filter(extension => !extension.extensionFolder.startsWith(path.dirname(file.fsPath)+path.sep));
            this.paths.theme = this.paths.theme.filter(extension => !extension.extensionFolder.startsWith(path.dirname(file.fsPath)+path.sep));
            console.log('After delete', this.paths.module);
        });
        registrationWatcher.onDidChange(async file => {
            console.log('Changed - '+file.fsPath);
            this.paths.module = this.paths.module.filter(extension => !extension.extensionFolder.startsWith(path.dirname(file.fsPath)+path.sep));
            this.paths.theme = this.paths.theme.filter(extension => !extension.extensionFolder.startsWith(path.dirname(file.fsPath)+path.sep));
            await this.register(file);
            console.log('After change', this.paths.module);
        });
        registrationWatcher.onDidCreate(async file => {
            console.log('Changed - '+file.fsPath);
            await this.register(file);
            console.log('After create', this.paths.module);
        });
        this.disposables.push(registrationWatcher);
        let everythingWatcher = workspace.createFileSystemWatcher(new RelativePattern(magentoRoot, '{app,vendor}/**'));
        everythingWatcher.onDidDelete(file => {
            console.log('Deleted: '+file.fsPath);
            this.paths.module = this.paths.module.filter(extension => !extension.extensionFolder.startsWith(file.fsPath));
            this.paths.theme = this.paths.theme.filter(extension => !extension.extensionFolder.startsWith(file.fsPath));
            console.log('After deletion', this.paths.module);
        });
        everythingWatcher.onDidCreate(async file => {
            if (fs.statSync(file.fsPath).isDirectory()) {
                console.log('Created: '+file.fsPath);
                await this.indexFolder(file);
                console.log('After creation', this.paths.module);
            }
        });
        this.disposables.push(registrationWatcher);
    }

    findByUri(path: Uri): UriData | undefined {
        for(let extensions of [this.paths.module, this.paths.theme, this.paths.library, this.paths.setup, this.paths.language]) {
            for(let extension of extensions) {
                if (path.fsPath.startsWith(extension.extensionFolder)) {
                    return extension;
                }
            }
        }
        return undefined;
    }

    findByClassName(className: string): UriData | undefined {
        let classNameNormalized = className.split('\\').filter(Boolean).join('\\')+'\\';
        for(let extensions of [this.paths.module, this.paths.library, this.paths.setup]) {
            for(let module of extensions) {
                if (classNameNormalized.startsWith(module.namespace)) {
                    return module;
                }
            }
        }
        return undefined;
    }

    findByVendorExtension(vendor: string, extension: string): UriData | undefined {
        for(let extensions of [this.paths.module, this.paths.library, this.paths.setup]) {
            for(let module of extensions) {
                if (module.vendor === vendor && module.extension === extension) {
                    return module;
                }
            }
        }
        return undefined;
    }
}