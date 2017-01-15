require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});

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
		sheets.spreadsheets.values.append({
			auth: oauth2Client,
			spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
			range:'Permissions!A2:C',
			valueInputOption: 'USER_ENTERED',
			resource: {
				range: 'Permissions!A2:C',
				majorDimension: 'ROWS',
				values: tempAdminArr
			}
			}, function(err, response) {
				if(err){ console.log('The API returned an error: ' + err); }
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
		sheets.spreadsheets.values.update({
			auth: oauth2Client,
			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
			range:'Discord Members!A2:C',
			valueInputOption: 'USER_ENTERED',
			resource: {
				range: 'Discord Members!A2:C',
				majorDimension: 'ROWS',
				values: memArray
			}
			}, function(err, response) {
				if(err){ console.log('The API returned an error: ' + err); }
				console.log('Updated members to doc.');
			}
		);
	},
		
	count: function (message){
		message.reply('There are currently ' + message.guild.memberCount + ' members in this Guild');
	},
	
	createRoles: function (message){
		var msgGuild = message.channel.guild;
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
						for(var j = 0; j <= 1; j++)
						{
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
	
	createChannels: function (message) {
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
};

/*
	Helper functions for createChannels 
*/
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