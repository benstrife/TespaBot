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
	if (message.content === 'b')
	{
		console.log('Breaking');
		process.exit();
	}
	
	if (message.content === 'a')
	{
		var msgGuild = message.channel.guild;
		var roles = getRoleArray(msgGuild);
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
			range: 'Matches!A2:B5',
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
						var role1 = getRoleID(row[0], roles);
						var role2 = getRoleID(row[1], roles);
						(function(i, role1, role2){
							msgGuild.createChannel(row[0] + '-vs-' + row[1], 'text')
								.then(channel => {
									console.log(`Created new channel ${channel}`); 
									channel.overwritePermissions(msgGuild.id, {READ_MESSAGES: false});
									channel.overwritePermissions(role1, {READ_MESSAGES: true});
									channel.overwritePermissions(role2, {READ_MESSAGES: true});
									channel.createInvite({maxAge: 180}) // Create invite; Edit expir time in Secs
										.then(invite => {
											console.log(`Created invite ${invite}`);
											updateCell(i+2,invite.toString());
										})
										.catch(console.error);
								})
								.catch(console.error);	
						})(i, role1, role2);
					}
				}
			}
		);	
	}
	
	
});

function updateCell(cellRow, cellValue){
	var cell = 'Matches!C'+cellRow;
	sheets.spreadsheets.values.update({
		auth: oauth2Client,
		spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
		range:cell,
		valueInputOption: 'USER_ENTERED',
		resource: {
			range: cell,
			majorDimension: 'ROWS',
			values: [[cellValue]]
		}
		}, function(err, response) {
			if(err) {
				console.log('The API returned an error: ' + err);
			}
		}
	);
}

function getRoleArray(msgGuild){
	roleArray = [];
	for(var [key,value] of msgGuild.roles){
		roleArray.push([key,value.name])
	}
	return roleArray;
}

function getRoleID(name, roleArray){
	for(var [key, value] of roleArray){
		if(value === name){
			return key;
		}
	}
	throw 'No Role in Guild';
}


// Log Bot into Discord.
bot.login(token);