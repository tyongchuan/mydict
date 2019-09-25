const http  = require('http');
const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '.env')
});
const API_KEY = process.env.API_KEY;

/**
 * JSON 字段解释(英文)
 * {
 * 'word_name':'' #单词
 * 'exchange': '' #单词的各种时态
 * 'symbols':'' #单词各种信息 下面字段都是这个字段下面的
 * 'ph_en': '' #英式音标
 * 'ph_am': '' #美式音标
 * 'ph_en_mp3':'' #英式发音
 * 'ph_am_mp3': '' #美式发音
 * 'ph_tts_mp3': '' #TTS发音
 * 'parts':'' #词的各种意思
 * }
 * JSON 字段解释(中文)
 * {
 * 'word_name':'' #所查的词
 * 'symbols':'' #词各种信息 下面字段都是这个字段下面的
 * 'word_symbol': '' #拼音
 * 'symbol_mp3': '' #发音
 * 'parts':'' #汉字的各种翻译 数组
 * 'net_means': '' #网络释义
 * }
 */

function api(word, callback) {
  return new Promise((resolve, reject) => {
    const options = {
      protocol: 'http:',
      host: 'dict-co.iciba.com',
      path: `/api/dictionary.php?key=${API_KEY}&type=json&w=${encodeURIComponent(word)}`,
      port: 80,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (callback) { callback(result); }
          resolve(result);
        } catch (err) {
          console.log('Raw data:', data);
          reject(err);
        }
      });
    });

    req.on('error', err => {
      if (callback) { callback(err); }
      reject(err);
    });

    req.end();
  });
}

module.exports = api;
