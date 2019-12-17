import { OutputChannel, window } from "vscode";

let ch: OutputChannel;
ch = window.createOutputChannel('MagentoWizard');

export function log(...args: any[]): void {
    ch.appendLine(args.map(arg => String(arg)).join(' '));
}

export function debug(...args: any[]): void {
    log(...args);
}

export function dispose() {
    ch.dispose();
}