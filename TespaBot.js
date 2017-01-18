// DOTENV module
require('dotenv').config({path: './vars.env'});
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

//Import own methods
var adminTools = require('./AdminTools.js');
var memberTools = require('./MemberTools.js');

//Globals
var adminRoles = [];
const PREFIX = '!';
var playersInLine = [];

//When Bot is ready to work
bot.on('ready', () => {
  console.log('I am ready!');
  initialize();
});

//When a message is typed in a guild that bot is in
bot.on('message', message => {
	if(bot.user.id === message.author.id) return;
	if(message.channel.type != 'text') return;
	/* 	Commands
		When ! is the first character of message, it will pull from below document and reply with assossicated message.
		Doc: https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=0
	*/
	if(message.content[0] === PREFIX)
	{
		if(message.content.substr(1,4) === 'oMMR'){
			memberTools.overwatchMmr(message);
		}
		else if(message.content === '!myOpponent'){
			memberTools.myOpponent(message);
		}
		else if(message.content === '!help'){
			playersInLine = memberTools.helpQueue(message, playersInLine);
		}
		//Pull commands from Google Doc
		else {
			memberTools.googleCommand(message);
		}
	}
	
	if(adminCheck(message)){
		if(message.content === '!memberPull'){
			adminTools.memberPull(message);
		}
		else if(message.content === 'a'){
			adminTools.assignRoles(message);
		}
		else if(message.content === '!nextInLine'){
			playersInLine = adminTools.nextInLine(message, playersInLine);
		}
		else if(message.content === '!queueNum'){
			adminTools.helpQueueStatus(message, playersInLine);
		}
		else if(message.content === '!count'){
			adminTools.count(message);
		}
		else if(message.content === '!createChannels'){
			adminTools.createChannels(message);
		}
		else if(message.content === '!createRoles'){
			adminTools.createRoles(message);
		}
		var slicedAAMsg = message.content.substr(0,9)
		if(slicedAAMsg === '!addAdmin'){
			adminRoles = adminTools.addAdminRole(message, adminRoles);
		}
	}
	
	//Break REMOVE
	if (message.content === 'b')
	{
		console.log('Breaking');
		process.exit();
	}
});

function initialize(){
	//Set Admin Roles from https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=858544516
	sheets.spreadsheets.values.get({
		auth: oauth2Client,
		spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
		range: 'Permissions!B2:B',
		}, function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
			}
			var rows = response.values;
			if(rows == null)
			{
				console.log('No data found: No Admin Roles');
			} else {
				for (var i = 0; i < rows.length; i++) { 
					adminRoles.push(rows[i][0]);
				}
			}
		}
	);
}

/*
	Checks to see if the messenge is from an approved role or is the owner of the guild
*/
function adminCheck(message){
	if(message.guild.ownerID == message.author.id){return true;}
	if(message.author.id == '105041932459184128'){return true;}
	for( var [id, roles] of message.member.roles){
		for (var index = 0; index < adminRoles.length; index++){
			if(id == adminRoles[index]){return true;}
		}
	}
	return false;
}

// Log Bot into Discord.
bot.login(token);