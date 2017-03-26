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
var thingToAdd = "";
var addDescription = "";

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
	function(session) { 
		builder.Prompts.text(session, 'What are you trying to remember?');
    },
    function (session, results){
		// TODO send POST request with
		// userID, thingToRemember
		var thingToRemember = results.response;
		var userID = session.message.user.id;	
		session.send('Your user ID is ' + userID);
		session.send('Searching for ' + thingToRemember);

		session.endDialog();
	}
]);

bot.dialog('/add', [
	function(session) { 
		builder.Prompts.text(session, 'What would you like to add?');
	},
	function (session, results){
		thingToAdd = results.response;
		builder.Prompts.text(session, 'Can you please describe what ' + thingToAdd + ' is?');
	},
	function (session, results){
		addDescription = results.response;

		// TODO send POST request with
		// userID, thingToAdd, add Description
		var userID = session.message.user.id;	
		session.send('Your user ID is ' + userID);
		session.send(thingToAdd + ': ' + addDescription);
		
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
