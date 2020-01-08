import { window, QuickPickItem, QuickPickOptions, WorkspaceFolder } from 'vscode';

interface WorkspaceFolderItem extends QuickPickItem {
    folder: WorkspaceFolder;
}

interface WorkspacePickOptons extends QuickPickOptions {
    /** Title of QuickPick */
    title?: string;
    step?: number;
    totalSteps?: number;
    placeholder?: string;
}


export default function createWorkspacePick(
    values: WorkspaceFolder[],
    options: WorkspacePickOptons = {}
): Promise<WorkspaceFolder> {
let selection: Promise<WorkspaceFolder> = new Promise((resolve, reject) => {
    const quickPick = window.createQuickPick<WorkspaceFolderItem>();
    quickPick.items = values.map(folder => {
        return {
            folder,
            label: folder.name,
            detail: folder.uri.fsPath,
        };
    });
    quickPick.ignoreFocusOut = true;
    Object.assign(quickPick, options);
    quickPick.onDidChangeSelection(selection => {
        if (selection.length === 1) {
            // Value selected from the list
            const value = selection[0].folder;
            quickPick.hide();
            resolve(value);
        }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
});
return selection;
}