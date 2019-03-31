const { Tokens } = require('./tokens');

class VMContext {
    constructor() {
        /** @type {Object.<string, val>} */
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

class VarDeclareNode extends ASTNode {
    constructor(name, is_const, type, expr) {
        super();

        /** @type {string} */
        this.name = name;

        /** @type {boolean} */
        this.is_const = is_const;

        /** @type {number} */
        this.type = type;

        /** @type {ASTNode} */
        this.expr = expr;
    }

    interpret(vm) {
        const val = this.expr.interpret();
        vm.variables[this.name] = val;
    }
};

module.exports = {
    VMContext,

    // Nodes
    ASTNode,
    StmtListNode,
    BinaryExprNode,
    IntNode,
    FloatNode,
    VarDeclareNode,
    VarNode,
};