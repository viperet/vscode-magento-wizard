//@ts-nocheck
import { workspace, TextEditor, Position, Range } from 'vscode';
import magento  from '../magento';
import Php from '../php';
import * as Parser from 'php-parser';

interface Insert {
    line: number;
    column: number;
    text: string;
}

/**
 * DI automation
 *
 * @param {TextEditor} textEditor
 * @param {string} className
 * @param {string} varName
 * @memberof Magento
 */
export default async function (textEditor: TextEditor, className: string, varName: string): Promise<void> {
    // strip $ from the variable name
    varName = varName.startsWith('$') ? varName.substring(1) : varName;
    let document = textEditor.document;
    let data = await magento.getUriData(document.uri);
    if (!data) {
        throw new Error('Not a Magento 2 extension file');
    }
    let ast = new Php();
    ast.parseCode(document.getText(), data.name+'.'+data.ext);
    let classNode = ast.findClass(data.name);
    if (!classNode) {
        throw new Error(`Can't find class '${data.name}'`);
    }
    let constructorNode = ast.findConstructor(classNode);

    let inserts: Insert[] = [];

    if (!constructorNode) {
        // TODO Add constructor to the class
        throw new Error(`Can't find constructor in the class '${data.name}'`);
    }

    // Adding argument to the constructor
    // TODO incorrectly added argument when constructor already have one argument in on the same line
    let previousArg: Parser.Parameter | undefined;
    if (constructorNode.arguments.length > 0) {
        // there are some arguments already
        for(var i = constructorNode.arguments.length-1; i >= 0; i--) {
            let arg = constructorNode.arguments[i];
            // skipping arguments with a default values
            if (!arg.value) {
                break;
            }
        }

        let indentation = magento.indentCode(textEditor, 2);
        if (i === -1) {
            // adding before first argument
            let constructorCode = document.getText(new Range(
                constructorNode.loc.start.line-1, constructorNode.loc.start.column,
                constructorNode.loc.end.line-1, constructorNode.loc.end.column
            ));
            let constructorOffset = document.offsetAt(new Position(constructorNode.loc.start.line-1, constructorNode.loc.start.column));
            let argsOffset = constructorCode.indexOf('(');
            let argsPosition = document.positionAt(constructorOffset + argsOffset + 1);
            inserts.push({
                line: argsPosition.line,
                column: argsPosition.character,
                text: `\n${indentation}${className} $${varName},\n${indentation}`,
            });
        } else if (i === constructorNode!.arguments.length-1) {
            // adding after the last argument
            let arg = previousArg = constructorNode!.arguments[i];
            // let indentation = document.getText(new Range(arg.loc.start.line-1, 0, arg.loc.start.line-1, arg.loc.start.column));
            inserts.push({
                line: arg.loc.end.line-1,
                column: arg.loc.end.column,
                text: `,\n${indentation}${className} $${varName}`,
            });
        } else {
            // adding before some argument
            previousArg = constructorNode!.arguments[i];
            let arg = constructorNode!.arguments[i+1];
            // let indentation = document.getText(new Range(arg.loc.start.line-1, 0, arg.loc.start.line-1, arg.loc.start.column));
            inserts.push({
                line: arg.loc.start.line-1,
                column: 0,
                text: `${indentation}${className} $${varName},\n`,
            });
        }
    } else {
        // there is no arguments yes, need to guess where to insert one
        let constructorCode = document.getText(new Range(
                constructorNode.loc.start.line-1, constructorNode.loc.start.column,
                constructorNode.loc.end.line-1, constructorNode.loc.end.column
            ));
        let constructorOffset = document.offsetAt(new Position(constructorNode.loc.start.line-1, constructorNode.loc.start.column));
        let argsOffset = constructorCode.indexOf('(');
        let argsPosition = document.positionAt(constructorOffset + argsOffset + 1);
        inserts.push({
            line: argsPosition.line,
            column: argsPosition.character,
            text: '\n'+magento.indentCode(textEditor, 2)+`${className} $${varName}\n`+magento.indentCode(textEditor, 1),
        });
    }

    // adding variable to the class
    let pos: Parser.Position;
    if (constructorNode.leadingComments) {
        pos = constructorNode.leadingComments[0].loc.start;
    } else {
        pos = constructorNode.loc.start;
    }
    let indent = magento.indentCode(textEditor, 1);
    var docblock = magento.docblock(textEditor, { params: [['@var', className]] });
    inserts.push({
        line: pos.line-1,
        column: 0,
        text: `${docblock}${indent}private $${varName};\n\n`,
    });

    // adding assignment to the constructor
    let assignmentPosition: Position | undefined;
    let statements = constructorNode.body.children;
    for(let statement of statements) {
        if (statement.kind === 'expressionstatement') {
            let expression = (statement as Parser.ExpressionStatement).expression;
            if (previousArg && expression.kind === 'assign') {
                expression = expression as Parser.Expression;
                if (
                    expression.left.kind === 'propertylookup' &&
                    expression.right.kind === 'variable' &&
                    expression.right.name as unknown as string === previousArg.name.name
                ) {
                    // found assignment of the previous argument
                    assignmentPosition = new Position(expression.loc.start.line, 0);
                    break;
                }
            }
        }
    }

    if (!assignmentPosition) {
        if (constructorNode.body.children.length > 0) {
            assignmentPosition = new Position(constructorNode.body.children[0].loc.start.line-1, 0);
        } else {
            assignmentPosition = new Position(constructorNode.body.loc.start.line, 0);
        }
    }
    inserts.push({
        line: assignmentPosition.line,
        column: assignmentPosition.character,
        text: magento.indentCode(textEditor, 2) + `$this->${varName} = $${varName};\n`,
    });
    try {
        var result = await textEditor.edit(editBuilder => {
            for(let insert of inserts) {
                editBuilder.insert(new Position(insert.line, insert.column), insert.text);
            }
        });
    } catch (e) {
        throw new Error('Can\'t apply edits');
    }
    if (!result) {
        throw new Error('Can\'t apply edits');
    }
}
