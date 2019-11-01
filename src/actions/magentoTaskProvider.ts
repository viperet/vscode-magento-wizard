import * as path from 'path';
import * as vscode from 'vscode';

interface MagentoTaskDefinition extends vscode.TaskDefinition {
    /**
     * Command name
     */
    command: string;

    /**
     * Command arguments
     */
    args: string[];
}

export class MagentoTaskProvider implements vscode.TaskProvider {
    static MagentoScriptType: string = 'magento';
    private tasks: vscode.Task[] | undefined;

    // We use a CustomExecution task when state needs to be shared accross runs of the task or when
    // the task requires use of some VS Code API to run.
    // If you don't need to share state between runs and if you don't need to execute VS Code API in your task,
    // then a simple ShellExecution or ProcessExecution should be enough.
    // Since our build has this shared state, the CustomExecution is used below.
    private sharedState: string | undefined;

    constructor(private workspaceRoot: string) { }

    public async provideTasks(): Promise<vscode.Task[]> {
        return this.getTasks();
    }

    public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        const command: string = _task.definition.command;
        if (command) {
            const definition: MagentoTaskDefinition = <any>_task.definition;
            return this.getTask(command, definition.args ? definition.args : [], definition);
        }
        return undefined;
    }

    private getTasks(): vscode.Task[] {
        if (this.tasks !== undefined) {
            return this.tasks;
        }
        const commands: string[] = ['setup:upgrade', 'cache:clean', 'setup:static-content:deploy'];

        this.tasks = [];
        commands.forEach(command => {
                this.tasks!.push(this.getTask(command, []));
        });
        return this.tasks;
    }

    private getTask(command: string, args: string[], definition?: MagentoTaskDefinition): vscode.Task {
        if (definition === undefined) {
            definition = {
                type: MagentoTaskProvider.MagentoScriptType,
                command,
                args,
            };
        }
        return new vscode.Task(definition, vscode.TaskScope.Workspace, `${command} ${args.join(' ')}`,
            MagentoTaskProvider.MagentoScriptType, new vscode.ShellExecution(`php bin/magento ${command} ${args.join(' ')}`));
    }
}
