#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
// var bodyParser = require('body-parser');
var getRawBody = require('raw-body');
var Telegram = require('./telegram');
var IRC = require('./irc');
var events = require('events');

/**
 *  Define the sample application.
 */
var GramBot = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };

    self.createHooks = function() {
        self.hooks = { };

        self.hooks['/telegram/callback'] = function(req, res){
            self.tgbot.process(JSON.parse(req.text))
            res.send('ok, thanks');
        };
    };

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.createHooks();
        self.app = express();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
        self.app.post('/telegram/callback',function(req, res, next){
            getRawBody(req, {
                encoding: 'utf8'
            }, function(err, string){
                if (err) return next(err);
                req.text = string;
                next();
            });
        });
        for (var h in self.hooks) {
            // self.app.post(h, bodyParser.json(), bodyParser.urlencoded({extended: true}), self.hooks[h])
            self.app.post(h, self.hooks[h]);
        }
    };

    self.initializeTelegram = function() {
        self.tgbot = new Telegram();
        self.tgbot.initialize();
    };

    self.initializeIRC = function() {
        self.ircbot = new IRC();
        self.ircbot.initialize();
    };

    self.initializeCBs = function(){
      self.tgemitter = self.tgbot.eventEmitter;
      self.tgemitter.on('tgmsg', function(message){
          self.ircbot.receiver(message);
      });
      self.ircemitter = self.ircbot.eventEmitter;
      self.ircemitter.on('ircmsg', function(message){
          self.tgbot.receiver(message);
      });
    };

    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();

        // Initialize bot
        self.initializeTelegram();
        self.initializeIRC();
        self.initializeCBs();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var grammy = new GramBot();
grammy.initialize();
grammy.start();
