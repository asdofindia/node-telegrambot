# Telegram Bot #
A sample telegram bot using the new API (webhooks) that does everything. I know it is a mess, but it lets you learn how the API works

## Installation ##

```
git clone https://github.com/asdofindia/node-telegrambot
cd node-telegrambot
npm install
```

## Running ##

* Get your bot token from [@botfather](https://telegram.me/botfather). This will be TG_TOKEN
* Get a domain with SSL (Telegram webhooks won't work on localhost, local IP addresses, or self signed certificates). This domain name (without https, or trailing slash) will be APP_DNS (eg: telegrambot.example.com )
* export TG_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11:" APP_DNS="telegrambot.example.com" && node server.js

## IRC integration ##

One of the features of the bot is its irc integration. Set the corresponding values in config.js to log all messages from a telegram channel into an IRC channel and vice versa. Be careful not to use popular channels and get banned. 

## Problems ##

If you've problems, ask me in [this group](https://telegram.me/joinchat/0057c03c01c17626398ee30a57fa166a)
