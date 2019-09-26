import { window, workspace, Uri, FileType } from 'vscode';
import { posix } from 'path';
import * as Handlebars from 'handlebars';

const fs = workspace.fs;

import { TextEncoder } from 'util';

class Magento {
    registrationTemplate: Handlebars.TemplateDelegate;
    moduleTemplate: Handlebars.TemplateDelegate;
    encoder: TextEncoder;

    constructor() {
        this.registrationTemplate = require('../templates/registration.php');
        this.moduleTemplate = require('../templates/module.xml');
        this.encoder = new TextEncoder();
    }

    /**
     * Appends path components to the end of the Uri
     *
     * @private
     * @param {Uri} uri
     * @param {...string[]} args path components to append
     * @returns {Uri} modified Uri object
     * @memberof Magento
     */
    private appendUri(uri: Uri, ...args: string[]): Uri {
        return uri.with({ path: posix.join(uri.path, ...args) });
    }

    /**
     * Returns Uri of the Magento 2 /app/code folder
     *
     * @returns {Uri}
     * @memberof Magento
     */
    getAppCodeUri(): Uri {
        const rootUri = workspace.workspaceFolders![0].uri;
        return this.appendUri(rootUri, 'app', 'code');
    }

    /**
     * Returns list of existing Vendors
     *
     * @returns {string[]}
     * @memberof Magento
     */
    async getVendors(): Promise<string[]> {
        const codeUri = this.getAppCodeUri();
        const dir = await fs.readDirectory(codeUri);

        return dir
            .filter(entry => { return entry[1] === FileType.Directory; })
            .map(entry => { return entry[0]; });
    }

    async createExtension(vendor: string, extension: string): Promise<Uri> {
        const result = new Promise<Uri>(async (resolve, reject) => {
            const codeUri = this.getAppCodeUri();
            const extensionUri = this.appendUri(codeUri, vendor, extension);
            try {
                await fs.createDirectory(extensionUri);
                await fs.createDirectory(this.appendUri(extensionUri, 'etc'));
            } catch {
                reject('Error creating extension folder');
            }
            await fs.writeFile(
                this.appendUri(extensionUri, 'registration.php'),
                this.encoder.encode(this.registrationTemplate({ vendor, extension }))
            );
            await fs.writeFile(
                this.appendUri(extensionUri, 'etc', 'module.xml'),
                this.encoder.encode(this.moduleTemplate({ vendor, extension }))
            );
        });
        return result;
    }
}


export default new Magento();