const { Tokens } = require('./tokens');

class VMContext {
    constructor() {
        /** @type {Object.<string, any>} */
        this.variables = {};

        this.result = null;
    }

    interpret(ast) {
        this.result = ast.interpret(this);
    }
};

class ASTNode {
    constructor() {
    }

    interpret(vm) {
    }
};

class StmtListNode extends ASTNode {
    constructor() {
        super();

        /** @param {Array<ASTNode>} */
        this.statements = [];
    }

    /**
     * @param {ASTNode} node 
     */
    append(node) {
        this.statements.push(node);
    }

    interpret(vm) {
        let ret = null;
        for (const node of this.statements)
            ret = node.interpret(vm);
        return ret;
    }
}

class BinaryExprNode extends ASTNode {
    constructor(left, op, right) {
        super(null);

        /** @type {ASTNode} */
        this.left = left;

        /** @type {number} */
        this.op = op;

        /** @type {ASTNode} */
        this.right = right;
    }

    interpret(vm) {
        const left = this.left.interpret(vm);
        const right = this.right.interpret(vm);
        
        switch (this.op) {
            case Tokens.PLUS:
                return left + right;
            case Tokens.MINUS:
                return left - right;
            case Tokens.MUL:
                return left * right;
            case Tokens.DIV:
                return left / right;
            case Tokens.MOD:
                return left % right;
        }
    }
}

class CompExprNode extends BinaryExprNode {
    constructor(left, op, right) {
        super(left, op, right);
    }

    interpret(vm) {
        const left = this.left.interpret(vm);
        const right = this.right.interpret(vm);

        switch (this.op) {
            case Tokens.EQ:
                return left == right;
            case Tokens.NOTEQ:
                return left != right;
        }
    }
}

class IFStmtNode extends ASTNode {
    constructor(cond, if_expr, else_expr) {
        super();
        this.condition = cond;
        this.if_expr = if_expr;
        this.else_expr = else_expr;
    }

    interpret(vm) {
        if (this.condition.interpret(vm)) {
            this.if_expr.interpret(vm);
        } else {
            if (this.else_expr !== null) {
                this.else_expr.interpret(vm);
            }
        }
    }
}

class IntNode extends ASTNode {
    constructor(int) {
        super();
        this.value = Number(int);
    }

    interpret(vm) {
        return this.value;
    }
};

class FloatNode extends ASTNode {
    constructor(flt) {
        super();
        this.value = Number(flt);
    }

    interpret(vm) {
        return this.value;
    }
};

class VarNode extends ASTNode {
    constructor(name) {
        super();

        this.name = name;
    }

    interpret(vm) {
        return vm.variables[this.name];
    }
}

class VarAssignNode extends ASTNode {
    constructor(name, expr) {
        super();

        /** @type {string} */
        this.name = name;

        /** @type {ASTNode} */
        this.expr = expr;
    }

    interpret(vm) {
        vm.variables[this.name] = this.expr.interpret();
    }
};

module.exports = {
    VMContext,

    // Nodes
    ASTNode,
    StmtListNode,
    BinaryExprNode,
    CompExprNode,
    IFStmtNode,
    IntNode,
    FloatNode,
    VarAssignNode,
    VarNode,
};