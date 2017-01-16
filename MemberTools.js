require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});
// node-fetch module
var fetch = require('node-fetch');
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
fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      console.log('lmao get new token');
    } else {
      oauth2Client.credentials = JSON.parse(token);
    }
});

module.exports = {
	//Called when a person wants help. Enters a queue
	helpQueue: function (message, playersInLine){
		for(var index = 0; index < playersInLine.length; index++){
			if(message.author.id == playersInLine[index].id){
				index++;
				message.reply('You are currently position #' + index + ' in queue.');
				return playersInLine;
			}
		}
		playersInLine.push(message.author);
		message.reply('You are now position #' + playersInLine.length + ' in queue');
		return playersInLine;
	},
	
	overwatchMmr: function (message){
		//technowizard-1543
		var slicedMsg = message.content.substr(6).split('#');
		console.log(slicedMsg);
		console.log(slicedMsg[0] + '-' + slicedMsg[1]);
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
			console.log(slicedMsg[0] + '-' + slicedMsg[1]);
			message.reply(slicedMsg[0] + '#' + slicedMsg[1] + '\'s mmr is: ' + mmr);
			//message.author.sendMessage(message.content + '\n' + slicedMsg[0] + '#' + slicedMsg[1] + '\'s mmr is: ' + mmr);
		});
	},
	
	googleCommand: function (message){
		var slicedGMsg = message.content.substr(1).toLowerCase();
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
							if (slicedGMsg === row[0])
							{
								message.reply(row[1]);
							}
						}
					}
				}
			);
	},
	
	/*
		Finds the team's opponent and sends a reply
	*/
	myOpponent: function (message){
		var teams = [];
		var foundBoolean;
		for(var [id,role] of message.member.roles){
			teams.push(role.name);
		}
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
			range: 'Matches!A2:B',
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
						for(var j = 0; j < teams.length; j++){
							console.log(row[0] + ' ' + row[1] + ' ' + teams[j] );
							if (teams[j] == row[0]){ 
								message.reply('Your Opponent is: ' + row[1]); 
								foundBoolean = 1;
								return;
							}
							else if(teams[j] == row[1]){
								message.reply('Your Opponent is: ' + row[0]);
								foundBoolean = 1;
								return;								
							}
						}
					}					
					message.reply('You do not have an opponent this week. If you think this is an error, please contact an admin');
				}
			}
		);
		
		
	}
};

//Hel
