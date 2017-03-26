"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require('request');

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
var url = 'http://rememberall17.azurewebsites.net/api/';

bot.dialog('/', [
    function (session, args, next) {
        session.beginDialog('/profile'); // initialize's userData.name with facebook name                    
    },
    function (session, results, next) {
        session.send('Hello %s!', session.userData.name);
        session.beginDialog('/button');
    }
]);
 
bot.dialog('/button', [
    function (session, results){
        msg='';
        var card = new builder.HeroCard(session)
        .title('Choose what you want to do 🤔')
        .buttons([
            builder.CardAction.dialogAction(session, "help", 'help', 'What are you?'),
            builder.CardAction.dialogAction(session, "remember",'remember','Remember something!'),
            builder.CardAction.dialogAction(session, "add",'add','Add something new!')
        ]);
 
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        session.endDialog();
    }
]);

bot.beginDialogAction('remember', '/remember');
bot.beginDialogAction('add', '/add');
bot.beginDialogAction('help', '/help');

bot.dialog('/help', [
    function(session){
        session.send("My name is Rememberall! I am your personal bot that is here to help you remember anything you want - academic related, event reminders, etc."
            + " Click on one of the other buttons to try me 😇");
          session.endDialog();
    }
]);
 
bot.dialog('/remember', [
    function(session) {
        builder.Prompts.text(session, 'What are you trying to remember, ' + session.userData.name + ' ?');
    },
    function (session, results){
        var thingToRemember = results.response;
        var userID = session.message.user.id;
        
        // POST request 
        var data = {
            "user": userID,
            "query":thingToRemember
        };
        var addUrl = url + 'remember';
        var callback = function(err, response, body) {
            console.log("Callback");
            console.log(err);
            // console.log(response);
            var parsedData = JSON.parse(body);
            var descriptionReturned = parsedData[0].description;
            var contentReturned = parsedData[0].content;
            console.log(body);


            session.send("Is this what you were trying to remember?");
            session.send("Description: " + JSON.stringify(descriptionReturned));
            session.send("Content: " + JSON.stringify(contentReturned));
            session.endDialog();
        }; 
        request.post(addUrl, {form: data}, callback);
    }
]);
 
bot.dialog('/add', [
    function(session) {
        builder.Prompts.text(session, 'Can you please describe what you would like to add?');
    },
    function (session, results){
        addDescription = results.response;
        builder.Prompts.text(session, 'What would you like to remember ' + session.userData.name + ' ?');
    },
    function (session, results){        
        thingToAdd = results.response;
        var userID = session.message.user.id;  
        session.send(thingToAdd + ': ' + addDescription);
        
        // POST request 
        var data = {
            "user": userID,
            "description": addDescription,
            "content": thingToAdd
        };
        var addUrl = url + 'add';
        var callback = function(err, response, body) {
            console.log("Callback");
            console.log(err);
            // console.log(response);
            // console.log(body);
            session.endDialog();
        }; 
        console.log("Data is:");
        console.log(data);
        request.post(addUrl, {form: data}, callback);

        session.send("Thanks! I will keep that in mind 🙌");
        session.endDialog();
    }
]);
 

bot.dialog('/profile', [
    function (session) {
        var fbName = session.message.user.name;
        session.userData.name = fbName;
        session.endDialog();
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