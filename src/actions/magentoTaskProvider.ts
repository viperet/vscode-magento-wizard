import * as path from 'path';
import * as vscode from 'vscode';
import * as cp from 'child_process';
import magento from '../magento';
import * as fs from 'fs';

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
    private php: string;
    private user: string;

    private sharedState: string | undefined;

    constructor(private workspaceFolder: vscode.WorkspaceFolder) {
        this.php = vscode.workspace.getConfiguration('', this.workspaceFolder.uri).get('magentoWizard.tasks.php') || 'php';
        this.user = vscode.workspace.getConfiguration('', this.workspaceFolder.uri).get('magentoWizard.tasks.user') || '';
    }

    public async provideTasks(): Promise<vscode.Task[]> {
        return await this.getTasks();
    }

    public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        const command: string = _task.definition.command;
        if (command) {
            const definition: MagentoTaskDefinition = <any>_task.definition;
            return this.getTask(command, definition.args ? definition.args : [], definition);
        }
        return undefined;
    }

    private async getTasks(): Promise<vscode.Task[]> {
        if (this.tasks !== undefined) {
            return this.tasks;
        }
        if (!magento.fileExists(magento.appendUri(this.workspaceFolder.uri, 'bin/magento'))) {
            // if there is no bin/magento in this workspace folder - return no tasks
            return [];
        }
        let commandLine = (this.user ? `sudo -u ${this.user} ` : '') + `${this.php} bin/magento --no-ansi`;
        this.tasks = [];
        try {
            let { stdout, stderr } = await exec(commandLine, { cwd: this.workspaceFolder.uri.fsPath });
            if (stdout) {
                let lines = stdout.split(/\r{0,1}\n/);
                let matchCommands = false;
                for (let line of lines) {
                    if (line.length === 0) {
                        continue;
                    }
                    if (line.match(/Available commands/)) {
                        matchCommands = true;
                    }

                    if (matchCommands) {
                        let matches = line.match(/^\s\s(?<command>.*?)\s/);
                        if (matches && matches.groups) {
                            this.tasks!.push(this.getTask(matches.groups.command, []));
                        }
                    }
                }
            }
        } catch (err) {
        }
        return this.tasks;
    }

    public getTask(command: string, args: string[], definition?: MagentoTaskDefinition): vscode.Task {
        if (definition === undefined) {
            definition = {
                type: MagentoTaskProvider.MagentoScriptType,
                command,
                args,
                problemMatcher: ['$magento'],
            };
        }
        const commandLine = (this.user ? `sudo -u ${this.user} ` : '') + `${this.php} bin/magento ${command} ${args.join(' ')}`;
        const task = new vscode.Task(
            definition,
            this.workspaceFolder,
            `${command} ${args.join(' ')}`,
            MagentoTaskProvider.MagentoScriptType,
            new vscode.ShellExecution(commandLine, { cwd: this.workspaceFolder.uri.fsPath }),
            ['$magento']
        );
        task.presentationOptions = {
            echo: true,
            focus: true,
            showReuseMessage: false,
            clear: true,
        }
        return task;
    }
}

export function exec(command: string, options: cp.ExecOptions): Promise<{ stdout: string; stderr: string }> {
	return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
		cp.exec(command, options, (error, stdout, stderr) => {
			if (error) {
				reject({ error, stdout, stderr });
			}
			resolve({ stdout, stderr });
		});
	});
}
