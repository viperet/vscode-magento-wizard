import * as vscode from 'vscode';
import {Engine, Program, Block, Node, Method, Reference, Class, Identifier, Interface, Name } from 'php-parser';

export enum MethodVisibility { public, private, protected }
export interface MethodParameter {
    type: string;
    name: string;
    value: string;
}
export interface ClassMethod {
    name: string;
    parameters: MethodParameter[];
    returnType?: string;
    visibility: MethodVisibility;
}
export type NamespaceAliases = { [alias: string]: string };

class Php {
    private parser: Engine;
    private ast: Program | undefined;
    private aliases: NamespaceAliases | undefined;

    constructor() {
        this.parser = new Engine({
            parser: {
                extractDoc: true,
            },
            ast: {
                withPositions: true
            }
        });
    }

    /**
     * Parses PHP code string into Abstract Syntax Tree
     *
     * @param {string} code PHP code
     * @param {string} filename PHP file name
     * @returns {Program}
     * @memberof Php
     */
    parseCode(code: string, filename: string): Program {
        this.ast = this.parser.parseCode(code, filename);
        return this.ast;
    }

    getAliases(): NamespaceAliases {
        let aliases: { [alias: string]: string } = {};
        if (
            this.ast &&
            this.ast.children &&
            this.ast.children[0] &&
            (this.ast.children[0] as Block).children
        ) {
            let uses = (this.ast.children[0] as Block).children.filter(block => { return block.kind ===  'usegroup'; });
            for(let usegroup of uses) {
                for(let useitem of (usegroup as any).items) {
                    let alias;
                    if (useitem.alias) {
                        alias = useitem.alias.name;
                    } else {
                        alias = useitem.name.split('\\').pop();
                    }
                    if (useitem.name.startsWith('\\')) {
                        aliases[alias] = useitem.name;
                    } else {
                        aliases[alias] = '\\' + useitem.name;
                    }
                }
            }
        }
        return aliases;
    }

    resolveType(type: Name): string {
        if (!this.aliases) {
            this.aliases = this.getAliases();
        }
        let argClassName = type.name;
        let classPath = argClassName.split('\\');
        if (type.resolution !== 'fqn' && this.aliases[classPath[0]]) {
            classPath[0] = this.aliases[classPath[0]];
            argClassName = classPath.join('\\');
        }
        return argClassName;
    }

    /**
     * Finds node corresponding to the class with given name
     *
     * @param {string} className
     * @param {(Block | Node)} [block]
     * @returns {(Node | null)}
     * @memberof Php
     */
    findClass(className: string, block?: Block | Node): Class | null {
        if (!block) {
            block = this.ast!;
        }
        if (block.kind === 'class' && (block as Class).name && ((block as Class).name as Identifier).name === className) {
            return block as Class;
        } else if ('children' in block && (block.kind === 'program' || block.kind === 'namespace')) {
            for(let i = 0; i < block.children.length; i++) {
                let node = this.findClass(className, block.children[i]);
                if (node) {
                    return node;
                }
            }
        }
        return null;
    }

    /**
     * Finds node corresponding to the interface with given name
     *
     * @param {string} interfaceName
     * @param {(Block | Node)} [block]
     * @returns {(Node | null)}
     * @memberof Php
     */
    findInterface(interfaceName: string, block?: Block | Node): Node | null {
        if (!block) {
            block = this.ast!;
        }
        if (block.kind === 'interface' &&  (block as Interface).name && ((block as Interface).name as Identifier).name === interfaceName) {
            return block;
        } else if ('children' in block && (block.kind === 'program' || block.kind === 'namespace')) {
            for(let i = 0; i < block.children.length; i++) {
                let node = this.findInterface(interfaceName, block.children[i]);
                if (node) {
                    return node;
                }
            }
        }
        return null;
    }

    /**
     * Finds constructor node of the given class node
     *
     * @param {Node} classNode
     * @returns {(Method | null)}
     * @memberof Php
     */
    findConstructor(classNode: Class): Method | null {
        if (!classNode.body) {
            console.log('Class body is empty');
            return null;
        }
        // console.log('class', classNode);
        for(let node of classNode.body) {
            if (node.kind === 'method') {
                if (node.name && (node.name as Identifier).name === '__construct') {
                    console.log('Node:',node);
                    return node as unknown as Method;
                }
            }
        }
        console.log('Constructor not found');
        return null;
    }

    async getMethods(className: string): Promise<ClassMethod[]>  {
        let methods: ClassMethod[] = [];
        let classNode = this.findClass(className);
        if (!classNode) {
            classNode = this.findInterface(className) as any;
        }
        if (!classNode) {
            return [];
        }
        for (let item of classNode.body as any[]) {
            if (item.kind === 'method') {
                let method = item as Method;
                if (method.name) {
                    let methodVisibility: MethodVisibility;
                    switch((method.name as any).visibility) {
                        case 'protected': methodVisibility = MethodVisibility.protected; break;
                        case 'private': methodVisibility = MethodVisibility.private; break;
                        default: methodVisibility = MethodVisibility.public; break;
                    }
                    let parameters: MethodParameter[] = [];
                    for (let param of method.arguments) {
                        if (param.kind === 'parameter') {
                            parameters.push({
                                type: param.type ? this.resolveType(param.type as Name) : '',
                                name: (param.name as Identifier).name,
                                value: param.value ? (param.value as any).raw : '',
                            });
                        }
                    }
                    methods.push({
                        name: (method.name as Identifier).name,
                        visibility: methodVisibility,
                        parameters
                    });
                }
            }
        }
        return methods;
    }

}

export default Php;

export const reservedWords: string[] = ['__halt_compiler', 'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 'const', 'continue', 'declare', 'default', 'die',
'do', 'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final', 'for', 'foreach', 'function', 'global',
'goto', 'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 'list', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public', 'require',
'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'int', 'float', 'bool', 'string', 'true', 'false', 'null', 'void', 'iterable',
'object', 'resource', 'mixed', 'numeric'];
