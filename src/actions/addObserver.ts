import { workspace, FileType, window } from 'vscode';
import * as convert  from 'xml-js';
import eventsList from '../eventsList';
import magento, { ExtensionInfo }  from '../magento';
const fs = workspace.fs;

export default async function (extensionData: ExtensionInfo, eventName: string, observerName: string): Promise<void> {
    if (!workspace.workspaceFolders) {
        throw new Error('No open workspace');
    }
    let eventsXmlUri = magento.appendUri(extensionData.extensionUri, 'etc', 'events.xml');
    let observerPhpUri = magento.appendUri(extensionData.extensionUri, 'Observer',  ...(observerName+'.php').split('\\'));

    if (await magento.fileExists(observerPhpUri)) {
        throw new Error(magento.relativePath(observerPhpUri)+' already exists');
    }

    let stats;
    try {
        stats = await fs.stat(eventsXmlUri);
    } catch {
        // file not found
        let eventsXml = require('../../templates/etc/events.xml')(Object.assign({ eventName, observerName }, extensionData));
        magento.writeFile(eventsXmlUri, eventsXml);
    }
    if (stats) {
        if (stats.type !== FileType.File) {
            throw new Error(magento.relativePath(eventsXmlUri)+' is not a file');
        }
        let eventsXml = await magento.readFile(eventsXmlUri);
        try {
            var xml = convert.xml2js(eventsXml, {
                compact: false,
                alwaysChildren: true,
            });
        } catch (e) {
            console.log(e);
            throw new Error('Error parsing '+magento.relativePath(eventsXmlUri));
        }
        console.log(xml);
        let configNode;
        for (let element of xml.elements) {
            if (element.type === 'element' && element.name === 'config') {
                configNode = element;
            }
        }
        if (configNode) {
                configNode.elements.push({
                type: 'element',
                name: 'event',
                attributes: { name: eventName },
                elements: [{
                    type: 'element',
                    name: 'observer',
                    attributes: {
                        name: `${extensionData.vendor}_${extensionData.extension}_${observerName}`,
                        instance: `${extensionData.vendor}\\${extensionData.extension}\\Observer\\${observerName}`,
                    }
                }]
            });

            let eventsXml = convert.js2xml(xml, {
                spaces: magento.indentCode(window.activeTextEditor, 1),
                compact: false,
            });
            await magento.writeFile(eventsXmlUri, eventsXml);
        } else {
            throw new Error('Error parsing '+magento.relativePath(eventsXmlUri));
        }
    }

    let observerData = Object.assign({ data: eventsList[eventName].data }, await magento.getUriData(observerPhpUri));
    let observerPhp = require('../../templates/observer.php')(observerData);
    await magento.writeFile(observerPhpUri, observerPhp);
    await window.showTextDocument(observerPhpUri);
}
