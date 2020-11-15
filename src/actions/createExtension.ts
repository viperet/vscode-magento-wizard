import { workspace, Uri, WorkspaceFolder } from 'vscode';
import * as output from '../output';
import magento  from '../magento';
const fs = workspace.fs;

/**
 * Creates new Magento 2 extension
 *
 * @param {string} vendor extension Vendor name
 * @param {string} extension extension name
 * @returns {Promise<Uri>} Uri of the created extension folder
 * @memberof Magento
 */
export default async function (vendor: string, extension: string): Promise<Uri> {
    const codeUri = await magento.getAppCodeUri();
    const extensionUri = magento.appendUri(codeUri, vendor, extension);
    const registrationPhpUri = magento.appendUri(extensionUri, 'registration.php');
    const composerJsonUri = magento.appendUri(extensionUri, 'composer.json');
    const moduleXmlUri = magento.appendUri(extensionUri, 'etc', 'module.xml');
    try {
        output.log(`Creating '${extensionUri.fsPath}'`);
        await fs.createDirectory(extensionUri);
        output.log(`Creating '${extensionUri.fsPath}'`);
        await fs.createDirectory(magento.appendUri(extensionUri, 'etc'));
    } catch (e){
        output.log(`Error creating extension folder: ${(e as Error).message}`);
        throw new Error('Error creating extension folder');
    }
    try {
        await fs.writeFile(
            registrationPhpUri,
            magento.encoder(require('../../templates/registration.php')({ vendor, extension }))
        );
        await fs.writeFile(
            moduleXmlUri,
            magento.encoder(require('../../templates/etc/module.xml')({ vendor, extension }))
        );
        await fs.writeFile(
            composerJsonUri,
            magento.encoder(require('../../templates/composer.handlebars')({ vendor, extension }))
        );
    } catch (e) {
        output.log(`Error creating extension files: ${(e as Error).message}`);
        throw new Error('Error creating extension files');
    }
    await workspace.openTextDocument(moduleXmlUri);
    magento.indexer[magento.folder.uri.fsPath].register(magento.appendUri(extensionUri, 'registration.php'));
    return extensionUri;
}
