import { workspace, WorkspaceFolder, tasks, ConfigurationTarget, TaskPanelKind, TaskExecution, extensions, window } from 'vscode';
import * as convert  from 'xml-js';
import magento from '../magento';
import { MagentoTaskProvider, exec } from './MagentoTaskProvider';

const catalogOldFilename = '.vscode/catalog_tmp.xml';
const catalogNewFilename = '.vscode/catalog.xml';
let redhatXmlInstalled = !!extensions.getExtension('redhat.vscode-xml');

export default async function (workspaceFolder: WorkspaceFolder) {
    const response = await window.showInformationMessage(
        'This command will generate XML catalog'+
        ' with Magento 2 XML DTDs, which can be used for validation and completition in various XML configuration files.\n'+
        'Do you want to continue?',
        { modal: true },
        'Yes', 'Install XML extension');

    if (response === 'Install XML extension') {
        try {
            let { stdout, stderr } = await exec('code --install-extension redhat.vscode-xml', {});
            console.log(stdout, stderr);
            window.showInformationMessage(stdout, { modal: true });
            redhatXmlInstalled = !!extensions.getExtension('redhat.vscode-xml');
        } catch {
            window.showInformationMessage('Error while installing Redhat XML extension, you can try to install it manually.', { modal: true });
        }
    } else if ( !response ) {
        return;
    }
    // TODO Create .vscode folder if not exists in workspaceFolder
    const taskProvider = new MagentoTaskProvider(workspaceFolder);
    const catalogTask = taskProvider.getTask('dev:urn-catalog:generate', [catalogOldFilename]);
    let taskExecution: TaskExecution;
    let token = tasks.onDidEndTask(endTask => {
        if (endTask.execution === taskExecution) {
            token.dispose();
            convertCatalog(workspaceFolder);
        }
    });

    try {
        taskExecution = await tasks.executeTask(catalogTask);
    } catch (e) {
        console.error(e);
        throw new Error('Error executing '+catalogTask.name);
    }

}

async function convertCatalog(workspaceFolder: WorkspaceFolder) {
    let xmlCatalog: any = {
        _declaration: { _attributes: { version: '1.0' } },
        catalog: {
            _attributes: { xmlns: 'urn:oasis:names:tc:entity:xmlns:xml:catalog' },
            system: [],
        }
    };
    const catalogOldUri = magento.appendUri(workspaceFolder.uri, catalogOldFilename);
    const catalogOldXml = await magento.readFile(catalogOldUri);
    try {
        var xml = convert.xml2js(catalogOldXml, {
            compact: true,
            alwaysChildren: true,
        }) as any;
    }
    catch (e) {
        console.error(e);
        throw new Error('Error parsing ' + catalogOldFilename);
    }
    if (xml && xml.project && xml.project.component) {
        for (let component of xml.project.component) {
            if (component.resource) {
                for (let resource of component.resource) {
                    xmlCatalog.catalog.system.push({
                        _attributes: {
                            systemId: resource._attributes.url,
//                            uri: workspace.asRelativePath(resource._attributes.location),
                            uri: resource._attributes.location,
                        }
                    });
                }
            }
        }
    }
    console.log(xmlCatalog);
    const catalogNewUri = magento.appendUri(workspaceFolder.uri, catalogNewFilename);
    const catalogXml = convert.js2xml(xmlCatalog, {
        spaces: 4,
        compact: true,
    });
    await magento.writeFile(catalogNewUri, catalogXml);
    await workspace.fs.delete(catalogOldUri);

    // adding catalog.xml to XML extension config
    const config = workspace.getConfiguration('', workspaceFolder.uri);
    let catalogs: string[] | undefined = config.get('xml.catalogs', []);
    if (catalogs && catalogs.length > 0) {
        // remove old value from the list
        catalogs = catalogs.filter(catalog => catalog !== catalogNewFilename);
    }
    else {
        catalogs = [];
    }
    catalogs.push(catalogNewFilename);
    if (redhatXmlInstalled) {
        await config.update('xml.catalogs', catalogs, ConfigurationTarget.Workspace);
        window.showInformationMessage(`Path to the generated XML catalog file (${catalogNewFilename}) was added to the XML extension configuration. Now you can enjoy Intellisense in Magento 2 XML configs.`, { modal: true });
    } else {
        window.showInformationMessage(`XML catalog file was generated (${catalogNewFilename}), you should install XML extension and add catalog file to it manually`, { modal: true });
    }
}
