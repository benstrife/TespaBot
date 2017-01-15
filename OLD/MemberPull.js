require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});


// import the discord.js module
const Discord = require('discord.js');
// create an instance of a Discord Client, and call it bot
const bot = new Discord.Client();
// the token of your bot - https://discordapp.com/developers/applications/me
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
//access_token: "ya29.GlutA79RNAy56Y2c7Q6l6OUE38-k-1jB0RObLRn-R3OrwIRBUfRLtBOMNQGuX0SwpBB-DSEW9vDHKp6_IV7bcjfXDgu_x504Vd82OY2bJrfz5-2RfsZIagN88TBl",
//refresh_token: "1/Chn-adAWcCfy4WO-jID9esiifaQciiCeb4nq1D8eLXRKLWSEtdtAB4HSKcGDtwc8"
// END GOOGLE AUTH

bot.on('ready', () => {
  console.log('I am ready!');
});


bot.on('message', message => {
	
	if(message.content === 'init')
	{
		var guild = message.guild;
		var members = guild.members;
		var memArray = [];
		
		for (var [key, value] of members) {
			var roleArray = [];
			var roles = value.roles;
			for (var [key1, value1] of roles)
			{
				roleArray.push(value1.name);
			}
			memArray.push([key, roleArray.toString()]);
		}
	
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
			range:'Sheet1!A2:C'
			}, function(err, response) {
				if(err) {
					console.log('The API returned an error: ' + err);
				}
				
				var rows = response.values;
				if(rows.length == 0)
				{
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						console.log('%s %s', row[0], row[2])
						members.get(row[0]).setRoles([row[2]]);
					}
				}				
				
				console.log('Updated members from doc.');
				
			}
		);
		
	}
	
	
	
	if (message.content === 'b')
	{
		console.log('Breaking');
		process.exit();
	}
	
});





// log our bot in
bot.login(token);