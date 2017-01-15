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

//Import own methods
var admin = require('./AdminTools.js');

//Globals
var adminRoles = [];

//When Bot is ready to work
bot.on('ready', () => {
  console.log('I am ready!');
  initialize();
});

//When a message is typed in a guild that bot is in
bot.on('message', message => {
	
	/* 	Commands
		When ! is the first character of message, it will pull from below document and reply with assossicated message.
		Doc: https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=0
	*/
	if(message.content.substr(0,1) === '!')
	{
		var slicedMsg = message.content.substr(1).toLowerCase();
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
			range: 'OW Commands!A2:B',
			}, function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
				}
				var rows = response.values;
				if(rows.length == 0)
				{
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						if (slicedMsg === row[0])
						{
							message.reply(row[1]);
						}
					}
				}
			}
		);
	}
	
	if(message.content.substr(0,1) === 'o')
	{
		//technowizard-1543
		var slicedMsg = message.content.substr(2).split('#');
		fetch('https://owapi.net/api/v3/u/' + slicedMsg[0] + '-' + slicedMsg[1] + '/stats')
		.then(function(res) {
			return res.text();
		}).then(function(body) {
			//console.log(body);
			var user = JSON.parse(body);
			if(user.us == null) {
			  var mmr = -1;
			}
			else {
				if(typeof user.us.stats.competitive.overall_stats != 'undefined') {
					var mmr = user.us.stats.competitive.overall_stats.comprank
					if(mmr == null){
					  mmr = 0;
					}
				}
				else {
					mmr = -2;
				}
			}
			message.reply(slicedMsg[0] + '#' + slicedMsg[1] + '\'s mmr is: ' + mmr);
			//message.author.sendMessage(message.content + '\n' + slicedMsg[0] + '#' + slicedMsg[1] + '\'s mmr is: ' + mmr);
		});
	}
	
	if(adminCheck(message)){
		if(message.content === 'init'){
			admin.memberPull(message);
		}
		else if(message.content === 'count'){
			admin.count(message);
		}
		var slicedMsg = message.content.substr(0,8)
		if(slicedMsg === 'addAdmin'){
			adminRoles = admin.addAdminRole(message, adminRoles);
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