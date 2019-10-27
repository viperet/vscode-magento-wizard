import Engine, { Program, Block, Node, Method } from 'php-parser';

class Php {
    private parser: Engine;
    private ast: Program | undefined;

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

    getAliases(): { [alias: string]: string } {
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

}

export default Php;