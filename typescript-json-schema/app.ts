/// <reference path="typings/typescript/typescript.d.ts" />

import * as ts from "typescript";
import {readFileSync} from "fs";
import * as glob from "glob"
 

function inspect(node: ts.Node, tc: ts.TypeChecker) {
    if (node.kind == ts.SyntaxKind.ClassDeclaration) {
        let clazz = <ts.ClassDeclaration>node;
        let clazzType = tc.getTypeAtLocation(clazz);
        let props = tc.getPropertiesOfType(clazzType);
        
        //props[0].getDocumentationComment()
        props.forEach(prop => {
            let propertyName = prop.getName();
            let propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            console.log(propertyName + " - " + tc.typeToString(propertyType));
        });
        
    } else {
        ts.forEachChild(node, (node) => inspect(node, tc));
    }
}


var files = glob("C:/Users/Yousef/Documents/Programming/tweetbeam-client/Beam/**/*.ts", { "sync": true });

let options: ts.CompilerOptions = { noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5};
let program = ts.createProgram(files, options);

var diagnostics = [
    ...program.getGlobalDiagnostics(),
    ...program.getDeclarationDiagnostics(),
    ...program.getSemanticDiagnostics()
];

diagnostics.forEach((diagnostic) => console.warn(diagnostic.messageText +" "+diagnostic.file.fileName +" "+diagnostic.start));
if (diagnostics.length == 0) {
    program.getSourceFiles().forEach(sourceFile => {
        if (sourceFile.fileName.indexOf("classic/Settings") > -1) {
            console.log(sourceFile.fileName);
            inspect(sourceFile, program.getTypeChecker());
        }
    });
}
debugger;

