'use strict';

const { clone, compose } = require('./utils')

/**
 * ============================================================================
 *                                   (/^▽^)/
 *                                THE TOKENIZER!
 * ============================================================================
 * 
 * input: 'const sum = (a, b) => a + b'
 * 
 * output:
 * [
 *   { type: 'name', value: 'const' },
 *   { type: 'name', value: 'sum' },
 *   { type: 'operator', value: '=' },
 *   { type: 'paren', value: '(' },
 *   { type: 'name', value: 'a' },
 *   { type: 'notation', value: ',' },
 *   { type: 'name', value: 'b' },
 *   { type: 'paren', value: ')' },
 *   { type: 'syntax', value: '=>' },
 *   { type: 'name', value: 'a' },
 *   { type: 'operator', value: '+' },
 *   { type: 'name', value: 'b' }
 * ]
 */
function tokenizer(input) {
  let current = 0;

  let tokens = [];

  while (current < input.length) {
    let char = input[current];

    if (char === '(') {
      tokens.push({ type: 'paren', value: '(' });

      current++;
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    // 空格不需要记录在tokens里面
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = '';
      while (char && NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'number', value });

      continue;
    }

    if (char === '"') {
      let value = '';

      char = input[++current];

      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      char = input[++current];

      tokens.push({ type: 'string', value });

      continue;
    }

    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      while (char && LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'name', value });

      continue;
    }

    if (char === '=') {
      if (input[++current] === '>') {
        tokens.push({ type: 'syntax', value: '=>' })
        current++
      } else {
        tokens.push({ type: 'operator', value: '=' })
      }

      continue
    }


    let NOTATIONS = /[,;:]/
    if (char.match(NOTATIONS)) {
      tokens.push({ type: 'notation', value: char })

      current++
      continue
    }

    let OPERATORS = /[*+-/%]/
    if (char.match(OPERATORS)) {
      tokens.push({ type: 'operator', value: char })

      current++
      continue
    }

    throw new TypeError('I dont know what this character is: ' + char);
  }

  return tokens;
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                THE PARSER!!!
 * ============================================================================
 * 
 * 
 * input:
 * [
 *   { type: 'name', value: 'const' },
 *   { type: 'name', value: 'sum' },
 *   { type: 'operator', value: '=' },
 *   { type: 'paren', value: '(' },
 *   { type: 'name', value: 'a' },
 *   { type: 'notation', value: ',' },
 *   { type: 'name', value: 'b' },
 *   { type: 'paren', value: ')' },
 *   { type: 'syntax', value: '=>' },
 *   { type: 'name', value: 'a' },
 *   { type: 'operator', value: '+' },
 *   { type: 'name', value: 'b' }
 * ]
 * 
 * output:
 * {
 *   type: 'Program',
 *   body: [
 *     {
 *       type: 'VariableDeclaration',
 *       declarations: [
 *         {
 *           type: 'VariableDeclarator',
 *           id: { type: 'Identifier', name: 'sum' },
 *           init: {
 *             type: 'ArrowFunctionExpression',
 *             params: [
 *               { type: 'Identifier', name: 'a' },
 *               { type: 'Identifier', name: 'b' },
 *             ],
 *             body: {
 *               type: 'BinaryExpression',
 *               operator: '+',
 *               left: { type: 'Identifier', name: 'a' },
 *               right: { type: 'Identifier', name: 'b' },
 *             },
 *           },
 *         },
 *       ],
 *     },
 *   ],
 * };
 * 
 * 
 */
