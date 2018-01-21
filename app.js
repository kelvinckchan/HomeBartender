/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
const fetch = require("node-fetch");
var restify = require('restify');
var builder = require('botbuilder');
var azure = require('azure-storage');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

// Intercept trigger event (ActivityTypes.Trigger)
// bot.on('trigger', function (message) {
//     // handle message from trigger function
//     var queuedMessage = message.value;
    
    
    
    
//     var reply = new builder.Message()
//         .address(queuedMessage.address)
//         .text('This is coming from the trigger: ' + queuedMessage.text)
//         .addAttachment({
//                     contentUrl: 'https://docs.botframework.com/en-us/images/faq-overview/botframework_overview_july.png',
//                     contentType: 'image/png',
//                     name: 'Echo'
//                 });
    
 
        
        
//     bot.send(reply);
// });



var ingredCounter=0;

// Handle message from user
bot.dialog('/', [
    // function(session){
        
    //   session.beginDialog('/greeting');
    // },
    //  function (session, results) {
    //     session.beginDialog('/drinkCat');
    // },
    //  function (session, results) {
    //     session.beginDialog('/searchDrink');
    // },
    function (session) {
    var queuedMessage = { address: session.message.address, text: session.message.text, img: session.message.attachments};
    // add message to queue
    session.sendTyping();
    // var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage);
    // queueSvc.createQueueIfNotExists('bot-queue', function(err, result, response){
    //     if(!err){
    //         // Add the message to the queue
    //         var queueMessageBuffer = new Buffer(JSON.stringify(queuedMessage)).toString('base64');
    //         queueSvc.createMessage('bot-queue', queueMessageBuffer, function(err, result, response){
    //             if(!err){
    //                 // Message inserted
    //                 // session.send('Your message (\'' + session.message.text + '\') has been added to a queue, and it will be sent back to you via a Function');
                      

    //     // searchDrinks(session, queuedMessage.text);
        
    //         } else {
    //             // this should be a log for the dev, not a message to the user
    //             session.send('There was an error inserting your message into queue');
    //         }
    //     });
            
    //     } else {
    //         // this should be a log for the dev, not a message to the user
    //         session.send('There was an error creating your queue');
    //     }
    // });
    
          const url = "http://www.thecocktaildb.com/api/json/v1/1/filter.php?i="+ queuedMessage.text;
          console.log("url= "+url);
          
        if (queuedMessage.img.length > 0) {
        recognIngred(session, queuedMessage.img[0].contentUrl);
        }else{
            session.send("Hi, please send a picture of ingredent to get Awsome Drink Recipes!");
        }
    }

]);

