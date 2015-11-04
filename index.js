'use strict';

const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
  console.log('You need to define a TELEGRAM_TOKEN env variable');
  process.exit(1);
}
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const scheduler = require('./scheduler');

bot.on('text', msg => {
  console.log('new text message', msg);

  let chatId = msg.chat.id;

  if (msg.text === '/start') {
    bot.sendMessage(chatId, `Hi, ${msg.from.first_name}. I help you to share a taxi.`);
    return;
  }

  const wit = require('node-wit');
  let WIT_TOKEN = process.env.WIT_TOKEN || 'W6GB5SIFD7VJHUA4IKLFVM5BNG3N4YB6'; // wit client access token

  wit.captureTextIntent(WIT_TOKEN, msg.text, (err, res) => {
    if (err) {
      return console.log('wit error', err);
    }
    console.log('wit response', JSON.stringify(res, null, 2));
    return processIntent(msg, res);
  });
});

function processIntent(msg, res) {
  let chatId = msg.chat.id;

  const CONFIDENCE_THRESHOLD = 0.55;
  let intent = res.outcomes.filter(o => o.confidence > CONFIDENCE_THRESHOLD)
                           .filter(o => o.intent === 'travel')
                           .shift();

  if (!intent || !intent.entities.from || !intent.entities.datetime) {
    return bot.sendMessage(chatId, 'Say it again');
  }

  let datetime = intent.entities.datetime[0].value;
  let from = intent.entities.from[0].value;
  let to = null; // TODO

  var travel = { datetime, from, to };

  var travelers = scheduler.query(travel);
  if (travelers) {
    travelers.forEach(who => bot.sendMessage(who.id, `Share a taxi with ${msg.chat.first_name} ${msg.chat.last_name}`));

    let names = travelers.map(who => who.first_name + ' ' + who.last_name).join(',');
    bot.sendMessage(chatId, `Sure. You can travel from ${from} with ${names}`);
  } else {
    bot.sendMessage(chatId, `Ok. I'll alert you if someone else travels from ${from} at ${datetime}`);
  }

  scheduler.add(msg.chat, travel);
}
