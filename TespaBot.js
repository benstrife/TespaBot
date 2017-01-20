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
const btrId = '210605555998392321';

//When Bot is ready to work
bot.on('ready', () => {
  console.log('I am ready!');
  initialize();
});

/*
* When a message is typed in a guild that bot is in
*/
bot.on('message', message => {
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
            spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
            range: 'Members!A2:C',
            }, function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                }
                var rows = response.values;
                if(rows == null)
                {
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
                                spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
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
		When ! is the first character of message,

	*/
	if(message.content[0] === PREFIX)
	{
        /*
        *   Calls Overwatch API to get the competitive MMR of the written player
        *   !oMMR username#idnumber
        *   @everyone in Anywhere
        */
		if(message.content.substr(1,4) === 'oMMR'){
			memberTools.overwatchMmr(message);
		}
        /*
        *   Looks up in a google sheet for the opponent of the author.
        *   !myOpponent
        *   @teamroles in Anywhere
        */
		else if(message.content === '!myOpponent'){
			memberTools.myOpponent(message);
		}
        /*
        *   Adds a reschedule time when called in match channel. Can be called with modifier 'approve' or 'reject' to approve or reject the proposed time
        *   !reschedule DD/MM/YY 00:00 ; !reschedule approve ; !reschedule reject
        *   @teamroles in Match Channel
        */
        else if(message.content.substr(0,11) === '!reschedule'){
            memberTools.reschedule(message);
        }
        /*
        *   Adds author to a queue. Queue is for help from an admin.
        *   !help
        *   @everyone in Anywhere
        */
		else if(message.content === '!help'){
			playersInLine = memberTools.helpQueue(message, playersInLine);
		}
		/*
        *   Pull commands from Google Doc if command is not hard-coded above.
        *   Doc: https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=0
        *   !command
        *   @everyone in Anywhere
        */
		else {
			memberTools.googleCommand(message);
		}
	}
	/*
    *   Only commands that can be called by approved roles or server owner
    */
	if(adminCheck(message)){
        /*
        *   Pulls information on all members in a guild. Writes [user ID, username, all roles]
        *   !memberPull
        *   @adminroles in Anywhere
        */
		if(message.content === '!memberPull'){
			adminTools.memberPull(message);
		}
        /*
        *   DEFUNCT
        *
        *
        */
		else if(message.content === 'a'){
			adminTools.assignRoles(message);
		}
        /*
        *   DEFUNCT
        *
        *
        */
        else if(message.content === 'getBnet'){
            adminTools.getBnet(message);
        }
        /*
        *   Gets the first member in the help queue (PlayersInLine) and sends them to an invite to the voice channel the admin is currently in.
        *   If the admin is not in a voice channel, it tells the admin to get in a voice channel
        *   !nextInLine
        *   @adminroles in Any text channel in a Voice channel
        */
		else if(message.content === '!nextInLine'){
			playersInLine = adminTools.nextInLine(message, playersInLine);
		}
        /*
        *   Gets the number of players in the help queue (PlayersInLine)
        *   !queueNum
        *   @adminroles in Anywhere
        */
		else if(message.content === '!queueNum'){
			adminTools.helpQueueStatus(message, playersInLine);
		}
        /*
        *   Writes the number of members in the Guild.
        *   !count
        *   @adminroles in Anywhere
        */
		else if(message.content === '!count'){
			adminTools.count(message);
		}
        /*
        *   Creates channels based on the matches in a google document and then auto permissions members with the team roles
        *   Generates an invite to the voice channel and adds to the google document.
        *   Doc: https://docs.google.com/spreadsheets/d/193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg/edit#gid=1636783904
        *   !createChannels
        *   @adminroles in Anywhere
        */
		else if(message.content === '!createChannels'){
			adminTools.createChannels(message);
		}
        /*
        *   Creates roles based on all teams that exist in a google doc.
        *   Doc: https://docs.google.com/spreadsheets/d/193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg/edit#gid=192302676
        *   !createRoles
        *   @adminroles in Anywhere
        */
		else if(message.content === '!createRoles'){
			adminTools.createRoles(message);
		}
        /*
        *   Adds all roles that are mentioned in the message to the admins role google doc.
        *   Doc: https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=858544516
        *   !addAdmin @role @optroles
        *   @adminroles in Anywhere
        */
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

/*
* Whenever a user joins a guild
*/
bot.on('guildMemberAdd', member => {
    member.sendMessage('Welcome to the Tespa Compete Discord server! In order to recieve full discord permissions, please reply to me with the email you used on compete.tespa.org');
    var arr = [member.id, member.user.username];
    var arrarr = [arr];
    console.log('Username: ' + member.user.username + ', ID: ' +member.id);
    sheets.spreadsheets.values.append({
        auth: oauth2Client,
        spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
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
* Set Admin Roles from https://docs.google.com/spreadsheets/d/1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw/edit#gid=858544516
*/
function initialize(){
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

// Log Bot into Discord.
bot.login(token);
