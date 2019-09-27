import { window } from 'vscode';




export default function createQuickPickCustom(title: string, values:string[] | Promise<string[]>): Promise<string> {
    let selection: Promise<string> = new Promise((resolve, reject) => {
		const quickPick = window.createQuickPick();
		quickPick.title = title;
		quickPick.onDidAccept(() => {
			if(quickPick.value !== '') {
				// New value entered
				const value = quickPick.value;
				quickPick.hide();
                resolve(value);
			}
		});
		quickPick.onDidChangeSelection(selection => {
			if (selection.length === 1) {
				// Value selected from the list
				const value = selection[0].label;
                quickPick.hide();
                resolve(value);
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
        if (typeof values === 'string') {
            quickPick.items = values;
        } else if (values instanceof Promise) {
            quickPick.busy = true;
            values.then(items => {
                quickPick.items = items.map(item => { return { label: item };});
                quickPick.busy = false;
            }).catch(() => {
                reject();
                quickPick.hide();
            });
        }
    });
    return selection;
}