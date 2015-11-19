var irc = require('irc');
var events = require('events');
var eventEmitter = new events.EventEmitter;
var utils = require('./utils');
var config = require('./config');

module.exports = function(){
    var self=this;
    this.eventEmitter = eventEmitter;
    this.broadcaster = function(message){
        eventEmitter.emit('ircmsg', message)
    };
    this.initialize = function(){
        self.freebot = new irc.Client('chat.freenode.net', 'node-telegrambot', {
            channels: ["#test"],
            port: 8001,
            debug: true,
            secure: false,
            sasl: false
        });
        self.freebot.addListener('error', function(message) {
            console.log('error: ', message);
        });
        self.freebot.addListener('message', function(from, to, message){
            self.broadcaster({"from": from, "to": to, "text": message, "server": "freenode"});
        });
        self.freebot.addListener('action', function(from, to, text, message){
            self.broadcaster({"from": from, "to": to, "text": text, "server": "freenode", "action": true});
        });
    };
    this.receiver = function(message){
        if (config.tg[message.chat.id]){
          var to = config.tg[message.chat.id];
          if (to[0]=="freenode"){
            self.freebot.say(to[1], irc.colors.wrap("dark_red",utils.gettgname(message)) + ": " + message.text);
          }
        }
    };
}
