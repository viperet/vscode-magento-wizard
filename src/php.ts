import * as vscode from 'vscode';
import Engine, { Program, Block, Node, Method, Reference } from 'php-parser';

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

    resolveType(type: Reference): string {
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
    findClass(className: string, block?: Block | Node): Node | null {
        if (!block) {
            block = this.ast!;
        }
        if (block.kind === 'class' &&  block.name && block.name.name === className) {
            return block;
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
        if (block.kind === 'interface' &&  block.name && block.name.name === interfaceName) {
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
    findConstructor(classNode: Node): Method | null {
        if (!classNode.body) {
            return null;
        }
        for(let node of classNode.body) {
            if (node.kind === 'method' && node.name && node.name.name === '__construct') {
                return node as unknown as Method;
            }
        }
        return null;
    }

    async getMethods(className: string): Promise<ClassMethod[]>  {
        let methods: ClassMethod[] = [];
        let classNode = this.findClass(className) as any;
        if (!classNode) {
            classNode = this.findInterface(className) as any;
        }
        if (!classNode) {
            return [];
        }
        for (let item of classNode.body as any[]) {
            if (item.kind === 'method') {
                if (item.name) {
                    let methodVisibility: MethodVisibility;
                    switch(item.name.visibility) {
                        case 'protected': methodVisibility = MethodVisibility.protected; break;
                        case 'private': methodVisibility = MethodVisibility.private; break;
                        default: methodVisibility = MethodVisibility.public; break;
                    }
                    let parameters: MethodParameter[] = [];
                    for (let param of item.arguments) {
                        if (param.kind === 'parameter') {
                            parameters.push({
                                type: param.type ? this.resolveType(param.type) : '',
                                name: param.name.name,
                                value: param.value ? param.value.raw : '',
                            });
                        }
                    }
                    methods.push({
                        name: item.name.name,
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