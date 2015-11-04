'use strict';

module.exports = {
  add,
  query
}

let taxis = new Map();

function add(chat, travel) {
  let key = JSON.stringify(travel);
  if (taxis.has(key) === false) {
    taxis.set(key, [chat]);
  } else {
    taxis.get(key).push(chat);
  }
}

function query(travel) {
  let key = JSON.stringify(travel);
  return taxis.get(key);
}
