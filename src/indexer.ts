import { Uri, workspace, WorkspaceFolder, RelativePattern, ExtensionContext, WorkspaceConfiguration, window, FileSystemWatcher, Disposable, ConfigurationChangeEvent, Range } from 'vscode';
import * as path  from 'path';
import magento, { UriData, ExtentionKind } from './magento';
import * as convert  from 'xml-js';
import * as PProgress from 'p-progress';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as output from './output';
import { getNodesByTag, ElementNode } from './utils/lexerUtils';

const INDEX_VERSION = '2';

interface RegistrationData {
    module: UriData[];
    library: UriData[];
    language: UriData[];
    theme: UriData[];
    setup: UriData[];
    blocks: BlockData[];
    registrations: { [registration: string]: number };
}

export interface BlockData {
    name: string;
    uri: Uri;
    filename: string;
    start: number;
    end: number;
    kind: ExtentionKind;
    type: string;
    componentName: string;
    className: string;
    templateName: string;
    fullTemplateName: string;
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
        blocks: [],
        registrations: {},
    };

    constructor(context: ExtensionContext, workspaceFolder: WorkspaceFolder, forceReindex: boolean = false) {
        this.workspaceFolder = workspaceFolder;
        this.context = context;

        if (forceReindex) {
            // reset cache
            this.context.workspaceState.update('indexer_'+this.workspaceFolder.uri.fsPath, undefined);
        }

        // read config and start indexing
        this.readConfig();
        workspace.onDidChangeConfiguration(change => this.readConfig(change));

        //@ts-ignore
        this.magentoRoot.then(magentoRoot => {
            if (magentoRoot) {
                output.log('Found Magento root at', magentoRoot.fsPath);
                output.log(' - Modules:', this.paths.module.length);
                output.log(' - Themes:', this.paths.theme.length);
                output.log(' - Blocks:', this.paths.blocks.length);
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
        const savedData: { version: string, paths:RegistrationData, magentoRoot: Uri } | undefined = this.context.workspaceState.get('indexer_'+this.workspaceFolder.uri.fsPath);
        if (savedData) {
            if (savedData.version !== INDEX_VERSION) {
                return false;
            }
            // restore Uri
            for(let extensions of [savedData.paths.module, savedData.paths.library, savedData.paths.setup, savedData.paths.theme, savedData.paths.language]) {
                for(let module of extensions) {
                    module.extensionUri = Uri.file(module.extensionUri.path);
                }
            }
            for(let block of savedData.paths.blocks) {
                block.uri = Uri.file(block.uri.path);
            }
            this.paths = savedData.paths;
            this.magentoRoot = Promise.resolve(savedData.magentoRoot);
            return true;
        }
        return false;
    }

    public async toJSON(): Promise<any> {
        return {
            version: INDEX_VERSION,
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
            blocks: [],
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
            const env = await workspace.findFiles(new RelativePattern(this.workspaceFolder, '**/bin/magento'), '**/{tests,vendor}/**', 1);
            if (env.length > 0) {
                magentoRoot = magento.appendUri(env[0], '..', '..');
            } else {
                status.dispose();
                return undefined;
            }
        }

        // test if we have PHP available
        try {
            let { stdout, stderr } = await magento.exec(`${this.php} --version`, {});
            let lines = stdout.split('\n');
            if (lines.length > 0) {
                output.log(lines[0]);
            }

            const files = await workspace.findFiles(new RelativePattern(magentoRoot.fsPath, '**/{app,vendor}/**/registration.php'), '**/tests/**');
            const registrations =  PProgress.all(files.map(file => this.register.bind(this, file)), { concurrency: 5});
            registrations.onProgress(progress => status.text = statusText+Math.round(progress*100)+'%');
            await registrations;
        } catch(e) {
            output.log(e.message);
            output.log(`Looks like we don't have PHP executable available at '${this.php}'. Please set correct path in the extension settings.`)
            output.log(`Many features would be unavailable without access to PHP executable.`)
        }


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

            const blockFiles = await workspace.findFiles(new RelativePattern(registrations[componentName], '**/layout/*.xml'), '**/tests/**');
            for(const file of blockFiles) {
                this.paths.blocks.push(...await this.indexLayout(file, ExtentionKind.Module, componentName));
            }

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

            const blockFiles = await workspace.findFiles(new RelativePattern(registrations[componentName], '**/layout/*.xml'), '**/tests/**');
            for(const file of blockFiles) {
                this.paths.blocks.push(...await this.indexLayout(file, ExtentionKind.Theme, componentName));
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

    async indexLayout(uri: Uri, kind: ExtentionKind, componentName: string): Promise<BlockData[]> {
        const blocks: BlockData[] = [];
        const text = await magento.readFile(uri);
        const nodes: ElementNode[] = [
            ...getNodesByTag(text, 'block', 'tag'),
            ...getNodesByTag(text, 'container', 'tag'),
            ...getNodesByTag(text, 'referenceBlock', 'tag'),
            ...getNodesByTag(text, 'referenceContainer', 'tag')
        ];
        for (const node of nodes) {
            let name: string | undefined;
            let className: string | undefined;
            let templateName: string | undefined;
            let fullTemplateName: string = '';
            if (node.attributes) {
                for (const attribute of node.attributes) {
                    switch(attribute.tag) {
                        case 'name': name = attribute.text; break;
                        case 'class': className = attribute.text; break;
                        case 'template': templateName = attribute.text; break;
                    }
                }
            }
            if (templateName && templateName.match(/^.+::.+$/)) {
                fullTemplateName = templateName;
                templateName = templateName.split('::')[1];
            } else {
                fullTemplateName = `${componentName}::${templateName}`;
            }
            if (name) {
                blocks.push({
                    name,
                    uri,
                    filename: path.basename(uri.fsPath),
                    start: node.contentStart!,
                    end: node.contentEnd!,
                    kind,
                    type: node.tag,
                    componentName,
                    className: className || '',
                    templateName: templateName || '',
                    fullTemplateName,
                });
            }
        }
        return blocks;
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
