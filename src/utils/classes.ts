import * as path from 'path';
import * as fs from 'fs';
import Ast from '../ast';

function fromDir(startPath: string, filter: RegExp, callback: (filename: string) => void ){
    if (!fs.existsSync(startPath)){
        console.error("no dir ",startPath);
        return;
    }

    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            fromDir(filename,filter,callback); //recurse
        }
        else if (filter.test(filename)) {
            callback(filename);
        }
    }
}

let classes  = new Map();
let ast = new Ast();
let progress: Promise<void>[] = [];


fromDir(process.argv[2], /\.php$/, (filename) => {
    console.error('Processing  ' + filename);
    let contents = fs.readFileSync(filename, 'utf8');

    ast.parseCode(contents, filename);
    let className = path.basename(filename, '.php');
    let classNode = ast.findClass(className);
    try {
        var aliases = ast.getAliases();
        if (classNode) {
            let constructorNode = ast.findConstructor(classNode);
            if (constructorNode && constructorNode.arguments.length > 0) {
                for(let arg of constructorNode.arguments) {
                    if (arg.type && arg.type.kind === 'classreference') {
                        let argClassName = arg.type.name;
                        let classPath = argClassName.split('\\');
                        if (arg.type.resolution !== 'fqn' && aliases[classPath[0]]) {
                            classPath[0] = aliases[classPath[0]];
                            argClassName = classPath.join('\\');
                        }
                        if (argClassName.startsWith('\\')) {
                            if (classes.has(argClassName) ) {
                                classes.set(argClassName, classes.get(argClassName) + 1);
                            } else {
                                classes.set(argClassName, 1);
                            }
                        } else {
                            console.error(`Wrong class ${argClassName} in ${filename}`);
                        }
                    }
                }
            }
        }
    } catch(e) {
        console.error(`Error in ${filename}: `, e);
    }
});

let classesArray: string[] = Array.from(classes.keys());
classesArray.sort((a, b) => {
    return -(classes.get(a) - classes.get(b));
});

console.log('export default [');
for(let i = 0; i< classesArray.length;i++) {
    let className = classesArray[i];
    console.log(`    '${className.replace(/\\/g, '\\\\')}'${i === classesArray.length-1 ? '' : ','}`);
}
console.log('];');
