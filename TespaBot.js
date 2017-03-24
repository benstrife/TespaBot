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
var TOKEN_DIR = process.env.HOMEDIR + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com.json';
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sheets = google.sheets('v4');
//var OAuth2 = google.auth.OAuth2;
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(
   process.env.GOOGLE_CLIENT_ID,
   process.env.GOOGLE_CLIENT_SECRET,
   process.env.GOOGLE_CALLBACK
);
fs.readFile(TOKEN_PATH, function(err, googleToken) {
    if (err) {
	  console.log('You don\'t have a Google Token. Please call \'node GTokenInit.js\' to create a token.');
	  process.exit();
	}
	oauth2Client.credentials = JSON.parse(googleToken);
});
// END GOOGLE AUTH

//Import own methods
var adminTools = require('./AdminTools.js');
var memberTools = require('./MemberTools.js');
var logger = require('./Logger.js');

//Globals
var adminRoles = [];
const PREFIX = '!';
var playersInLine = [];
const competeID = '227629384104804352';
const btrID = '279340623310356480';
const TGDiscord = '178940957985603584';

//When Bot is ready to work
bot.on('ready', () => {
  console.log('I am ready!');
  initialize();
  logger.debug("Bot now online.");
});

/*
* When a message is typed in a guild that bot is in
*/
bot.on('message', message => {
	//if(message.channel.guild.id == TGDiscord){return;}
	if(bot.user.id === message.author.id) return;
	if(message.channel.type == 'group' || message.channel.type == 'voice') return;
    /*
    *   DM Channel Commands
    */
    if(message.channel.type == 'dm'){
        /*
        *   Checks to see if the member has linked their discord account to their compete email.
        */
        sheets.spreadsheets.values.get({
            auth: oauth2Client,
            spreadsheetId: '1Vu9oW3rR7rMbEoD5wPy2sqUstKP8-G-BpfoZ2wb46Oc',
            range: 'Members!A2:C',
            }, function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                }
                var rows = response.values;
                if(rows == null)                {
                    console.log('No data found: No members have been found, please check the sheet.');
                } else {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        if(row[0]==message.author.id && !row[2]){
                            var emailRG = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
                            var email = emailRG.exec(message.content);
                            if (!email){
                                message.reply('Please enter a valid email address.');
                                return;
                            }
                            var index = i+2;
                            var cell = 'Members!C'+index;
                            //Update sheet
                            sheets.spreadsheets.values.update({
                                auth: oauth2Client,
                                spreadsheetId: '1Vu9oW3rR7rMbEoD5wPy2sqUstKP8-G-BpfoZ2wb46Oc',
                                range:cell,
                                valueInputOption: 'USER_ENTERED',
                                resource: {
                                    range: cell,
                                    majorDimension: 'ROWS',
                                    values: [[message.content]]
                                }
                                }, function(err, response) {
                                    if(err) {
                                        console.log('The API returned an error: ' + err);
                                    }
                                    message.reply('Your email has been accepted.')
									assignRole(message);
                                }
                            );
                        }
                    }
                }
            }
        );
        /*
        *   Whatever else you want for DMs
        */
    }

	/* 	Text Channel Commands
		When ! is the first character of message.
	*/
	if(message.content[0] === PREFIX)
	{
    execCommand(message);
	}

	//Break REMOVE
	if (message.content === 'b')
	{
		console.log('Breaking');
		process.exit();
	}
});

/*
* Whenever a user joins a guild
*/
bot.on('guildMemberAdd', member => {
	if(member.guild.id == TGDiscord)return;
    member.sendMessage('Welcome to the Tespa Compete Discord server! I\'m the friendly neighborhood TespaBot. I am here to provide you with automated features like weekly match channels and much more. In order for you to recieve full discord permissions, please reply to me with the email you used on compete.tespa.org');
    var arr = [member.id, member.user.username + '#' + member.user.discriminator];
    var arrarr = [arr];
    console.log('Username: ' + member.user.username + ', ID: ' +member.id);
    sheets.spreadsheets.values.append({
        auth: oauth2Client,
        spreadsheetId: '1Vu9oW3rR7rMbEoD5wPy2sqUstKP8-G-BpfoZ2wb46Oc',
        range:'Members!A2:C',
        valueInputOption: 'USER_ENTERED',
        resource: {
            range: 'Members!A2:C',
            majorDimension: 'ROWS',
            values: arrarr
        }
        }, function(err, response) {
            if(err){ console.log('The API returned an error: ' + err); }
            console.log('Appended new member id & username command to doc.');
        });

});

