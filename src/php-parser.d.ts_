/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

declare module "php-parser" {
  /**
   * Token items
   */

  /**
   * The tokens dictionnary
   */
  interface TokenDefinition {
    /** List of token names as texts */
    values: String[],
    /** Define tokens */
    names: TokenEnum[]
  }

  /**
   * The token structure
   */
  interface Token extends Array<any> {
    // token name
    0: String;
    // the token value
    1: TokenEnum;
    // the current line
    2: Number
  }

  /**
   * Each Position object consists of a line number (1-indexed) and a column number (0-indexed):
   */
  interface Position {
    line: Number;
    column: Number;
    offset: Number;
  }

  /**
   * Defines the location of the node (with it's source contents as string)
   */
  interface Location {
    source: string;
    start: Position;
    end: Position;
  }

  interface Identifier {
    kind: string;
    loc: Location;
    name: string;
  }

  interface Comment {
    kind: String;
    loc: Location;
    value: String;
    offset: number;
  }

  /**
   *
   */
  interface Node {
    kind: String;
    loc: Location;
    name?: Identifier;
    body?: Node[];
    leadingComments?: Comment[];
  }

  interface Expression extends Node {
    operator: string;
    left: Node;
    right: Node;
  }

  interface ExpressionStatement extends Node {
    expression: Expression | ExpressionStatement;
  }

  interface Reference {
    kind: String;
    loc: Location;
    name: string;
    resolution?: string;
    raw?: string;
  }

  interface Parameter {
    byref: boolean;
    kind: String;
    loc: Location;
    name: Identifier;
    nullable: boolean;
    type: Reference;
    variadic: boolean;
    value: Node | null;
  }

  interface Method {
    kind: String;
    loc: Location;
    name?: Identifier;
    body: Block;
    leadingComments?: Comment[];
    arguments: Parameter[];
    isAbstract: boolean;
    isFinal: boolean;
    isStatic: boolean;
  }

  /**
   * Error node
   */
  interface ParserError extends Node {
    message: String;
    token: Token;
    line: Number;
    expected: any;
  }

  /**
   * A block statement, i.e., a sequence of statements surrounded by braces.
   */
  interface Block extends Node {
    children: Node[];
  }

  /**
   * The main root node
   */
  interface Program extends Block {
    errors: ParserError[];
  }

  interface Parser {
    lexer: Lexer;
    ast: AST;
    token: TokenEnum;
    prev: TokenEnum;
    debug: Boolean;
    extractDoc: Boolean;
    suppressErrors: Boolean;
    getTokenName(token:TokenEnum): String;
    parse(code: String, filename: String): Program;
    raiseError(message: String, msgExpect: String, expect: any, token: TokenEnum): ParserError;
    error(expect: String): ParserError;
    node(kind:String): Node;
    expectEndOfStatement(): Boolean;
    showlog(): Parser;
    expect(token:TokenEnum): Boolean;
    expect(tokens:TokenEnum[]): Boolean;
    text(): String;
    next(): Parser;
    ignoreComments(): Parser;
    nextWithComments(): Parser;
    is(type: String): Boolean;
    // @todo other parsing functions ...
  }


  interface  yylloc {
    first_offset: Number;
    first_line: Number;
    first_column: Number;
    last_line: Number;
    last_column: Number;
  }

  interface LexerState {
    yytext: String;
    offset: Number;
    yylineno: Number;
    yyprevcol: Number;
    yylloc: yylloc;
  }

  interface Lexer {
    debug: Boolean;
    all_tokens: Boolean;
    comment_tokens: Boolean;
    mode_eval: Boolean;
    asp_tags: Boolean;
    short_tags: Boolean;
    keywords: KeywordsDictionnary;
    castKeywords: KeywordsDictionnary;
    setInput(input:String): Lexer;
    input(size:Number): String;
    unput(size:Number): Lexer;
    tryMatch(match:String): Boolean;
    tryMatchCaseless(match:String): Boolean;
    ahead(size:Number): String;
    consume(size:Number): Lexer;
    getState(): LexerState;
    setState(state:LexerState): Lexer;
    appendToken(value:TokenEnum, ahead:Number): Lexer;
    lex(): TokenEnum;
    begin(state:String): Lexer;
    popState(): String;
    next(): TokenEnum;
    // @todo other lexer functions ...
  }


  interface AST {
    /**
     *
     */
    withPositions: Boolean;
    /**
     * Option, if true extracts original source code attached to the node (by default false)
     */
    withSource: Boolean;
    /**
     * Constructor
     */
    constructor(withPositions:Boolean, withSource:Boolean): AST;
    constructor(withPositions:Boolean): AST;
    constructor(): AST;
    /**
     * Create a position node from specified parser
     * including it's lexer current state
     */
    position(parser:Parser): Position;
    /**
     * Prepares an AST node
     */
    prepare(kind:String, parser:Parser): Function;
  }

  /**
   * List of options / extensions
   */
  interface Options {
    ast?: {
        withPositions?: Boolean;
        withSource?: Boolean;
    };
    lexer?: {
        debug?: Boolean;
        all_tokens?: Boolean;
        comment_tokens?: Boolean;
        mode_eval?: Boolean;
        asp_tags?: Boolean;
        short_tags?: Boolean;
    };
    parser?: {
        debug?: Boolean;
        extractDoc?: Boolean;
        suppressErrors?: Boolean;
    };
  }

  /**
   * Initialise a new parser instance with the specified options
   */
  export default class Engine {
    // ----- STATIC HELPERS
    static create(options?: Options) : Engine;
    static parseEval(buffer: String, options: Options)  : Program;
    static parseEval(buffer: String) : Program;
    static parseCode(buffer: String, filename: String, options: Options) : Program;
    static parseCode(buffer: String, options: Options) : Program;
    static parseCode(buffer: String) : Program;
    static tokenGetAll(buffer: String, options: Options) : Token[];
    static tokenGetAll(buffer: String) : Token[];
    // ----- INSTANCE FUNCTIONS
    ast: AST;
    lexer: Lexer;
    parser: Parser;
    tokens: TokenDefinition;
    constructor(options?: Options);
    parseEval(buffer: String) : Program;
    parseCode(buffer: String, filename: String) : Program;
    parseCode(buffer: String) : Program;
    tokenGetAll(buffer: String) : Token[];
  }
}
