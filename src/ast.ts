import Engine, { Program, Block, Node, Method } from 'php-parser';

class Ast {
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
     * @memberof Ast
     */
    parseCode(code: string, filename: string): Program {
        this.ast = this.parser.parseCode(code, filename);
        return this.ast;
    }

    /**
     * Finds node corresponding to the class with given name
     *
     * @param {string} className
     * @param {(Block | Node)} [block]
     * @returns {(Node | null)}
     * @memberof Ast
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
     * @memberof Ast
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

export default Ast;