import { workspace, FileType, window } from 'vscode';
import * as convert  from 'xml-js';
import * as Case from 'case';
import magento, { ExtensionInfo }  from '../magento';
import { ClassMethod } from '../php';
const fs = workspace.fs;
export default async function (extensionData: ExtensionInfo, className: string, method: ClassMethod, pluginType: string, pluginName: string): Promise<void> {
    const pluginData = { className: className.replace(/^\\/, ''), method, pluginType, pluginName };

    if (!workspace.workspaceFolders) {
        throw new Error('No open workspace');
    }
    let diXmlUri = magento.appendUri(extensionData.extensionUri, 'etc', 'di.xml');
    let pluginPhpUri = magento.appendUri(extensionData.extensionUri, 'Plugin',  ...(pluginName+'.php').split('\\'));

    if (await magento.fileExists(pluginPhpUri)) {
        throw new Error(magento.relativePath(pluginPhpUri)+' already exists');
    }

    if (!await magento.fileExists(diXmlUri)) {
        // file not found
        let eventsXml = require('../../templates/etc/di.xml')(Object.assign(pluginData, extensionData));
        await magento.writeFile(diXmlUri, eventsXml);
    } else {
        let diXml = await magento.readFile(diXmlUri);
        try {
            var xml = convert.xml2js(diXml, {
                compact: false,
                alwaysChildren: true,
            });
        } catch (e) {
            console.log(e);
            throw new Error('Error parsing '+magento.relativePath(diXmlUri));
        }
        let configNode;
        if (!xml.elements) {
            xml = {
                "declaration": {
                    "attributes":
                    { "version": "1.0" }
                },
                "elements": [
                    { "type": "element", "name": "config", "attributes": { "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance", "xsi:noNamespaceSchemaLocation": "urn:magento:framework:ObjectManager/etc/config.xsd" }, "elements": [] }
                ]
            };
        }
        for (let element of xml.elements) {
            if (element.type === 'element' && element.name === 'config') {
                configNode = element;
            }
        }
        if (configNode) {
                configNode.elements.push({
                type: 'element',
                name: 'type',
                attributes: { name: pluginData.className },
                elements: [{
                    type: 'element',
                    name: 'plugin',
                    attributes: {
                        name: Case.snake(pluginName.replace(/[^a-zA-Z0-9]+/g, '')),
                        type: `${extensionData.vendor}\\${extensionData.extension}\\Plugin\\${pluginName}`,
                        sortOrder: 1,
                        disabled: false,
                    }
                }]
            });

            let diXml = convert.js2xml(xml, {
                spaces: magento.indentCode(window.activeTextEditor, 1),
                compact: false,
            });
            await magento.writeFile(diXmlUri, diXml);
        } else {
            throw new Error('Error parsing '+magento.relativePath(diXmlUri));
        }
    }

    let pluginPhp = require('../../templates/plugin.php')(Object.assign(pluginData, await magento.getUriData(pluginPhpUri)));
    await magento.writeFile(pluginPhpUri, pluginPhp);
    await window.showTextDocument(pluginPhpUri);
}
