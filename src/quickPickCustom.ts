import { window, QuickPickItem } from 'vscode';




export default function createQuickPickCustom(title: string, values:string[] | Promise<string[]> | QuickPickItem[]): Promise<string> {
    let selection: Promise<string> = new Promise((resolve, reject) => {
		const quickPick = window.createQuickPick();
        let items: QuickPickItem[];
		quickPick.title = title;
		quickPick.onDidChangeValue(value => {
            // @ts-ignore
            items = items.filter(item => !item.custom);
            if (value.trim() && !quickPick.items.find(item => item.label === value)) {
                items.unshift({
                    label: value,
                    // @ts-ignore
                    custom: true,
                });
                quickPick.items = items;
            }
        });
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
        if (values instanceof Array) {
            if (values.length > 0 && typeof values[0] === 'string') {
                // @ts-ignore
                quickPick.items = items = values.map(item => ({ label: item }));
            } else {
                // @ts-ignore
                quickPick.items = items = values;
            }
        } else if (values instanceof Promise) {
            quickPick.busy = true;
            values.then(values => {
                quickPick.items = items = values.map(item => ({ label: item }));
                quickPick.busy = false;
            }).catch(() => {
                reject();
                quickPick.hide();
            });
        }
    });
    return selection;
}