const { compiler } = require('./the-super-tiny-compiler')

const fs = require('fs')

console.log('---')

const input = fs.readFileSync('./src/index.js', { encoding: 'utf-8' })

const output = compiler(input)

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

fs.writeFileSync('./dist/index.js', output, { encoding: 'utf-8' })

console.log('compiled complete')
