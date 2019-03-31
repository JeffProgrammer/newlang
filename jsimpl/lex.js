const { Tokens, Keywords } = require('./tokens');

/**
 * @param {string} string
 * @return {number|null} 
 */
function getKeywordToken(string) {
    if (typeof Keywords[string] === 'undefined')
        return null;
    return Keywords[string];
}

class Lexer {
    constructor(str) {
        /**
         * The code we are turning into an array of tokens.
         * @type {string}
         */
        this.str = str;

        /**
         * Current location in the lexer.
         * @type {number}
         */
        this.position = 0;

        /**
         * Current line we're parsing
         * @type {number}
         */
        this.lineNumber = 1;

        /** @type {Array<{token: number, val: any, lineNumber: number}>} */
        this.result = [];
    }

    lex() {
        // TODO: lexer needs += and friends...
        // TODO: Bitwise operations...

        const len = this.str.length;
        while (this.position < len) {
            this.mungeWhitespace();

            const chr = this.str[this.position];
            switch (chr) {
                case "\r":
                    ++this.position;
                    if (!this.newLine()) {
                        // RIPopotomous
                        throw new Error(`LF must follow CR on line ${this.lineNumber}`);
                    }
                    break;
                case "\n":
                    this.newLine();
                    break;
                case '"':
                    ++this.position;
                    this.consumeString();
                    break;
                case "+":
                    ++this.position;
                    if (this.position < len && this.str[this.position] === "+") {
                        ++this.position;
                        this.result.push({
                            token: Tokens.PLUSPLUS,
                            val: "++",
                            lineNumber: this.lineNumber,
                        });
                    } else {
                        this.result.push({
                            token: Tokens.PLUS,
                            val: "+",
                            lineNumber: this.lineNumber,
                        });
                    }
                    break;
                case "-":
                    ++this.position;
                    if (this.position < len && this.str[this.position] === "-") {
                        ++this.position;
                        this.result.push({
                            token: Tokens.MINUSMINUS,
                            val: "--",
                            lineNumber: this.lineNumber,
                        });
                    } else if (this.position < len && isDigit(this.str[this.position])) {
                        // We're a negative number!
                        this.mungeNumber();
                    } else {
                        this.result.push({
                            token: Tokens.MINUS,
                            val: "-",
                            lineNumber: this.lineNumber,
                        });
                    }
                    break;
                case "/":
                    ++this.position;
                    if (this.position < len && this.str[this.position] === "/") {
                        ++this.position;
                        this.consumeComment();
                    } else {
                       this.result.push({
                           token: Tokens.DIV,
                           val: "/",
                           lineNumber: this.lineNumber,
                       });
                    }
                    break;
                case "*":
                    ++this.position;
                    this.result.push({
                        token: Tokens.MUL,
                        val: "*",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case "%":
                    ++this.position;
                    this.result.push({
                        token: Tokens.MOD,
                        val: "%",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case "=":
                    ++this.position;
                    if (this.position < len && this.str[this.position] === "=") {
                        ++this.position;
                        this.result.push({
                            token: Tokens.EQ,
                            val: "==",
                            lineNumber: this.lineNumber,
                        });
                    } else {
                        this.result.push({
                            token: Tokens.ASSIGNMENT,
                            val: "=",
                            lineNumber: this.lineNumber,
                        });
                    }
                    break;
                case "!":
                    ++this.position;
                    if (this.position< len && this.str[this.position] === '=') {
                        ++this.position;
                        this.result.push({
                            token: Tokens.NOTEQ,
                            val: "!=",
                            lineNumber: this.lineNumber
                        });
                    } else {
                        // For now, we don't support ! operation.
                        // TODO: do!
                        throw new Error("Right now only != is supported in lexing.");
                    }
                    break;
                case ";":
                    ++this.position;
                    this.result.push({
                        token: Tokens.SEMICOLON,
                        val: ";",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case ",":
                    ++this.position;
                    this.result.push({
                        token: Tokens.COMMA,
                        val: ",",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case "(":
                    ++this.position;
                    this.result.push({
                        token: Tokens.LPAREN,
                        val: "(",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case ")":
                    ++this.position;
                    this.result.push({
                        token: Tokens.RPAREN,
                        val: ")",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case "{":
                    ++this.position;
                    this.result.push({
                        token: Tokens.LPAREN,
                        val: "{",
                        lineNumber: this.lineNumber,
                    });
                    break;
                case "}":
                    ++this.position;
                    this.result.push({
                        token: Tokens.RPAREN,
                        val: "}",
                        lineNumber: this.lineNumber,
                    });
                    break;
                default:
                    // Either a digit or identifier
                    if (this.isDigit(chr)) {
                        this.mungeNumber();
                    } else if (this.isIdentifier(chr)) {
                        const ident = this.mungeIdentifier();

                        // Check for keywords.
                        const keywordToken = getKeywordToken(ident);
                        if (keywordToken !== null) {
                            // Keyword
                            this.result.push({
                                token: keywordToken,
                                val: ident,
                                lineNumber: this.lineNumber,
                            });
                        } else {
                            // Regular identifier
                            this.result.push({
                                token: Tokens.IDENTIFIER,
                                val: ident,
                                lineNumber: this.lineNumber,
                            });
                        }
                    } else {
                        // Error.
                        throw new Error(`Unknown character to process: ${chr}`);
                    }
            }
        }
    }

    newLine() {
        const len = this.str.length;
        if (this.position < len && this.str[this.position] === "\n") {
            ++this.position;
            ++this.lineNumber;
            return true;
        }
        return false;
    }

    isDigit(char) {
        return /[0-9]/g.test(char);
    }

    isIdentifier(char) {
        return /([A-Za-z]|_|\$)/g.test(char);
    }

    mungeWhitespace() {
        const len = this.str.length;
        while (this.position < len && this.str[this.position] === " ") {
            ++this.position;
        }
    }

    mungeNumber() {
        const len = this.str.length;
        let string = "";
        let hasDot = false;
        while (this.position < len) {
            const char = this.str[this.position];
            if (!this.isDigit(char)) {
                if (char === '.') {
                    if (hasDot) {
                        // 2 decimal places :o
                        throw new Error("Number cannot have two dots.");
                    }
                    hasDot = true;
                } else {
                    // We've hit the end of our number, not a digit.
                    break;
                }
            }
            string += char;
            ++this.position;
        }

        if (string === "")
            throw new Error("No number found");

        const token = string.indexOf(".") === -1 ? Tokens.INTEGER_VAL : Tokens.FLOAT_VAL;
        this.result.push({
            token: token,
            val: string,
            lineNumber: this.lineNumber,
        });
    }

    mungeIdentifier() {
        const len = this.str.length;
        const first = this.str[this.position++];
        if (!this.isIdentifier(first))
            throw new Error(`MungeIdentifier not starting with proper identifier character: ${first}`);

        let string = first;
        while (this.position < len) {
            const char = this.str[this.position];
            if (!(/([A-Za-z0-9]|_)/g.test(char)))
                break;
            string += String(char);
            ++this.position;
        }

        return string;
    }

    consumeComment() {
        const len = this.str.length;
        while (this.position < len && !this.newLine()) {
            ++this.position;
        }
    }

    consumeString() {
        const len = this.str.length;
        let string = "";
        while (true) {
            if (this.position == len)
                throw new Error("Hit the end of lexing and did not finish closing the setring.");

            const chr = this.str[this.position++];
            if (chr === '"')
                break;

            string += String(chr);
        }

        this.result.push({
            token: Tokens.STRING_VAL,
            val: string,
            lineNumber: this.lineNumber,
        });
    }
};

module.exports = Lexer;