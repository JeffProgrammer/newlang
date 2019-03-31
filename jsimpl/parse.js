const { Tokens } = require('./tokens');
const {
    StmtListNode,
    BinaryExprNode,
    CompExprNode,
    IFStmtNode,
    IntNode,
    FloatNode,
    VarAssignNode,
    VarNode,
} = require('./vm');

class VarData {
    constructor(is_const, type) {
        /** @type {boolean} */
        this.is_const = is_const;

        /** @type {number} */
        this.type = type;
    }
};

class Parser {
    constructor(tokenStream) {
        /**
         * @type {Array<{token: number, val: any, lineNumber: number}>}
         */
        this.tokens = tokenStream;

        this.currentToken = 0;

        /**
         * Key - the variable name
         * Value - data about that variable during parsing.
         * @type {Object.<string, VarData>} 
         * */
        this.variables = {};

        this.ast = null;
    }

    isType(tok) {
        return tok == Tokens.INT || 
               tok == Tokens.FLOAT || 
               tok == Tokens.STRING;
    }

    parse() {
        return this.statementList();
    }

    statementList() {
        let list = new StmtListNode();
        while (this.currentToken < this.tokens.length) {
            const stmt = this.statement();
            const {token, lineNumber} = this.tokens[this.currentToken++];
            if (token !== Tokens.SEMICOLON)
                throw new Error(`Missing semicolon on line ${lineNumber}`);

            list.append(stmt);
        }
        return list;
    }

    statement() {
        const { token, val, lineNumber } = this.tokens[this.currentToken];

        console.log("Evaluating statement beginning with:", val)

        if (token == Tokens.CONST || this.isType(token)) {
            return this.vardecl();
        }

        if (token == Tokens.RETURN) {
            return this.returnExpression();
        }

        if (token == Tokens.IF) {
            return this.ifStmt();
        }

        if (token == Tokens.IDENTIFIER) {
            if (this.currentToken + 1 < this.tokens.length && this.tokens[this.currentToken + 1].token === Tokens.ASSIGNMENT) {
                // Variable assignment.
                return this.varAssign();
            }
        }

        throw new Error(`Not a valid statement on line ${lineNumber}.`);
    }

    varAssign() {
        const ident = this.tokens[this.currentToken++];
        if (ident.token !== Tokens.IDENTIFIER) {
            throw new Error("Variable must be named!");
        }
        const var_name = ident.val;

        // TODO: += and friends.
        const eqToken = this.tokens[this.currentToken++];
        if (eqToken.token !== Tokens.ASSIGNMENT) {
            throw new Error("Trying to assign variable but not using = to assign.");
        }

        // Ok. First. Make sure that we actually exist as a variable.
        if (typeof this.variables[var_name] === 'undefined') {
            throw new Error(`Trying to assign variable ${var_name} but is not declared yet on line ${ident.lineNumber}`);
        }

        // Now, insure that we didn't declare with Const. If so, we can't reassign!
        if (this.variables[var_name].is_const) {
            throw new Error(`Trying to reassign constant variable ${var_name} on line ${ident.lineNumber}`);
        }

        const expr = this.expression();
        return new VarAssignNode(var_name, expr);
    }

    ifStmt() {
        const iftoken = this.tokens[this.currentToken++];
        if (iftoken.token !== Tokens.IF)
            throw new Error("Called ifStmt but does not have if.");

        const lparen = this.tokens[this.currentToken++];
        if (lparen.token !== Tokens.LPAREN)
            throw new Error("If statment missing (");

        const condition_expr = this.expression();

        const rparen = this.tokens[this.currentToken++];
        if (rparen.token !== Tokens.RPAREN)
            throw new Error("If statement missing closing )");

        const if_expr = this.statement();
        let else_expr = null;

        const semi = this.tokens[this.currentToken];
        if (semi.token !== Tokens.SEMICOLON) {
            throw new Error("Missing semicolon at end of if statement.");
        }
        console.log("Semi:", semi);

        if (this.currentToken + 1 < this.tokens.length) {
            const next = this.tokens[this.currentToken + 1];
            if (next.token === Tokens.ELSE) {
                this.currentToken += 2; // ';' 'else'
                else_expr = this.statement();
            }
        }
        
        return new IFStmtNode(condition_expr, if_expr, else_expr);
    }