function parser(tokens) {
  let current = 0;

  let ast = { type: 'Program', body: [] };

  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;

  function walk() {
    let token = tokens[current];

    if (token.type === 'number') {

      current++;

      return {
        type: 'NumericLiteral',
        value: token.value,
      };
    }

    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    if (token.type === 'name') {
      current++;

      let DECLARATIONS = /var|let|const|function/
      if (token.value.match(DECLARATIONS)) {
        let node = {
          type: 'VariableDeclaration',
          kind: token.value.match(DECLARATIONS)[0],
          declarations: [{
            type: 'VariableDeclarator',
            id: null,
            init: null,
          }],
        }

        node.declarations[0].id = walk()
        current++
        node.declarations[0].init = walk()

        return node
      } else {
        return {
          type: 'Identifier',
          name: token.value,
        }
      }
    }

    if (token.type === 'paren' && token.value === '(') {
      let cur = current

      while (tokens[++cur]) {
        if (tokens[cur].type === 'syntax' && tokens[cur].value === '=>') {
          let node = {
            type: 'ArrowFunctionExpression',
            params: [],
            body: null,
          }

          token = tokens[++current]

          while (
            (token.type !== 'paren') ||
            (token.type === 'paren' && token.value !== ')')
          ) {
            if (token.type === 'notation' && token.value === ',') {
              token = tokens[++current];
              continue
            }

            node.params.push(walk());
            token = tokens[current];
          }

          while (
            (token.type === 'paren' && token.value === ')') ||
            (token.type === 'syntax' && token.value === '=>') ||
            (token.type === 'name')
          ) {
            token = tokens[++current];
          }

          node.body = walk()

          return node
        }
      }
    }

    // 二元运算符
    if (token.type === 'operator' && token.value.match(/[*+-/%]/)) {
      let node = {
        type: 'BinaryExpression',
      }

      node.operator = token.value.match(/[*+-/%]/)[0]

      let cur = current

      current = cur - 1
      node.left = walk()
      current = cur + 1
      node.right = walk()

      current++

      return node
    }

    throw new TypeError(token.type);
  }
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               THE TRAVERSER!!!
 * ============================================================================
 * 
 * visitor:
 * {
 *   Program: {
 *     enter(node, parent) {
 *       console.log('enter->', node)
 *     },
 *     exit(node, parent) {
 *       console.log('exit->', node)
 *     }
 *   },
 *   BinaryExpression: {
 *     enter(node, parent) {
 *       console.log('enter->', node)
 *     },
 *     exit(node, parent) {
 *       console.log('exit->', node)
 *     }
 *   },
 *   Identifier: {
 *     enter(node, parent) {
 *       console.log('enter->', node)
 *     },
 *     exit(node, parent) {
 *       console.log('exit->', node)
 *     }
 *   }
 * 
 */
function traverser(ast, visitor) {

  traverseNode(ast, null);

  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseObject(object, properties) {
    properties.forEach(prop => {
      traverseNode(object[prop], object)
    })
  }

  function traverseNode(node, parent) {
    let methods = visitor[node.type]

    if (methods && methods.enter) {
      methods.enter(node, parent)
    }

    // trick：不再遍历已经转换的节点
    if (!node._transformed) {
      switch (node.type) {
        case 'Program':
          traverseArray(node.body, node)
          break;

        case 'VariableDeclaration':
          traverseArray(node.declarations, node)
          break;

        case 'VariableDeclarator':
          traverseObject(node, ['id', 'init'])
          break;

        case 'ArrowFunctionExpression':
          traverseArray(node.params, node)
          traverseObject(node, ['body'])
          break;

        case 'BinaryExpression':
          traverseObject(node, ['left', 'right'])
          break;

        case 'Identifier':
        case 'NumericLiteral':
        case 'StringLiteral':
          break;

        default:
          throw new TypeError(node.type);
      }
    }

    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              THE TRANSFORMER!!!
 * ============================================================================
 */

/**
 * Next up, the transformer. Our transformer is going to take the AST that we
 * have built and pass it to our traverser function with a visitor and will
 * create a new ast.
 *
 * ----------------------------------------------------------------------------
 *   Original AST                     |   Transformed AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *  (sorry the other one is longer.)  |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */
function transformer(ast) {
  let newAst = clone(ast);

  traverser(newAst, {
    VariableDeclaration: {
      enter(node, parent) {
        node.kind = 'var'
      }
    },

    ArrowFunctionExpression: {
      enter(node, parent) {
        node.type = 'FunctionExpression'

        const args = node.body

        node.body = {
          type: 'BlockStatement',
          body: {
            type: 'ReturnStatement',
            arguments: args,
          }
        }

        // trick：标记节点已经被转换
        node._transformed = true
      },
    },
  })

  return newAst;
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                            THE CODE GENERATOR!!!!
 * ============================================================================
 */
function codeGenerator(node) {
  switch (node.type) {

    case 'Program':
      return node.body.map(codeGenerator).join('\n');

    case 'VariableDeclaration':
      return node.kind + ' ' + node.declarations.map(codeGenerator)

    case 'VariableDeclarator':
      return codeGenerator(node.id) + ' = ' + codeGenerator(node.init)

    case 'FunctionExpression':
      return (
        'function ' +
        '(' +
        node.params.map(codeGenerator).join(', ') +
        ') ' +
        codeGenerator(node.body)
      )

    case 'BlockStatement':
      return (
        '{\n' +
        '  ' + codeGenerator(node.body) +
        '\n}'
      )

    case 'ReturnStatement':
      return 'return ' + codeGenerator(node.arguments)

    case 'BinaryExpression':
      return (
        codeGenerator(node.left) +
        ' ' +
        node.operator +
        ' ' +
        codeGenerator(node.right)
      )

    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';'
      );

    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    case 'Identifier':
      return node.name;

    case 'NumericLiteral':
      return node.value;

    case 'StringLiteral':
      return '"' + node.value + '"';

    default:
      throw new TypeError(node.type);
  }
}

/**
 * ============================================================================
 *                                  (۶* ‘ヮ’)۶”
 *                         !!!!!!!!THE COMPILER!!!!!!!!
 * ============================================================================
 */

/**
 * FINALLY! We'll create our `compiler` function. Here we will link together
 * every part of the pipeline.
 *
 *   1. input  => tokenizer   => tokens
 *   2. tokens => parser      => ast
 *   3. ast    => transformer => newAst
 *   4. newAst => generator   => output
 */

function compiler(input) {
  let tokens = tokenizer(input);
  let ast = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  // and simply return the output!
  return output;
}

  /**
   * ============================================================================
   *                                   (๑˃̵ᴗ˂̵)و
   * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!YOU MADE IT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   * ============================================================================
   */

  // Now I'm just exporting everything...
  module.exports = {
    tokenizer,
    parser,
    traverser,
    transformer,
    codeGenerator,
    compiler,
  };

// let a = tokenizer('const sum = (a, b) => a + b')
// console.log('tokens->', a)

// @todo use util.inspect
// let b = parser(a)
// console.log('ast->', JSON.stringify(b))

// let c = transformer(b)
// console.log('newAst->', JSON.stringify(c))

// let d = codeGenerator(c)
// console.log('code->', d)


// const newAst = transformer(ast)

// console.log(JSON.stringify(newAst))

// console.log(codeGenerator(newAst))
