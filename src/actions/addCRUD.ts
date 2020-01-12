import { workspace, FileType, window } from 'vscode';
import * as convert  from 'xml-js';
import * as Case from 'case';
import magento, { ExtensionInfo, UriData }  from '../magento';

const collectionTemplate = require('../../templates/resource_collection_model.php');
const resourceModelTemplate = require('../../templates/resource_model.php');
const modelTemplate = require('../../templates/model.php');

export default async function (extensionData: ExtensionInfo, modelName: string, tableName: string): Promise<void> {
    const modelUri = magento.appendUri(extensionData.extensionUri, 'Model', ...(modelName+'.php').split('\\').filter(Boolean));
    const resourceModelUri = magento.appendUri(extensionData.extensionUri, 'Model', 'ResourceModel', ...(modelName+'.php').split('\\').filter(Boolean));
    const collectionUri = magento.appendUri(extensionData.extensionUri, 'Model', 'ResourceModel', ...(modelName).split('\\').filter(Boolean), 'Collection.php');
    const data = {
        table_name: tableName,
        entity_id: 'entity_id', // primary key name
        modelName: modelName,
    };

    await magento.createWithTemplate(modelUri, modelTemplate, data);
    await magento.createWithTemplate(resourceModelUri, resourceModelTemplate, data);
    await magento.createWithTemplate(collectionUri, collectionTemplate, data);


    await window.showTextDocument(await workspace.openTextDocument(resourceModelUri));
    await window.showTextDocument(await workspace.openTextDocument(modelUri));
    await window.showTextDocument(await workspace.openTextDocument(collectionUri));

    return;
}


