// DOTENV module
require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});
// node-fetch module
var fetch = require('node-fetch');
// discord.js module
const Discord = require('discord.js');
// create an instance of a Discord Client, and call it bot
const bot = new Discord.Client();
const token = process.env.DISCORD_TOKEN;

// GOOGLE AUTH
var fs = require('fs');
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';
var google = require('googleapis');
var sheets = google.sheets('v4');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
   process.env.GOOGLE_CLIENT_ID,
   process.env.GOOGLE_CLIENT_SECRET,
   process.env.GOOGLE_CALLBACK
);
fs.readFile(TOKEN_PATH, function(err, googleToken) {
    if (err) {
      console.log('lmao get new token');
	  var gTokenInit = require('GTokenInit.js');
	  gTokenInit.getNewToken(oauth2Client);
    } 
      
	oauth2Client.credentials = JSON.parse(googleToken);
    
});
// END GOOGLE AUTH

//When Bot is ready to work
bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('message', message => {
	
	//Break REMOVE
	if (message.content === 'b'){
		console.log('Breaking');
		process.exit();
	}
	
	if (message.content === 'a'){
		console.log(message.author.username);
		console.log(message.author.discriminator);
		
	}
	
});

// Log Bot into Discord.
bot.login(token);