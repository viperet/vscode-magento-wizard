import { workspace, Uri, FileType, TextDocument, TextEditor, Position, Range, WorkspaceFolder, DocumentLink, window, QuickPickItem, SnippetString, RelativePattern } from 'vscode';
import magento, { ExtensionInfo }  from '../magento';
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
    const codeUri = magento.getAppCodeUri();
    const extensionUri = magento.appendUri(codeUri, vendor, extension);
    const registrationPhpUri = magento.appendUri(extensionUri, 'registration.php');
    const composerJsonUri = magento.appendUri(extensionUri, 'composer.json');
    const moduleXmlUri = magento.appendUri(extensionUri, 'etc', 'module.xml');
    try {
        await fs.createDirectory(extensionUri);
        await fs.createDirectory(magento.appendUri(extensionUri, 'etc'));
    } catch {
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
        console.log(e);
        throw new Error('Error creating extension files');
    }
    await workspace.openTextDocument(moduleXmlUri);
    return extensionUri;
}
