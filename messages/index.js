"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require('request');
//require('request-debug')(request);
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
            builder.CardAction.dialogAction(session, "add",'add','Create new memory!')
        ]);
 
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        session.endDialog();
    }
]);

// button dialogs
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
        userID = "123";
        // POST request 
        var data = {
            "user": userID,
            "query":thingToRemember
        };
        var rememberUrl = url + 'remember';

        var callback = function(err, response, body) {
            console.log("Callback");
            console.log(err);
            console.log("Body: " + body);
            var parsedBody = JSON.parse(body);
            console.log(parsedBody.description);
            console.log(parsedBody.content);

            var description = parsedBody.description;
            var content = parsedBody.content;

            session.send("This is the best match I found 🍻");
            session.send("Description: " + description);
            session.send("Content: " + content);
            // console.log(response);
            // console.log(body);
            session.endDialog();
        }; 
        // var callback = function(err, response, body) {
        //     console.log("Callback");
        //     console.log(err);
        //     //console.log(response);
        //     var parsedData = body;
        //     console.log('BODY' + body);

        //     if(parsedData.description !== undefined){
        //     var descriptionReturned = parsedData[0].description;
        //     var contentReturned = parsedData[0].content;
        //     console.log(body);
        //     }


        //     session.send("This is the best match I found 🍻");
        //     session.send("Description: " + JSON.stringify(descriptionReturned));
        //     session.send("Content: " + JSON.stringify(contentReturned));
        //     session.endDialog();
        // }; 
        request.post(rememberUrl, {form: data}, callback);
    }
]);
 
bot.dialog('/add', [
    function(session) {
        builder.Prompts.text(session, 'What do you want to remember?');
    },
    function (session, results){
        addDescription = results.response;
        // TODO reword this?
        builder.Prompts.text(session, 'Tell me the data you want to remember, ' + session.userData.name + '.');
    },
    function (session, results){        
        thingToAdd = results.response;
        var userID = session.message.user.id; 
        

        userID = "123";
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