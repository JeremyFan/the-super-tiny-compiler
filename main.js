const { compiler, tokenizer, parser, transformer, codeGenerator } = require('./another-super-tiny-compiler')
const fs = require('fs')
const { inspect } = require('util')



// compile()


compileFile()



function compileFile() {
  const input = fs.readFileSync('./src/index.js', { encoding: 'utf-8' })

  const output = compiler(input)

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist')
  }

  fs.writeFileSync('./dist/index.js', output, { encoding: 'utf-8' })

  console.log('=====\ncompiled complete\n======')
}

function compile() {
  let a = tokenizer('const sum = (a, b) => a + b')
  // console.log('tokens->\n', a)

  let b = parser(a)
  // console.log('ast->\n',inspect(b))

  let c = transformer(b)
  // console.log('newAst->\n', inspect(c))

  let d = codeGenerator(c)
  console.log(`code->\n${d}`)
}