var thisingred ;
bot.dialog('/greeting', [
    function (session) {
        builder.Prompts.attachment(session, "Hello, what do you like to drink today?");
    },
    function(session) {
        if (session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image')) {
            
        //  recognIngred(session, queuedMessage.img[0].contentUrl);
        
        const url = "https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/c2143077-392e-441b-b726-9b9ca976593b/url?iterationId=1bda783f-7ec2-47db-b8e8-114e48b423d4";
        fetch(url,{
                  method: "POST",
                  body: '{"url": ' + '"' + txt+ '"}',
                  headers: {
                    "Content-Type": "application/json",
                    "Prediction-Key": "07260dbc756f41bf9038dd3146e9e849"
                  }
        })
        .then((resp) => resp.json()) // Transform the data into json
        .then(function(data) {
            if( data.Predictions){
                var ingred = data.Predictions[0].Tag;
                session.send("Prob: "+data.Predictions[0].Probability);
                if(data.Predictions[0].Probability>0.4){
                    session.send("You want to search for some Awesome drink Recipe with ingredent: " + ingred+"!");
                    // searchDrinks(session,ingred);
                    thisingred = ingred;
                    
                }else{
                    session.send("Sorry, Ingredent Not Found!");
                }
           }
        })
        
        
        }else{
        session.send(session.message.text);    
        }
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);


var alcoholic ;
bot.dialog('/drinkCat', [
    function(session){
        builder.Prompts.choice(session, "Do you prefer an Alcoholic Drink?", "Yes|No");
    },
    function(session,results){
        alcoholic =session.message.text.toLowerCase();
        session.endDialogWithResult(results);
    }
    
]);

bot.dialog('/searchDrink', [
    function(session){
        builder.Prompts.attachment(session, "Search For "+alcoholic+" Drinks with "+thisingred+"...");
    },
    function(session,results){
        searchDrinks(session, thisingred)
        session.endDialogWithResult(results);
    }
    
]);




    function recognIngred(session,txt){    
        const url = "https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/c2143077-392e-441b-b726-9b9ca976593b/url?iterationId=4f093bfd-2d23-45b1-adf9-d2b93d4116c2";
        fetch(url,{
                  method: "POST",
                  body: '{"url": ' + '"' + txt+ '"}',
                  headers: {
                    "Content-Type": "application/json",
                    "Prediction-Key": "07260dbc756f41bf9038dd3146e9e849"
                  }
        })
        .then((resp) => resp.json()) // Transform the data into json
        .then(function(data) {
            if( data.Predictions){
                var ingred = data.Predictions[0].Tag;
                session.send("Prob: "+data.Predictions[0].Probability);
                if(data.Predictions[0].Probability>0.4){
                    session.send("You want to search for some Awesome drink Recipe with ingredent: " + ingred+"!");
                    searchDrinks(session,ingred);
                }else{
                    session.send("Sorry, Ingredent Not Found!");
                }
           }
        })
    }
    
   function searchDrinks(session,ingred) {
        const url = "http://www.thecocktaildb.com/api/json/v1/1/search.php?s="+ingred;
        fetch(url)
            .then((resp) => resp.json()) // Transform the data into json
            .then(function(data) {
                // var recipes = lookup(session, data.drinks);
                 var drink =data.drinks;
                 if( drink ){
         var msg = new builder.Message(session);
          msg.attachmentLayout(builder.AttachmentLayout.carousel);
         
          
          var c = drink.length<4? drink.length:4;
          var cardList=[] ;
        for (var i = 0; i < c; i++) {
          cardList.push(new builder.HeroCard(session)
            .title(drink[i].strDrink)
            .subtitle(drink[i].strCategory)
             .text('Ingredents: ' + drink[i].strIngredient1 + ' ' + drink[i].strMeasure1 + '\n' 
                        + drink[i].strIngredient2 + ' ' + drink[i].strMeasure2 + '\n' 
                        + drink[i].strIngredient3 + ' ' + drink[i].strMeasure3 + '\n' 
                        + drink[i].strIngredient4 + ' ' + drink[i].strMeasure4 + '\n' 
                        + drink[i].strIngredient5 + ' ' + drink[i].strMeasure5 + '\n' 
                        + drink[i].strIngredient6 + ' ' + drink[i].strMeasure6 + '\n' 
                        + drink[i].strIngredient7 + ' ' + drink[i].strMeasure7 + '\n' 
                        + drink[i].strIngredient8 + ' ' + drink[i].strMeasure8 + '\n' 
                        + drink[i].strIngredient9 + ' ' + drink[i].strMeasure9 + '\n' 
                        + drink[i].strIngredient10 + ' ' + drink[i].strMeasure10 + '\n' 
                        )
            .images([builder.CardImage.create(session, drink[i].strDrinkThumb)])
            .buttons([
                builder.CardAction.openUrl(session, "http://www.thecocktaildb.com/drink.php?c="+drink[i].idDrink, "Get "+drink[i].strDrink+" Recipe!" )
            ]));
       
        }
        
         msg.attachments(cardList);
         session.send(msg);  }else{
             session.send("Sorry, Recipe Not Found!");
         } 
        })
    }
 