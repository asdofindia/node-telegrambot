// this script can be used to send messages to your bot as if you are Telegram.
// run it with `node test.js`
// replace message.from.id to your own id and show some love by talking to your bot personally first

var request = require('request');
request.post({
  // change url to your website address
  url: 'http://127.0.0.1:8080/telegram/callback',
  body: JSON.stringify({
  update_id: 123456,
  message:
   { message_id: 42,
     from: { id: 123456, first_name: 'Akshay', username: 'user' },
     chat: { id: 123456, first_name: 'Akshay', username: 'user' },
     date: 1435050882,
     text: '/help' } })
}, function(error, response, body){
  console.log(body);
});
