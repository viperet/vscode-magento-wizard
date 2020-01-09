import { Uri, workspace, WorkspaceFolder, RelativePattern, ExtensionContext, WorkspaceConfiguration, window, FileSystemWatcher, Disposable, ConfigurationChangeEvent } from 'vscode';
import * as path  from 'path';
import magento, { UriData, ExtentionKind } from './magento';
import * as convert  from 'xml-js';
import * as PProgress from 'p-progress';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as output from './output';

interface RegistrationData {
    module: UriData[];
    library: UriData[];
    language: UriData[];
    theme: UriData[];
    setup: UriData[];
    registrations: { [registration: string]: number };
}

export default class Indexer {
    public workspaceFolder: WorkspaceFolder;
    //@ts-ignore
    public magentoRoot: Promise <Uri | undefined>;
    private magentoRootConfig: string = "";
    private context: ExtensionContext;
    private php: string = 'php';
    private disposables: { dispose: () => any }[] = [];
    public paths: RegistrationData = {
        module: [],
        library: [],
        language: [],
        theme: [],
        setup: [],
        registrations: {},
    };

    constructor(context: ExtensionContext, workspaceFolder: WorkspaceFolder) {
        this.workspaceFolder = workspaceFolder;
        this.context = context;
        // read config and start indexing
        this.readConfig();
        workspace.onDidChangeConfiguration(change => this.readConfig(change));

        //@ts-ignore
        this.magentoRoot.then(magentoRoot => {
            if (magentoRoot) {
                output.log('Found Magento root at', magentoRoot.fsPath);
                output.log(' - Modules:', this.paths.module.length);
                output.log(' - Themes:', this.paths.theme.length);
            } else {
                output.log(`No Magento root in '${workspaceFolder.name}' workspace folder (${workspaceFolder.uri.fsPath})`);
            }
        });
    }

    public destroy() {
        this.context.workspaceState.update('indexer_'+this.workspaceFolder.uri.fsPath, undefined);
        this.dispose();
    }

    public async save() {
        this.context.workspaceState.update('indexer_'+this.workspaceFolder.uri.fsPath, await this.toJSON());
    }

    public load(): boolean {
        const savedData: { paths:RegistrationData, magentoRoot: Uri } | undefined = this.context.workspaceState.get('indexer_'+this.workspaceFolder.uri.fsPath);
        if (savedData) {
            // restore Uri
            for(let extensions of [savedData.paths.module, savedData.paths.library, savedData.paths.setup, savedData.paths.theme, savedData.paths.language]) {
                for(let module of extensions) {
                    module.extensionUri = Uri.file(module.extensionUri.path);
                }
            }
            this.paths = savedData.paths;
            this.magentoRoot = Promise.resolve(savedData.magentoRoot);
            return true;
        }
        return false;
    }

    public async toJSON(): Promise<any> {
        return {
            magentoRoot: await this.magentoRoot,
            paths: this.paths,
        };
    }

    public dispose() {
        Disposable.from(...this.disposables).dispose();
    }

    private readConfig(change?: ConfigurationChangeEvent) {
        const config = workspace.getConfiguration('magentoWizard', this.workspaceFolder.uri);
        if (!change || change.affectsConfiguration('magentoWizard.tasks.php', this.workspaceFolder.uri)) {
            this.php = config.get('tasks.php') || 'php';
        }
        if (!change || change.affectsConfiguration('magentoWizard.magentoRoot', this.workspaceFolder.uri)) {
            let newMagentoRootConfig: string = config.get('magentoRoot') || '';
            this.magentoRootConfig = newMagentoRootConfig;
            this.magentoRoot = this.index();
        }
    }

    async index(): Promise< Uri | undefined> {
        let magentoRoot: Uri;
        const statusText = 'MagentoWizard indexing extensions/themes ';
        const status = window.createStatusBarItem();
        status.text = statusText;
        status.show();

        this.paths = {
            module: [],
            library: [],
            language: [],
            theme: [],
            setup: [],
            registrations: {},
        };

        // load saved index and magentoRoot
        this.load();

        // absolute path
        if (this.magentoRootConfig.trim()) {
            let magentoRootConfig;
            try {
                magentoRootConfig = path.resolve(this.workspaceFolder.uri.fsPath, this.magentoRootConfig);
                const stats = fs.statSync(magentoRootConfig);
                if (!stats.isDirectory()) {
                    throw new Error('Not a dir!');
                }
            } catch {
                status.dispose();
                window.showErrorMessage(`Configured Magento root doesn't exists or not a directory: ${magentoRootConfig}`);
                return undefined;
            }
            magentoRoot = Uri.file(magentoRootConfig);
        } else {
            // autodetect magento root if it's not loaded
            const env = await workspace.findFiles(new RelativePattern(this.workspaceFolder, '**/app/etc/env.php'), '**/{tests,vendor}/**', 1);
            if (env.length > 0) {
                magentoRoot = magento.appendUri(env[0], '..', '..', '..');
            } else {
                status.dispose();
                return undefined;
            }
        }
        const files = await workspace.findFiles(new RelativePattern(magentoRoot.fsPath, '**/{app,vendor}/**/registration.php'), '**/tests/**');
        const registrations =  PProgress.all(files.map(file => this.register.bind(this, file)), { concurrency: 5});
        registrations.onProgress(progress => status.text = statusText+Math.round(progress*100)+'%');
        await registrations;
        status.dispose();

        // save index data
        this.save();
        // only watch for changes if this folder contains magento
        this.watch();

        return magentoRoot;
    }

