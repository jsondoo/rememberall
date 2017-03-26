"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

/* REMEMBER TO CHANGE THIS LINE ON THE PORTAL */
var useEmulator = true; ///(process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

/* GLOBAL VARIABLES */

var initialResponse = "";

bot.dialog('/', [
    function (session, args, next) {
    	if(session.message.text === 'delete'){ // command for resetting name
    		session.userData.name = 0;
    	}

        if (!session.userData.name) {        // session property
            session.beginDialog('/profile'); // initialize's userData.name
        } else {
            next();                          // by passing next as a parameter you can jump to the next function
        }
    },
    function (session, results, next) {
    	session.send('Hello %s!', session.userData.name);
    	session.beginDialog('/firstPrompt');
    },
    function (session, results, next){
    	initialResponse = results.response.toLowerCase();
    	if(initialResponse.includes('remember')){
    		session.beginDialog('/remember');
    	}
    	else if(initialResponse.includes('add')){
    		session.beginDialog('/add');
    	}
    	else{
    		session.send('Sorry, ' + session.userData.name + ' I don\'t recognize your command 😥');
    	}
    }
]);

bot.dialog('/remember', [
	function(session) { // GET request
		session.send('In remember dialog');
		session.endDialog();
	}
]);

bot.dialog('/add', [
	function(session) { // POST request
		session.send('In add dialog');
		session.send('http://i.imgur.com/320J4Wi.png');
		session.endDialog();
	}

]);

bot.dialog('/firstPrompt', [
	function (session) {
		builder.Prompts.text(session, 'Would you like to REMEMBER something or ADD new information?');
	},
	function (session, results){  // not necessary to do this 
		session.endDialogWithResult(results);
	}

]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
    	// if(results.response === "nevermind" || results.response === "cancel"){
    	// 	session.userData.name = null;
    	// 	session.send('test');
    	// 	session.endDialog();
    	// }
    	// else{
            session.userData.name = results.response;
            session.endDialog();
        // } 
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
