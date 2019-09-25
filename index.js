const fs = require('fs');
const os = require('os');
const readline = require('readline');
const chalk = require('chalk');
const api = require('./api');
const { version } = require('./package.json');
const { inspect } = require('util');

const wordsNote = process.env.HISTORY_FILE || os.homedir() + '/.mydict_history.txt';
const print = console.log;    // alias
const banner = `
                     _ _      _   
 _ __ ___  _   _  __| (_) ___| |_ 
| '_ \` _ \\| | | |/ _\` | |/ __| __|
| | | | | | |_| | (_| | | (__| |_ 
|_| |_| |_|\\__, |\\__,_|_|\\___|\\__|
           |___/                  
`;

function fullPrint(data) {
      print(inspect(data, {showHidden: false, depth: Infinity}));
}

function translate(word, keepHistory) {
  return api(word).then(data => {
    let result = null;
    if (process.env.DEBUG) {
      fullPrint(data);
    }
    if (typeof data.word_name === 'undefined') {
      return null;
    }
    print(' ' + chalk.bold.underline.magenta(`# ${data.word_name}`));
    const alphasOnly = /[ A-Za-z]+/.test(data.word_name);
    result = alphasOnly ? eng2Sch(data) : sch2Eng(data);
    if (keepHistory) {
      result += '\n';
      fs.appendFile(wordsNote, result, {flag: 'a', encoding: 'utf8'}, (err) => {
        if (err) {
          console.warn("ERR_SAVE_HISTORY", err);
        }
      });
    }
  }).catch(err => {
      if (err.code === 'EAI_AGAIN') {
          console.log("There seems to be a problem with the network connection.");
          return;
      }
      console.log(err);
  });
}

/**　Tab autocompletion */
function completer(line) {
  // TODO
}

function shell(keepHistory) {
    print(chalk.bold.green(banner));
    print('Welcome back my friend!');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        //completer: completer,
        terminal: true,
        historySize: 30,
        prompt: '> '
    });

    rl.prompt();
    rl.on('line', (word) => {
        translate(word, keepHistory).then(() => {
            rl.prompt();
        }).catch(err => {
            print('ERROR:', err);
        });
    });

    rl.on('close', () => {

    });
}

function eng2Sch(data) {
  let result = `# ${data.word_name}` + '\n';

  if (data.exchange) {
    const { word_third, word_past, word_done, word_ing } = data.exchange;
    if (word_third || word_past || word_done || word_ing) {
      print(chalk.italic.blue(` 时态 -> ${word_third}; ${word_past}; ${word_done}; ${word_ing}`));
    }
  }
  for (const symbol of data.symbols) {
    print(" 英[" + chalk.yellow(`${symbol['ph_en']}`) + "] 美[" + chalk.yellow(`${symbol['ph_am']}`) + "]");
    result += `英[${symbol['ph_en']}] 美[${symbol['ph_am']}]` + '\n';

    for (const part of symbol.parts) {
      print(chalk.green(' ◆ ') + chalk.cyan(`${part.part} ${part.means}`));
      result += `◆ ${part.part} ${part.means}` + '\n';
    }
  }
  return result;
}

function sch2Eng(data) {
  data.symbols.forEach((explain) => {
    print(chalk.italic.blue(` 拼音: ${explain.word_symbol}`));
    for (const part of explain.parts) {
      const means = part.means.map(item => item.word_mean);
      print(chalk.green(` 翻译: ${means}`));
    }
  });
}

module.exports = { translate, shell, version };
