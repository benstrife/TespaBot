require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});

const token = process.env.DISCORD_TOKEN;
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
		console.log(displayName(message.member));
		if(!message.member.voiceChannel){
			console.log(message.author.username + ' is not in a voice channel for that server');
		}
		else{
			console.log(message.member.voiceChannel.name);
		}
	},

	helpQueueStatus: function (message, playersInLine){
		if(playersInLine.length == 1){message.author.sendMessage('There is ' + playersInLine.length + ' player in the help queue.');}
		else {message.author.sendMessage('There are ' + playersInLine.length + ' players in the help queue.');}
	},

	nextInLine: function (message, playersInLine){
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
			});
		return playersInLine;
	},

	addAdminRole: function (message, adminRoles){
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
          console.log('The API returned an error: ' + err);
        }
				console.log('Updated admin roles to doc.');
			}
		);
		return adminRoles;
	},

	memberPull: function (message){
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
  			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
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
          console.log('The API returned an error: ' + err);
        }
				console.log('Updated members to doc.');
			}
		);
	},

	count: function (message){
		message.reply('There are currently ' + message.guild.memberCount + ' members in this Guild');
	},

	createRoles: function (message){
		var msgGuild = message.channel.guild;
		sheets.spreadsheets.values.get(
      {
  			auth: oauth2Client,
  			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
  			range: 'Matches!A2:B5',
			},
      function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
				}
				var rows = response.values;
				if(rows.length == 0){
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						for(var j = 0; j <= 1; j++){
							msgGuild.createRole({ name: row[j]})
								.then(role => {
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
		var msgGuild = message.channel.guild;
		var roles = getRoleArray(msgGuild);
		var tID = params[0];
		var sheetID = 0;
		
		//Get the correct spreadsheet that matches the param, tournament ID
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4',
			range: 'Routing!C2:D'
		}, function(err, response){
			if(err){ console.log('The API returned an error: ' + err); }
			var rows = response.values;
			if(rows.length == 0){ console.log('No data found');} 
			else {
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					console.log('Looking for: ' + tID + '; currently on ' + row[0]);
					if(tID == row[0]){
						console.log('Match Found');
						sheetID = row[1];
						break;
					}
				}
				
				// Do the creating of channels
				if(sheetID == 0){
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
							console.log('The API returned an error: ' + err);
						}
						var rows = response.values;
						if(rows.length == 0)
						{
							console.log('No data found');
						} else {
							for (var i = 0; i < rows.length; i++) {
								var row = rows[i];
								var role1 = getRoleID(tID + row[2], roles);
								var role2 = getRoleID(tID + row[5], roles);
								(function(i, role1, role2){
									msgGuild.createChannel(row[0] + '-vs-' + row[3], 'text')
										.then(channel => {
											console.log(`Created new channel ${channel}`); 
											channel.overwritePermissions(msgGuild.id, {READ_MESSAGES: false});
											channel.overwritePermissions(role1, {READ_MESSAGES: true});
											channel.overwritePermissions(role2, {READ_MESSAGES: true});
											//Pinned introduction message
											channel.sendMessage('Welcome teams, ' + row[1] + ' & ' + row[4] + '! This is your match chat channel with your opponent. If you need to reschedule your match, please talk to your opponent here. When you have come to an agreement on a time, one of the teams please enter the command **!reschedule DD/MM/YY HR:MI** in this chat. The other team then can enter **!reschedule approve** or **!reschedule reject**. If you have any questions, feel free to mention your respective game\'s admins');
											channel.createInvite({maxAge: 180}) // Create invite; Edit expir time in Secs 604800
												.then(invite => {
													console.log(`Created invite ${invite}`);
													createChannelsUpdateCell(i+2,invite.toString(),sheetID);
												})
												.catch(console.error);
										})
										.catch(console.error);	
								})(i, role1, role2);
							}
						}
					});
				}
			}
		});
	},
	
	deleteChannels: function (message, params) {
		console.log('Currently deleting channels');
		var msgGuild = message.channel.guild;
		var tID = params[0];
		var sheetID = 0;
		
		//Get the correct spreadsheet that matches the param, tournament ID
		sheets.spreadsheets.values.get({
			auth: oauth2Client,
			spreadsheetId: '1VxFu1rX1TFa-ILkBrv7Tz2bcQwG1_tjtHDPo8XvBKa4',
			range: 'Routing!C2:D'
		}, function(err, response){
			if(err){ console.log('The API returned an error: ' + err); }
			var rows = response.values;
			if(rows.length == 0){ console.log('No data found');} 
			else {
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i];
					console.log('Looking for: ' + tID + '; currently on ' + row[0]);
					if(tID == row[0]){
						console.log('Match Found');
						sheetID = row[1];
						break;
					}
				}
				
				// Do the creating of channels
				if(sheetID == 0){
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
						console.log('The API returned an error: ' + err);
					}
					var rows = response.values;
					if(rows.length == 0)
					{
						console.log('No data found');
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
											console.log('Channel \'' + channel.name + '\' has been deleted');
										})
										.catch(console.error);
								}
							}
						}
					}	
				});
			}	
		}});	
	},

  getBnet: function (message){
    message.author.fetchProfile()
      .then(profile => {
        var conn = profile.connections;
        for( var i of conn){
            console.log(conn[i].type);
        }
    }).catch(console.log);
  },

  assignWeeklyMatches: function(message){
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
					console.log('The API returned an error: ' + err);
				}
				var rows = response.values;
				if(rows.length == 0){
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						var discordID = row[2];
						var roleID = row[3];

            msgGuild.createRole({ name: roleID})
              .then(role => {
                console.log("Created role " + roleID);
                msgGuild.fetchMember(discordID).
                  then(member => {
                    member.addRole(role);
                  });
              })
              .catch(console.error);
					}
				}
			}
		);

    // TODO: Create chat rooms and add role permissions

    message.reply("matches have been created and roles assigned.");
  },

  deleteRoles: function(message){
    deleteRolesByTournamentID(message.channel.guild, "47");
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