/*
* void execCommand(message)
*
* Parses user input and executes commands if the input was valid.
* This function assumes that the message started with the PREFIX symbol.
*
* PARAMETERS:
*   message - a user-written messaged
*/
function execCommand(message){
  var userInput = message.content.split(' ');
  var command = userInput[0].substring(1);
  var params = [];

  for(var i = 1; i < userInput.length; i++){
    params.push(userInput[i]);
  }

  // Check to see if the user has admin privileges
  if(adminCheck(message)){
    switch(command){
      /*
      *   Pulls information on all members in a guild. Writes [user ID, username, all roles]
      *   !memberPull
      *   @adminroles in Anywhere
      */
      case 'memberPull':
        adminTools.memberPull(message, params);
        break;
      /*
      *   Gets the first member in the help queue (PlayersInLine) and sends them to an invite to the voice channel the admin is currently in.
      *   If the admin is not in a voice channel, it tells the admin to get in a voice channel
      *   !nextInLine
      *   @adminroles in Any text channel in a Voice channel
      */
      case 'nextInLine':
        playersInLine = adminTools.nextInLine(message, playersInLine, params);
        break;
      /*
      *   Gets the number of players in the help queue (PlayersInLine)
      *   !queueNum
      *   @adminroles in Anywhere
      */
      case 'queueNum':
        adminTools.helpQueueStatus(message, playersInLine, params);
        break;
      /*
      *   Writes the number of members in the Guild.
      *   !count
      *   @adminroles in Anywhere
      */
      case 'count':
        adminTools.count(message, params);
        break;
      /*
      *   Creates channels based on the matches in a google document and then auto permissions members with the team roles
      *   Generates an invite to the voice channel and adds to the google document.
      *   Doc: https://docs.google.com/spreadsheets/d/193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg/edit#gid=1636783904
      *   !createChannels
      *   @adminroles in Anywhere
      */
      case 'createChannels':
        adminTools.createChannels(message, params);
        break;
	  case 'deleteChannels':
		adminTools.deleteChannels(message, params);
		break;
      /*
      *   Creates roles based on all teams that exist in a google doc.
      *   Doc: https://docs.google.com/spreadsheets/d/193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg/edit#gid=192302676
      *   !createRoles
      *   @adminroles in Anywhere
      */
      case 'createRoles':
        adminTools.createRoles(message, params);
        break;
      /*
      *   Adds all roles that are mentioned in the message to the admins role google doc.
      *   Doc: https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=858544516
      *   !addAdmin @role @optroles
      *   @adminroles in Anywhere
      */
      case 'addAdmin':
        adminRoles = adminTools.addAdmin(message, adminRoles, params);
        break;

      case 'endTournament':
        adminTools.deleteRoles(message, params);
        break;
	  case 'getEmails':
		adminTools.getEmails(message, params);
		break;
    }
  }

  // Non-admin commands
  switch(command){
    case "oMMR":
      memberTools.overwatchMmr(message, params);
      break;
    case "hMMR":
      memberTools.heroesMMR(message, params);
      break;
    case "myOpponent":
      memberTools.myOpponent(message, params);
      break;
    case "reschedule":
      memberTools.reschedule(message, params);
      break;
    case "adminhelp":
      playersInLine = memberTools.helpQueue(message, playersInLine, params);
      break;
    case "help":
      memberTools.displayCommands(message, params);
      break;
    default:
      memberTools.googleCommand(message, params);
      break;
  }
}

