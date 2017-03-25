require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});

const token = process.env.DISCORD_TOKEN;

var logger = require('./Logger.js');
// GOOGLE AUTH
var fs = require('fs');
var TOKEN_DIR = process.env.HOMEDIR + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com.json';
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
	  console.log('You don\'t have a Google Token. Please call \'node GTokenInit.js\' to create a token.');
	  process.exit();
	}
	oauth2Client.credentials = JSON.parse(googleToken);
});

module.exports = {
	assignRoles: function (message){
    logger.log("Assigning roles.");
		console.log(displayName(message.member));
		if(!message.member.voiceChannel){
			console.log(message.author.username + ' is not in a voice channel for that server');
		}
		else{
			console.log(message.member.voiceChannel.name);
		}
	},

	helpQueueStatus: function (message, playersInLine){
    logger.log("Displaying help queue status.");
		if(playersInLine.length == 1){message.author.sendMessage('There is ' + playersInLine.length + ' player in the help queue.');}
		else {message.author.sendMessage('There are ' + playersInLine.length + ' players in the help queue.');}
	},

	nextInLine: function (message, playersInLine){
    logger.log("Advancing help queue.");
		if(playersInLine.length == 0){
			message.author.sendMessage('There are no players in the help queue.');
			return playersInLine;
		}
		if(!message.member.voiceChannel){
			message.author.sendMessage('Please join a voice channel in server: ' + message.channel.guild);
			return playersInLine;
		}
		var customer = playersInLine.shift();
		message.member.voiceChannel.createInvite({maxAge: 300})
			.then(invite => {
					customer.sendMessage(displayName(message.member) + ' will see you right now in voice channel \'' + message.member.voiceChannel.name + '\' in server \'' + message.channel.guild + '\'\r' + 'Here is an invite to the channel (invite will expire in five minutes): ' + invite.toString());
          logger.log("Sent help invite to " + customer.username)
			});
		return playersInLine;
	},

	addAdminRole: function (message, adminRoles){
    logger.log("Adding admin roles.")
		var tempAdminArr = [];
		var index = 0;
		for( var [id, roles] of message.mentions.roles){
			adminRoles.push(id);
			tempAdminArr.push([]);
			tempAdminArr[index][0] = roles.name;
			tempAdminArr[index][1] = id;
			tempAdminArr[index][2] = roles.guild.name;
			index++;
		}
		sheets.spreadsheets.values.append(
      {
  			auth: oauth2Client,
  			spreadsheetId: '1fjDR3RertZHtfuO-EJm5zjC-CP7rP8vL-uSD7GOjd7Y',
  			range:'Permissions!A2:C',
  			valueInputOption: 'USER_ENTERED',
  			resource:
          {
      			range: 'Permissions!A2:C',
      			majorDimension: 'ROWS',
      			values: tempAdminArr
      		}
			},
      function(err, response) {
				if(err){
          logger.error("API error on Google OAuth: " + err);
          console.log('The API returned an error: ' + err);
        }
        logger.log("Roles successfully updated.");
				console.log('Updated admin roles to doc.');
			}
		);
		return adminRoles;
	},

	memberPull: function (message){
    logger.log("Pulling members");
		var guild = message.guild;
		var members = guild.members;
		var memArray = [];
		for (var [key, value] of members) {
			var roleArray = [];
			var roles = value.roles;
			for (var [key1, value1] of roles){ roleArray.push(value1.name); }
			memArray.push([key, value.user.username, roleArray.toString()]);
		}
		sheets.spreadsheets.values.update(
      {
  			auth: oauth2Client,
  			spreadsheetId: '1gaR4hnAU3MQ2D2OYVwDQy7plwybC50ygNNLWw5dbUk0',
  			range:'Discord Members!A2:C',
  			valueInputOption: 'USER_ENTERED',
  			resource:
          {
    				range: 'Discord Members!A2:C',
    				majorDimension: 'ROWS',
    				values: memArray
    			}
			},
      function(err, response) {
				if(err){
          logger.error("API error on Google OAuth: " + err);
          console.log('The API returned an error: ' + err);
        }
        logger.log("Members successfully updated.");
				console.log('Updated members to doc.');
			}
		);
	},

	count: function (message){
    logger.log("Counting members in server: " + message.guild.memberCount);
		message.reply('There are currently ' + message.guild.memberCount + ' members in this Guild');
	},

	createRoles: function (message){
    logger.log("Creating roles.");
		var msgGuild = message.channel.guild;
		sheets.spreadsheets.values.get(
      {
  			auth: oauth2Client,
  			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
  			range: 'Matches!A2:B5',
			},
      function(err, response) {
				if (err) {
          logger.error("API error on Google OAuth: " + err);
					console.log('The API returned an error: ' + err);
				}
				var rows = response.values;
				if(rows.length == 0){
          logger.error("No data found when creating roles.");
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						for(var j = 0; j <= 1; j++){
							msgGuild.createRole({ name: row[j]})
								.then(role => {
                  logger.log(`Created role ${role}`);
									console.log(`Created role ${role}`);
								})
                .catch(console.error);
						}
					}
				}
			}
		);
	},

	createChannels: function (message, params) {
    logger.log("Creating channels.");
		var msgGuild = message.channel.guild;
		var roles = getRoleArray(msgGuild);
		var tID = params[0];
		var sheetID = 0;
		var tName = 0;
		var game = 0;

		if(!tID){
      logger.log("Invalid syntax on createChannels call.");
			message.reply('Please include a tournament ID (ex: !createChannels 10). Tournament IDs can be found in this doc: https://docs.google.com/spreadsheets/d/1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4/edit#gid=0');
			return;
		}

		//Get the correct spreadsheet that matches the param, tournament ID
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4',
			range: 'Routing!A2:D'
		}, function(err, response){
			if(err){
        logger.error("API error on Google OAuth: " + err);
        console.log('The API returned an error: ' + err);
      }
			var rows = response.values;
			if(rows.length == 0){
        logger.error("No data found when creating channels.");
        console.log('No data found');
      }
			else {
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					console.log('Looking for: ' + tID + '; currently on ' + row[0]);
					if(tID == row[2]){
						console.log('Match Found');
						sheetID = row[3];
						tName = row[0];
						game = row[1];
						break;
					}
				}

				// Do the creating of channels
				if(sheetID == 0){
          logger.error("No tournament sheet ID was found for " + tID);
					console.log('No tournament sheet ID was found for ' + tID);
					message.reply('No tournament sheet ID was found for ' + tID + '. Please check this sheet to confirm that you have the correct information: https://docs.google.com/spreadsheets/d/1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4/edit#gid=0');
				}
				else {
					sheets.spreadsheets.values.get({
						auth: oauth2Client,
						spreadsheetId: sheetID,
						range: 'Weekly Matches!A2:F',
					}, function(err, response) {
						if (err) {
              logger.error("API error on Google OAuth: " + err);
							console.log('The API returned an error: ' + err);
						}
						var rows = response.values;
						if(!rows)
						{
              logger.error("No data found for createChannels call on " + tID);
							console.log('No data found for !createChannels '+ tID);
							message.reply('No data found for tournament: '+ tName + '; ID: '+ tID + ' in doc: https://docs.google.com/spreadsheets/d/'+sheetID);

						} else {
							for (var i = 0; i < rows.length; i++) {
								var row = rows[i];
								try {
									var role1 = getRoleID(tID + row[2], roles);
									var role2 = getRoleID(tID + row[5], roles);
								}
								catch (error){
                  logger.error('No role: ' + tID + row[2] + ' OR ' + tID + row[5] + "in createChannels call");
									console.log('No role: ' + tID + row[2] + ' OR ' + tID + row[5]);
									message.reply('There are missing roles. Please make sure that you have called !createRoles on the correct tournament and that your player data tab is complete and current. No role: ' + tID + row[2] + ' OR ' + tID + row[5]);
									return;
								}
								(function(i, role1, role2, row, tName){
									msgGuild.createChannel(row[0] + '-vs-' + row[3], 'text')
										.then(channel => {
											console.log(`Created new channel ${channel}`);
											channel.overwritePermissions(msgGuild.id, {READ_MESSAGES: false});
											channel.overwritePermissions(role1, {READ_MESSAGES: true});
											channel.overwritePermissions(role2, {READ_MESSAGES: true});
											//Confirm Message
											message.reply('Your channels are being created for tournament: '+ tName +'; ID: ' + tID);
											//Pinned introduction message
											channel.sendMessage('Welcome teams, ' + row[1] + ' & ' + row[4] + '! This is your match chat channel for '+ tName +'. Please notify the admins if you need a reschedule by typing the command: **!reschedule DD/MM/YY HR:MI** in this chat. If you have any questions, feel free to mention the '+game+' admins.')
												.then(newMsg => {newMsg.pin();})
												.catch(console.error);
                      logger.log("Created pinned chat message for " + tName);
											channel.createInvite({maxAge: 180}) // Create invite; Edit expir time in Secs 604800
												.then(invite => {
													console.log(`Created invite ${invite}`);
                          logger.log(`Created invite ${invite}`);
													createChannelsUpdateCell(i+2,invite.toString(),sheetID);
												})
												.catch(console.error);
										})
										.catch(console.error);
								})(i, role1, role2, row, tName);
							}
						}
					});
				}
			}
		});
	},

	deleteChannels: function (message, params) {
    logger.log("Deleting channels.");
		console.log('Currently deleting channels');
		var msgGuild = message.channel.guild;
		var tID = params[0];
		var sheetID = 0;
		var tName = 0;

		//Get the correct spreadsheet that matches the param, tournament ID
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4',
			range: 'Routing!A2:D'
		}, function(err, response){
			if(err){
        logger.error("API error on Google OAuth: " + err);
        console.log('The API returned an error: ' + err);
      }
			var rows = response.values;
			if(rows.length == 0){
        console.log('No data found');
        logger.error("No data found in deleteChannels.");
      }
			else {
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					console.log('Looking for: ' + tID + '; currently on ' + row[0]);
					if(tID == row[2]){
						console.log('Match Found');
						sheetID = row[3];
						tName = row[0];
						break;
					}
				}

				// Do the creating of channels
				if(sheetID == 0){
					console.log('No tournament sheet ID was found for ' + tID);
          logger.error("No tournament sheet ID was found for " + tID);
					message.reply('No tournament sheet ID was found for ' + tID + '. Please check this sheet to confirm that you have the correct information: https://docs.google.com/spreadsheets/d/1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4/edit#gid=0');
				}
				else {

				sheets.spreadsheets.values.get({
					auth: oauth2Client,
					spreadsheetId: sheetID,
					range: 'Weekly Matches!A2:F',
				}, function(err, response) {
					if (err) {
            logger.error("API error on Google OAuth: " + err);
						console.log('The API returned an error: ' + err);
					}
					var rows = response.values;
					if(!rows)
					{
						console.log('No data found');
            logger.error("No data found for tournament " + tName + "; ID: " + tID);
						message.reply('No data found for tournament: '+ tName + '; ID: '+ tID + ' in doc: https://docs.google.com/spreadsheets/d/'+sheetID);
					} else {
						for (var i = 0; i < rows.length; i++) {
							var row = rows[i];
							var channelName = row[0].toLowerCase() + '-vs-' + row[3].toLowerCase();
							for( var [str, chn] of msgGuild.channels){
								//console.log('checking ' + channelName)
								if(channelName == chn.name){
									console.log('MATCH for ' + channelName);
									chn.delete()
										.then(channel => {
                      logger.log("Channel \'" + channel.name + "\' has been deleted.");
											console.log('Channel \'' + channel.name + '\' has been deleted');
										})
										.catch(console.error);
								}
							}
						}
						message.reply('Deleting channels for tournament: ' + tName + '; ID: ' + tID);
					}
				});
			}
		}});
	},

  getBnet: function (message){
    logger.log("Fetching B.net account.");
    message.author.fetchProfile()
      .then(profile => {
        var conn = profile.connections;
        for( var i of conn){
            console.log(conn[i].type);
        }
    }).catch(console.log);
  },

  createRoles: function(message, params){
    logger.log("Creating roles.");
    console.log("Creating roles");

    var msgGuild = message.channel.guild;

    // Create roles
    sheets.spreadsheets.values.get(
      {
        auth: oauth2Client,
        spreadsheetId: '1tWxffGMc3-kqaLypqd-mXJhYnbkZ5WonPkJghzvV1ME',
        range: 'Test Roles!A2:D',
      },
      function(err, response) {
        if (err) {
          logger.error("API error on Google OAuth: " + err);
          console.log('The API returned an error: ' + err);
        }
        var rows = response.values;
        if(rows.length == 0){
          logger.error("No data found in createRoles.");
          console.log('No data found');
        } else {
          // The bot searches a sheet for a player's info
          // It assumes the following
          // - The user's discord ID will be in the THIRD row
          // - The user's role ID(s) to create will be in the FOURTH row
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var discordID = row[2];
            var roleIDs = [];
            var roleIDstr = row[3];

            var tempStr = "";
            for(var i = 0; i < roleIDstr.length; i++){
              if(roleIDstr.charAt(i) != " " && roleIDstr.charAt(i) != ","){
                tempStr += roleIDstr.charAt(i);
              }

              if(roleIDstr.charAt(i) == ","){
                roleIDs.push(tempStr);
                tempStr = "";
              }
            }

            roleIDs.push(tempStr);

            console.log("roleIDs for " + discordID + ": " + roleIDs);

            // Split role ids into multiple strings
            for(var i = 0; i < roleIDs.length; i++){
              roleID = roleIDs[i];
              msgGuild.createRole({ name: roleID})
                .then(role => {
                  console.log("Created role " + role);
                  msgGuild.fetchMember(discordID).
                    then(member => {
                      member.addRole(role);
                    });
                })
                .catch(console.error);
            }
          }
        }
      }
    );
  },

  deleteRoles: function(message, params){
    if(params.length == 0){
      logger.log("Delete roles missing parameter.");
      message.reply("please provide the tournament ID for the roles to be deleted.");
    }

    logger.log("Deleting roles.");
    console.log("Deleting roles beginning with " + params[0]);
    deleteRolesByTournamentID(message.channel.guild, params[0]);
  },

  getEmails: function(message, params){
    logger.log("Fetching emails.");
	var msgGuild = message.channel.guild;
	msgGuild.fetchMembers()
	.then(guild => {
		var memberArray = [];
		for(var [id, member] of guild.members){
			member.sendMessage('Welcome to the Tespa Compete Discord server! I\'m the friendly neighborhood TespaBot. I am here to provide you with automated features like weekly match channels and much more. In order for you to recieve full discord permissions, please reply to me with the email you used on compete.tespa.org');
			memberArray.push([member.id, member.user.username + '#' + member.user.discriminator]);
			console.log('Username: ' + member.user.username + ', ID: ' +member.id);
		}
		sheets.spreadsheets.values.append({
			auth: oauth2Client,
			spreadsheetId: '1Vu9oW3rR7rMbEoD5wPy2sqUstKP8-G-BpfoZ2wb46Oc',
			range:'Members!A2:C',
			valueInputOption: 'USER_ENTERED',
			resource: {
				range: 'Members!A2:C',
				majorDimension: 'ROWS',
				values: memberArray
			}
			}, function(err, response) {
				if(err){
          console.log('The API returned an error: ' + err);
          logger.error("API error on Google OAuth: " + err);
        }
				console.log('Appended new member id & username command to doc.');
			});
	})
	.catch(console.error);
  }
};

/*
	Helper functions for createChannels
*/

function createChannelsUpdateCell(cellRow, cellValue, sheetID){
	var cell = 'Weekly Matches!G'+cellRow;
	sheets.spreadsheets.values.update(
	{
		auth: oauth2Client,
		spreadsheetId: sheetID,
		range:cell,
		valueInputOption: 'USER_ENTERED',
		resource:
		{
			range: cell,
			majorDimension: 'ROWS',
			values: [[cellValue]]
		}
		},
	function(err, response) {
			if(err) {
				console.log('The API returned an error: ' + err);
			}
		}
	);
}

function deleteRolesByTournamentID(guild, tournamentID){
  var t_id_length = tournamentID.length;

  var roleArray = Array.from(guild.roles);
  for(var i = 0; i < roleArray.length; i++){
    var role = roleArray[i][1];

    // If the role begins with the tournament id, delete it
    if(role.name.slice(0, t_id_length) == tournamentID){
      role.delete()
        .then(r => {
          console.log("Deleted role " + r);
        })
        .catch(console.error);
    }
  }
}

function displayName(member){
	if(member.nickname){return member.nickname;}
	else{return member.user.username;}
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