    async indexFolder(folder: Uri): Promise <unknown> {
        output.debug(`Indexing folder ${folder.fsPath}`);
        const files = await workspace.findFiles(new RelativePattern(folder.fsPath, '**/registration.php'));
        output.debug('Found files registration files:', files.map(file => file.fsPath).join(', '));
        await Promise.all(files.map(file => this.register(file)));
        this.paths.module = _.uniqBy(this.paths.module, extension => extension.extensionFolder);
        this.paths.library = _.uniqBy(this.paths.library, extension => extension.extensionFolder);
        this.paths.theme = _.uniqBy(this.paths.theme, extension => extension.extensionFolder);
        return;
    }

    async register(file: Uri): Promise<undefined> {
        const stats = fs.statSync(file.fsPath);

        if (this.paths.registrations[file.fsPath] && this.paths.registrations[file.fsPath] === stats.mtimeMs) {
            // skip this registration.php because we already have it in index
            return;
        }

        const commandLine =  this.php + ' ' + path.join(this.context.extensionPath,'php', 'ComponentRegistrar.php') + ' ' + file.fsPath;
        try {
            let { stdout, stderr } = await magento.exec(commandLine, {});
            const paths = JSON.parse(stdout);
            // remove old entries from index
            this.removeFromIndex(path.dirname(file.fsPath)+path.sep);
            if (paths) {
                this.paths.module.push(...await this.indexModule(paths.module));
                this.paths.library.push(...await this.indexModule(paths.library));
                this.paths.theme.push(...await this.indexTheme(paths.theme));
            }
            if (stderr) {
                output.log(`Error while registering ${file.fsPath}`);
                output.log(stderr);
            }
        } catch(e) {
        }
        this.paths.registrations[file.fsPath] = stats.mtimeMs;
        return;
    }

    async indexModule(registrations: {[componentName: string]: string}): Promise<UriData[]> {
        let components: UriData[] = [];
        for(let componentName in registrations) {
            let extensionUri = Uri.file(registrations[componentName]);
            let extensionNamespace = componentName.split('_').join('\\')+'\\';
            const composerJsonUri = magento.appendUri(extensionUri, 'composer.json');
            if (await magento.fileExists(composerJsonUri)) {
                try {
                    const composerJson = JSON.parse(await magento.readFile(composerJsonUri));
                    for(let namespace in composerJson.autoload['psr-4']) {
                        if (composerJson.autoload['psr-4'][namespace] === '') {
                            extensionNamespace = namespace;
                            break;
                        }
                    }
                } catch(e) {
                    output.log(`Exception while indexing ${componentName} in ${registrations[componentName]}`);
                    output.log(e.name, e.message, e.stack);
                }
            } else {
                // no composer.json
                extensionNamespace = componentName.split('_').join('\\')+'\\';

            }
            const [vendor, extension] = componentName.split('_');

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

    removeFromIndex(path: string): void {
        _.remove(this.paths.module, extension => extension.extensionFolder.startsWith(path));
        _.remove(this.paths.theme, extension => extension.extensionFolder.startsWith(path));
        for(let registrationPath in this.paths.registrations) {
            if (registrationPath.startsWith(path)) {
                delete this.paths.registrations[registrationPath];
            }
        }
    }

    async watch() {
        let magentoRoot = (await this.magentoRoot)!.fsPath;
        let registrationWatcher = workspace.createFileSystemWatcher(new RelativePattern(magentoRoot, '{app,vendor}/**/registration.php'));
        registrationWatcher.onDidDelete(file => {
            output.debug('FileSystemWatcher: Deleted file', file.fsPath);
            this.removeFromIndex(path.dirname(file.fsPath)+path.sep);
        });
        registrationWatcher.onDidChange(async file => {
            output.debug('FileSystemWatcher: Changed file', file.fsPath);
            this.removeFromIndex(path.dirname(file.fsPath)+path.sep);
            await this.register(file);
        });
        registrationWatcher.onDidCreate(async file => {
            output.debug('FileSystemWatcher: Created file', file.fsPath);
            await this.register(file);
        });
        this.disposables.push(registrationWatcher);
        let everythingWatcher = workspace.createFileSystemWatcher(new RelativePattern(magentoRoot, '{app,vendor}/**'));
        everythingWatcher.onDidDelete(file => {
            output.debug('FileSystemWatcher: Deleted', file.fsPath);
            this.removeFromIndex(file.fsPath);
        });
        everythingWatcher.onDidCreate(async file => {
            if (fs.statSync(file.fsPath).isDirectory()) {
                output.debug('FileSystemWatcher: Created dir', file.fsPath);
                await this.indexFolder(file);
            }
        });
        this.disposables.push(registrationWatcher);
    }

    findByUri(path: Uri): UriData | undefined {
        for(let extensions of [this.paths.module, this.paths.theme, this.paths.library, this.paths.setup, this.paths.language]) {
            for(let extension of extensions) {
                if (path.fsPath.startsWith(extension.extensionFolder)) {
                    return Object.assign({}, extension);
                }
            }
        }
        return undefined;
    }

    findByClassName(className: string): UriData | undefined {
        let results: UriData[] = [];
        let classNameNormalized = className.split('\\').filter(Boolean).join('\\')+'\\';
        for(let extensions of [this.paths.module, this.paths.library, this.paths.setup]) {
            for(let module of extensions) {
                if (classNameNormalized.startsWith(module.namespace)) {
                    results.push(Object.assign({},  module));
                }
            }
        }
        if (results.length > 0) {
            // sort longer namespaces first
            results.sort((a, b) => {
                return b.namespace.length - a.namespace.length;
            });
            return results[0];
        }
        return undefined;
    }

    findByVendorExtension(vendor: string, extension: string): UriData | undefined {
        for(let extensions of [this.paths.module, this.paths.library, this.paths.setup]) {
            for(let module of extensions) {
                if (module.vendor === vendor && module.extension === extension) {
                    return Object.assign({}, module);
                }
            }
        }
        return undefined;
    }
}