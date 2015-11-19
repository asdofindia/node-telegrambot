var request = require('request');
var google = require('google');
var ddg = require('ddg');
require('string.prototype.startswith');
var events = require('events');
var eventEmitter = new events.EventEmitter;
var config = require('./config');
var imgur = require('imgur');
var utils = require('./utils');

module.exports = function(){
    this.eventEmitter = eventEmitter;
    var bot=this;
    this.api = "https://api.telegram.org/bot" + process.env.TG_TOKEN + "/";
    this.get_endpoint = function(endpoint){
        return this.api + endpoint;
    };
    this.get_enddata = function(endpoint, callback){
        request(this.get_endpoint(endpoint), function(error, response, body){
            if (!error && response.statusCode == 200){
                var obj = JSON.parse(body);
                callback(obj);
            } else {
              console.log(body);
            }
        });
    };
    this.post_enddata = function(endpoint, form, callback) {
        request.post({url: this.get_endpoint(endpoint), form: form}, function(error, response, body){
            if (!error && response.statusCode == 200){
                var obj=JSON.parse(body);
                callback(obj);
            } else {
                console.log(body);
            }
        });
    };
    this.initialize = function(){
        this.get_enddata("getMe", function(body){
            this.myId = body.result.id;
            console.log("My ID is "+this.myId);
        });
        if (process.env.OPENSHIFT_APP_DNS) {
          this.post_enddata("setWebhook", {"url": "https://" + process.env.OPENSHIFT_APP_DNS + "/telegram/callback"}, function(body){
              console.log(JSON.stringify(body));
          });
        }
    };
    this.process = function(update){
        console.log(update);
        if (typeof update.message != "undefined") {
          var message = update.message;
          this.broadcaster(message);
          if (typeof message.text != "undefined") {
            var text = message.text;
            if (text.startsWith("/g ")){
              console.log("Googling");
              this.google(message);
            }
            if (text.startsWith("/d ")){
              this.ddg(message);
            }
            if (text=="/id"){
              this.getid(message);
            }
            if (text.startsWith("/help")){
              // console.log("request for help");
              this.help(message);
            }
          } else if (typeof message.photo != "undefined") {
            this.imgur(message);
          }
        }
    };
    this.replyto = function(message, reply){
        this.post_enddata("sendMessage", {
          "chat_id": message.chat.id,
          "text": reply,
          "reply_to_message_id": message.message_id
        }, function(body){
          console.log(JSON.stringify(body));
          bot.broadcaster(body.result);
        });
    };
    this.sendto = function(chat_id, message, broadcast){
        broadcast = typeof broadcast != "undefined"? broadcast : true;
        this.post_enddata("sendMessage", {
            "chat_id": parseInt(chat_id,10),
            "text": message,
            "parse_mode": "Markdown"
        }, function(body){
            console.log(JSON.stringify(body));
            if(broadcast){
              bot.broadcaster(body.result);
            }
        });
    };
    this.getid = function(message) {
        bot.replyto(message, "" + message.chat.id)
    };
    this.google = function(message){
        var query = message.text.substring(3);
        google(query, function(err, next, links){
            if (err) console.error(err);
            var reply = '';
            reply += links[0].title + " - " + links[0].link + "\n" + links[0].description.replace(/\n/gm,"");
            // console.log("sending " + reply)
            bot.replyto(message, reply)
        });
    };
    this.ddg = function(message) {
        var query = message.text.substring(3);
        var options = {
            "useragent": "Grambot",
            "no_redirects": "1",
            "no_html": "1"
        };
        ddg.query(query, options, function(err, data){
            if (err) console.error(err);
            var reply = '';
            if (data.Answer){
              reply = data.Answer;
            } else if (data.AbstractText){
              reply = data.AbstractText;
            } else if (data.RelatedTopics[0]) {
              reply = data.RelatedTopics[0].Text + " -- " + data.RelatedTopics[0].FirstURL
            } else if (data.Definition){
              reply = data.Definition;
            }
            if (reply != ""){
              bot.replyto(message, reply);
            }
        });
    };
    this.help = function(message){
        var reply = "This is Grambot Beta, beta! I can search Google with '/g query', search duckduckgo with '/d query'";
        // console.log("helping");
        this.replyto(message, reply);
    };
    this.imgur = function(message) {
        var photo = message.photo.pop();
        // console.log(photo);
        this.post_enddata("getFile", {
            file_id: photo.file_id
        }, function(json){
            // console.log(json)
            var url = "https://api.telegram.org/file/bot"+ process.env.TG_TOKEN + "/" + json.result.file_path;
            // console.log(url);
            imgur.uploadUrl(url)
                .then(function(json){
                    // should call this.broadcaster instead of eventEmitter to allow for photo replies
                    message.text = json.data.link;
                    eventEmitter.emit('tgmsg', message);
                })
                .catch(function(err){
                    console.log(err.message);
                });
        });
    };
    this.broadcaster = function(message){
        if (message.reply_to_message) {
            var messageReplyToWhom = utils.gettgname(message.reply_to_message);
            var messageAppend = '';
            if (messageReplyToWhom == "gram_bot"){
                messageAppend = "@" + message.reply_to_message.text.split(':')[0] + ", ";
            } else {
                messageAppend = "@" + messageReplyToWhom + ", ";
            }
            if (typeof message.text != "undefined") {
                message.text = messageAppend + message.text;
            }
        }
        if (typeof message.text != "undefined"){
            eventEmitter.emit('tgmsg', message)
        }
    };
    this.receiver = function(message){
        console.log("tg receive taking over message '" + message.text +"' from "+ message.to + " on server(" + message.server + ")")
        if (config.irc[message.server]){
          if (config.irc[message.server][message.to]){
            var to = config.irc[message.server][message.to];
            if (!message.action){
              bot.sendto(to, "*" + message.from + "*" + ": " + message.text, false);
            } else {
              bot.sendto(to, "*" + message.from + "*" + " " + message.text, false)
            }
          }
        }
    };
};