/*
* Set Admin Roles from https://docs.google.com/spreadsheets/d/1fjDR3RertZHtfuO-EJm5zjC-CP7rP8vL-uSD7GOjd7Y/edit#gid=0
*/
function initialize(){
	sheets.spreadsheets.values.get({
		auth: oauth2Client,
		spreadsheetId: '1fjDR3RertZHtfuO-EJm5zjC-CP7rP8vL-uSD7GOjd7Y',
		range: 'Permissions!B2:B',
		}, function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
			}
			var rows = response.values;
			if(rows == null)			{
				console.log('No data found: No Admin Roles');
			} else {
				for (var i = 0; i < rows.length; i++) {
					adminRoles.push(rows[i][0]);
				}

        console.log('Admin Roles initialized');
			}
		}
	);
}

/*
*	Checks to see if the messenge is from an approved role or is the owner of the guild
*/
function adminCheck(message){
	if(message.channel.type != 'text') return;
  if(message.guild.ownerID == message.author.id){return true;}
	if(message.author.id == '105041932459184128'){return true;}

	for(let [id, roles] of message.member.roles){
		for (var index = 0; index < adminRoles.length; index++){
			if(id == adminRoles[index]){return true;}
		}
	}
	return false;
}

/*
* Assigns roles to user in Compete Discord after they respond to the PM with their email
* Don't use message.reply because this is the user's DM
*/
function assignRole(message){
  logger.debug("Assigning roles to " + message.author.toString());

	var activeTourn = [];
	var email = message.content;
	var author = message.author;
	var competeGuild = getCompeteGuild();
	console.log('Starting assignRole' + competeGuild);
	sheets.spreadsheets.values.get({
		auth: oauth2Client,
		spreadsheetId: '1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4',
		range: 'Routing!A2:G',
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
		}
		var rows = response.values;
		if(rows == null)			{
			console.log('No data found: No tournaments found');
		} else {
			console.log('give me the confirm');
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				console.log(row[6]);
				if (row[6]){
					activeTourn.push(rows[i]);
					console.log('1: Active: ' + row[6]);
				}
			}
			if(activeTourn == []) {
				console.log('didnt find an active tournament');
				return;
			}
			for(var tourn of activeTourn){
				console.log('in activeTourn' + tourn);
				(function(tourn){
					sheets.spreadsheets.values.get({
						auth: oauth2Client,
						spreadsheetId: tourn[3],
						range: 'Player Data!A2:C',
					}, function(err, response) {
						if (err) {
							console.log('The API returned an error: ' + err);
						}
						var rows = response.values;
						if(rows == null)			{
							console.log('No data found: No player data found for '+tourn[0]);
						} else {
							console.log('In tournament: ' + tourn[0]);
							for(j = 0; j < rows.length; j++){
								var row = rows[j];
								if(email == row[1]){
									console.log('Found email in: ' + tourn[0] + ' EMail: ' + email);
									var currectRole;
									for(var [key,role] of competeGuild.roles){
										if(role.name == tourn[2]+row[2]){
											currectRole = key;
											console.log('key is ' + key);
											break;
										}
									}
									if(!currectRole){
										console.log('No role created called: ' + tourn[2]+row[2]);
									}
									else{
										(function(currectRole){
											console.log('here');
											competeGuild.fetchMember(author)
											.then(member => {
												member.addRole(currectRole)
												.then(roledMember =>
                          logger.debug("Roles given to " + message.author.toString()))
												.catch(console.error);
											})
											.catch(console.error);
										})(currectRole);
									}

								}
							}
						}
					});
				})(tourn);
			}
		}
	});
}

function getCompeteGuild(){
	var guilds = bot.guilds;
	for(var [key,guild] of guilds){
		console.log('Key: '+key+' guild id: ' + guild.id + ' guild: ' + guild);
		//if(guild.id == competeID)
		if(guild.id == btrID)
			return guild;
	}
}




























// Log Bot into Discord.
bot.login(token);
