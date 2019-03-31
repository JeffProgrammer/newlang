const fs = require('fs');
const Lexer = require('./lex');
const Parser = require('./parse');
const { VMContext } = require('./vm');

const contents = `
int a = 2;
const int b = 2;
return (a + b) * 3;
`;

console.log("Going to parse contents:", contents);

const lexer = new Lexer(contents);
lexer.lex();

console.log("RESULT:");
console.log(JSON.stringify(lexer.result, null, 1));

console.log("Parsing...");
const parser = new Parser(lexer.result);
const ast = parser.parse();

console.log("AST:");
console.log(JSON.stringify(ast, null, 3));

// Evaluate the code:
const context = new VMContext();
context.interpret(ast);
console.log("Context:", JSON.stringify(context, null, 3));