    returnExpression() {
        const { token } = this.tokens[this.currentToken];
        if (token !== Tokens.RETURN)
            throw new Error("Not a return expression.");

        ++this.currentToken;
        return this.expression();
    }

    vardecl() {
        const { token } = this.tokens[this.currentToken];
        let is_const = false;
        if (token === Tokens.CONST) {
            // We're a constant. We have to be a variable then
            ++this.currentToken;

            const type_token = this.tokens[this.currentToken];
            if (!this.isType(type_token.token)) {
                throw new Error("Must have type for declaring a const.");
            }

            is_const = true;
        }

        // Get our type token.
        const type_token = this.tokens[this.currentToken++];
  
        const the_var = this.tokens[this.currentToken++];
        if (the_var.token !== Tokens.IDENTIFIER) {
            throw new Error("After a type is declared, must have a var.");
        }

        // Before we even try to assign, we need to see if we've already
        // declared this variable. If we have, we can't redeclare.
        if (typeof this.variables[the_var.val] !== 'undefined') {
            throw new Error(`Already declared variable ${the_var.val} cannot redeclare.`);
        }

        // Must be assign
        const assign_token = this.tokens[this.currentToken++];
        if (assign_token.token !== Tokens.ASSIGNMENT) {
            throw new Error("Must assign variable...");
        }

        const expr = this.expression();

        // store it so our parser knows we can't reassign, as well as meta data for
        // further compiler analysis.
        this.variables[the_var.val] = new VarData(is_const, type_token.token);

        return new VarAssignNode(the_var.val, expr);
    }

    expression() {
        return this.conditionalExpression();
    }

    conditionalExpression() {
        const left = this.addition();

        const { token } = this.tokens[this.currentToken];
        if (token == Tokens.EQ || token === Tokens.NOTEQ) {
            ++this.currentToken;
            const right = this.conditionalExpression();
            return new CompExprNode(left, token, right);
        }

        return left;
    }

    addition() {
        const left = this.multiplication();

        const { token } = this.tokens[this.currentToken];
        if (token === Tokens.PLUS || token === Tokens.MINUS) {
            ++this.currentToken;
            const right = this.addition();
            return new BinaryExprNode(left, token, right);
        }

        return left;
    } 

    multiplication() {
        const left = this.parens();

        const { token } = this.tokens[this.currentToken];
        if (token === Tokens.MUL || token === Tokens.DIV || token === Tokens.MOD) {
            ++this.currentToken;
            const right = this.multiplication();
            return new BinaryExprNode(left, token, right);
        }

        return left;
    }

    parens() {
        const { token } = this.tokens[this.currentToken];
        if (token == Tokens.LPAREN) {
            ++this.currentToken;

            const expr = this.expression();

            // Ensure we have a right paren
            const r = this.tokens[this.currentToken++];
            if (r.token !== Tokens.RPAREN) {
                throw new Error("Missing ) on expression.");
            }

            return expr;
        } else {
            // Should be just a literal.
            return this.literal();
        }
    }

    literal() {
        const {token, val, lineNumber} = this.tokens[this.currentToken++];
        if (token === Tokens.INTEGER_VAL)
            return new IntNode(val);
        if (token === Tokens.FLOAT_VAL)
            return new FloatNode(val);
        if (token === Tokens.IDENTIFIER) {
            // See if our variable was previously declared.
            // If it doesn't, then we can't perform lookup on it
            if (typeof this.variables[val] === 'undefined') {
                throw new Error(`Variable ${val} was used but not declared yet on line ${lineNumber}.`);
            }
            return new VarNode(val);
        }
        throw new Error(`Was not either an int, float or variable. Value was: ${val}`);
    }
};

module.exports = Parser;