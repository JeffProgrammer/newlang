const Tokens = {
    // Identifiers and Values
    IDENTIFIER:  0,
    INTEGER_VAL: 1,
    FLOAT_VAL:   2,
    BOOL_VAL:    3,
    STRING_VAL:  4,

    // Symbols
    PLUS:      5,
    MINUS:     6,
    MUL:       7,
    DIV:       8,
    MOD:       9,
    LPAREN:    10,
    RPAREN:    11,
    LBRACKET:  12,
    RBRACKET:  13,
    DOT:       14,
    COLON:     15,
    SEMICOLON: 16,

    // Keywords
    INT:    17,
    FLOAT:  18,
    STRING: 19,
    BOOL:   20,
    VOID:   21,
    FUNCTION: 22,
    IF:       23,
    ELSE:     24,
    FOR:      25,
    WHILE:    26,
    CONST:    27,
    IMPORT:   28,
    FROM:     29,
    NATIVE:   30,
    RETURN:   31,
    FOREACH:  32,

    // Logical Operators
    EQ:     33,
    NOTEQ:  34,
    GTR:    35,
    LESS:   36,
    GTREQ:  37,
    LESSEQ: 38,

    // Other
    PLUSPLUS:   39,
    MINUSMINUS: 40,
    LARROW:     41,
    RARROW:     42,
    ASSIGNMENT: 43,
    COMMA:      44,
};

const Keywords = {
    "int": Tokens.INT,
    "float": Tokens.FLOAT,
    "string": Tokens.STRING,
    "bool": Tokens.BOOL,
    "void": Tokens.VOID,
    "function": Tokens.FUNCTION,
    "if": Tokens.IF,
    "else": Tokens.ELSE,
    "for": Tokens.FOR,
    "while": Tokens.WHILE,
    "const": Tokens.CONST,
    "import": Tokens.IMPORT,
    "from": Tokens.FROM,
    "native": Tokens.NATIVE,
    "return": Tokens.RETURN,
    "foreach": Tokens.FOREACH,
};

module.exports = {
    Tokens,
    Keywords
};