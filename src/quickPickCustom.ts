import { window, QuickPickItem, QuickPickOptions } from 'vscode';

export interface QuickPickCustomOptons extends QuickPickOptions {
    /** Title of QuickPick */
    title?: string;
    /** Allow to enter custom value or pick existing from the list? */
    custom?: boolean;
    step?: number;
    totalSteps?: number;
    placeholder?: string;
}


export default function createQuickPickCustom(
        values:string[] | Thenable<string[]> | AsyncIterableIterator<string[]> | QuickPickItem[],
        options: QuickPickCustomOptons
    ): Promise<string> {
    let selection: Promise<string> = new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick();
        let items: QuickPickItem[] = [];
        quickPick.ignoreFocusOut = true;
        Object.assign(quickPick, options);
        if (options.custom) {
            quickPick.onDidChangeValue(value => {
                // @ts-ignore
                items = items.filter(item => !item.custom);
                if (value.trim() && items.length > 0 && !quickPick.items.find(item => item.label === value)) {
                    items.unshift({
                        label: value,
                        // @ts-ignore
                        custom: true,
                    });
                }
                quickPick.items = items;
            });
            quickPick.onDidAccept(() => {
                if(quickPick.value !== '') {
                    // New value entered
                    const value = quickPick.value;
                    quickPick.hide();
                    resolve(value);
                }
            });
        }
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
                quickPick.items = items = values.map((item: string) => ({ label: item }));
                quickPick.busy = false;
            }).catch(() => {
                reject();
                quickPick.hide();
            });
        // @ts-ignore
        } else if (typeof values[Symbol.asyncIterator] === 'function') {
            function processChunk(chunk: AsyncIterableIterator<string[]>) {
                chunk.next().then(data => {
                    items.push(...data.value.map((item: string) => ({ label: item })));
                    // remove duplicates
                    items = items.filter((item, index, self) => 
                        index === self.findIndex(t => (
                            t.label === item.label
                        ))
                    );
                    quickPick.items = items;
                    if (data.done || data.value.length === 0) {
                        quickPick.busy = false;
                    } else {
                        processChunk(chunk);
                    }
                });
            }
            quickPick.busy = true;
            processChunk(values as AsyncIterableIterator<string[]>);
            quickPick.onDidChangeValue(value => {
                const chunk = values as AsyncIterableIterator<string[]>;
                quickPick.busy = true;
                chunk.next(value as any).then(data => {
                    items.push(...data.value.map((item: string) => ({ label: item })));
                    // remove duplicates
                    items = items.filter((item, index, self) => 
                        index === self.findIndex(t => (
                            t.label === item.label
                        ))
                    );
                    quickPick.items = items;
                    quickPick.busy = false;
                });
            });            
        }
    });
    return selection;
}