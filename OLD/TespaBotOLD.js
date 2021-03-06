require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});
//node-fetch module
var fetch = require('node-fetch');
// import the discord.js module
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
    } else {
      oauth2Client.credentials = JSON.parse(googleToken);
    }
});
// END GOOGLE AUTH


bot.on('ready', () => {
  console.log('I am ready!');
});


bot.on('message', message => {
  //Break
  if (message.content === 'b')
  {
	  console.log('Breaking');
	  process.exit();
  }

  if(message.content === '+help')
  {
	  message.author.sendMessage('here is our help list');
	  message.delete();
  }
  
  
  if(message.content === 'This is hygenic!!!')
  {
	  message.reply('She showers with pantene. But Ive got watermelo\'n to keep me clean https://i.gyazo.com/03928bb39c5c827a2168233516e92cd2.png');
  }
  
	if(message.content.substr(0,1) === 'q')
	{
		var slicedMsg = message.content.substr(1).toLowerCase();
		if(slicedMsg === 'about' || slicedMsg === 'tespa')
		{
			message.reply('You can learn more about Team Tespa on our website: https://tespa.org/about');
		}
		else if(slicedMsg === 'ladder')
		{
			message.reply('You can find the standings here: https://compete.tespa.org/brackets');
		}
		else if(slicedMsg === 'casters')
		{
			message.reply('Jamerson @jetsetjamerson, Josh @PiscatorJosh, and Seamus @Seamoose1 are joining us on the caster desk today!');
		}
		else if(slicedMsg === 'google')
		{
			sheets.spreadsheets.values.get({
				auth: oauth2Client,
				spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
				range: 'Commands!A2:E',
			  }, function(err, response) {
				if (err) {
				  console.log('The API returned an error: ' + err);
				  return;
				}
				var rows = response.values;
				if (rows.length == 0) {
				  console.log('No data found.');
				} else {
				  console.log('Name, Response:');
				  for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					// Print columns A and E, which correspond to indices 0 and 4.
					console.log('%s, %s', row[0], row[1]);
				  }
				}
			});
		}
	}
	
	if(message.content.substr(0,1) === '!')
	{
		// Commands pulled from here: https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=0
		//console.log('in !');
		var slicedMsg = message.content.substr(1).toLowerCase();
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
			range: 'OW Commands!A2:B',
			}, function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
				}
				//console.log('in function');
				var rows = response.values;
				if(rows.length == 0)
				{
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						//Actual code
						//console.log('in else ' +slicedMsg + ' = ' + row[0]);
						if (slicedMsg === row[0])
						{
							//console.log('in if ' + row[1]);
							message.reply(row[1]);
						}
					}
				}
			}
		);
		
		
	}
	
	if(message.content === 'z')
	{
		sheets.spreadsheets.values.update({
			auth: oauth2Client,
			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
			range:'Sheet1!A1:A6',
			valueInputOption: 'USER_ENTERED',
			resource: {
				range: 'Sheet1!A1:A6',
				majorDimension: 'ROWS',
				values: [['bae'],['a'],['lel']]
			}
			}, function(err, response) {
				if(err) {
					console.log('The API returned an error: ' + err);
				}
			}
		);
	}

	if(message.isMentioned('253684834197700610')) //<- id for @overwatch admin in BTR
	{
		message.author.sendMessage('please stop tagging the OW Admins in messages, we dont need your PMs');
	}
	if(message.isMentioned('253628256312492046'))
	{
		message.author.sendMessage('hey bae');
	
	}
	
	//overwatch stats | using https://github.com/SunDwarf/OWAPI/blob/master/api.md
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
	
 
});

// log our bot in
bot.login(token);