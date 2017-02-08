require('dotenv').config({path: '/Users/Ben/Desktop/TespaBot/vars.env'});
// node-fetch module
var fetch = require('node-fetch');
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

	overwatchMmr: function(message, params){
    // Retrieve player's BattleTag
		var playerTag = params[0];

    // If the player's BattleTag is undefined,
    // the user most likely did not enter one
    if(playerTag == undefined){
      message.reply('correct usage: !oMMR PlayerName#XXXX');
      return;
    }

    // Split the player's BattleTag
    var playerName = playerTag.split('#')[0];
    var playerNum = playerTag.split('#')[1];

		console.log('Finding Overwatch MMR for ' + playerTag);

    // Retrieve the player's stats for this season
	  fetch('https://owapi.net/api/v3/u/' + playerName + '-' + playerNum + '/stats')
      .then(function(res){
        return res.text();
      }).then(function(body){
        // Parse the webpage response as JSON
        var user = JSON.parse(body);
        // If they don't have a US account, alert the user
    		if(user.us == null) {
    		  message.reply(playerTag + " does not have any games in North America.");
          return;
    		}
    		else {
    			if(typeof user.us.stats.competitive.overall_stats != 'undefined') {
    				var mmr = user.us.stats.competitive.overall_stats.comprank;
    				if(mmr == null){
    				  message.reply(playerTag + " has not placed in ranked this season.");
              return;
    				}
    			}
    			else {
    				message.reply(playerTag + "\'s stats cannot be parsed.");
            return;
    			}
    		}

    		message.reply(playerTag +'\'s mmr is: ' + mmr);
      });
	},

  heroesMMR: function(message, params){
    // Retrieve player's BattleTag
		var playerTag = params[0];
    var leagues = ["Master", "Diamond", "Platinum", "Gold", "Silver", "Bronze"];

    // If the player's BattleTag is undefined,
    // the user most likely did not enter one
    if(playerTag == undefined){
      message.reply('correct usage: !hMMR PlayerName#XXXX');
      return;
    }

    // Split the player's BattleTag
    var playerName = playerTag.split('#')[0];
    var playerNum = playerTag.split('#')[1];

		console.log('Finding Heroes MMR for ' + playerTag);

    // Retrieve the player's stats for this season
	  fetch('https://api.hotslogs.com/Public/Players/1/' + playerName + '_' + playerNum)
    .then(function(res){
      return res.text();
    }).then(function(body){
      // Parse the webpage response as JSON
      var user = JSON.parse(body);

      var response = "";

      if(user == null){
        message.reply(playerTag + ' could not be found.');
      }

      // Construct a single response by concatenating all of a player's MMRs
      for(var i = 0; i < user.LeaderboardRankings.length; i++){
        if(user.LeaderboardRankings[i].LeagueID == null){
          continue;
        }
        response += user.LeaderboardRankings[i].GameMode + ": "
                    + leagues[user.LeaderboardRankings[i].LeagueID]
                    + "[" + user.LeaderboardRankings[i].CurrentMMR + "]";
        response += "; ";
      }

      // Remove the last '; ' from the response then reply
      message.reply(response.substring(0, response.length-2));
    });
	},

	googleCommand: function (message, params){
    let channelName = message.channel.name;
    var rangePrefix = "General";

    switch(channelName.split('_')[0]){
      case "hearthstone":
        rangePrefix = "HS";
        break;
      case "heroes":
        rangePrefix = "HOTS";
        break;
      case "overwatch":
        rangePrefix = "OW";
        break;
      default:
        break;
    }

		var slicedGMsg = message.content.substring(1).toLowerCase();

    // Try once within a specific game's command list
		sheets.spreadsheets.values.get(
      {
				auth: oauth2Client,
				spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
				range: rangePrefix + ' Commands!A2:B',
			},
      function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
				}

				var rows = response.values;
				if(rows.length == 0)				{
					console.log('No data found');
				} else {
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						if (slicedGMsg === row[0])
						{
							message.reply(row[1]);
              return;
						}
					}
				}
			}
		);
	},

	/*
		Finds the team's opponent and sends a reply
	*/
	myOpponent: function (message, params){
		var teams = [];
		var foundBoolean;
		for(var [id,role] of message.member.roles){
			teams.push(role.name);
		}
		sheets.spreadsheets.values.get(
      {
  			auth: oauth2Client,
  			spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
  			range: 'Matches!A2:B',
			},
      function(err, response) {
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
							console.log(row[0] + ' ' + row[1] + ' ' + teams[j]);
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
	},

  /*
  * Reschedule
  */
  reschedule: function (message, params){
    //Confirm time is correct format
    const timeFormat = /^[0-2]\d\/[0-3]\d\/\d\d\s[0-2]\d:\d\d/;
    var time = message.content.substr(12)
    var regTime = timeFormat.exec(message.content.substr(12));
    if(time == 'approve'){
        rescheduleApproval(message);
        return;
    }
    else if(time == 'reject'){
        rescheduleReject(message);
        return;
    }
    else if(!regTime){
        message.reply('Please enter the date time format correctly (DD/MM/YY 00:00)');
        return;
    }

    var tempArray = [message.channel.name, time];
    var sheetArray = [tempArray];

    sheets.spreadsheets.values.append(
    {
      auth: oauth2Client,
      spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
      range:'Reschedule!A2:C',
      valueInputOption: 'USER_ENTERED',
      resource:
      {
        range: 'Reschedule!A2:C',
        majorDimension: 'ROWS',
        values: sheetArray
      }
    },
    function(err, response) {
      if(err){
        console.log('The API returned an error: ' + err);
      }

      console.log('Appended Reschedule command to doc.');
    });
  },

  /**
  * Display available commands in reply to calling user.
  *
  * PARAMETERS
  *   message - the message read by the bot
  *   params - unused in this function
  */
  displayCommands: function(message, params){
    // Grab the channel name immediately
    let channelName = message.channel.name;

    // Assume we are not in a game-specific channel
    var rangePrefix = "General";

    // List of commands avaialable
    var commands = [];

    // Response string to user
    var res = "commands available in this channel: ";

    // Determine which game-specific channel we're in (if any)
    switch(channelName.split('_')[0]){
      case "hearthstone":
        rangePrefix = "HS";
        break;
      case "heroes":
        rangePrefix = "HOTS";
        break;
      case "overwatch":
        rangePrefix = "OW";
        break;
      default:
        // Since we assumed we weren't in a game-specific channel, just break
        break;
    }

    // Retrieve the game-specific sheet we're in (general otherwise)
    sheets.spreadsheets.values.get(
      {
				auth: oauth2Client,
				spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
				range: rangePrefix + ' Commands!A2:B',
			},
      function(err, response) {
				if (err) {
					console.log('The API returned an error: ' + err);
				}
        // Get an array of rows, each element a command in the sheet
				var rows = response.values;

        // Get commands in the game-specific channel
        for(var i = 0; i < rows.length; i++){
          commands.push(rows[i][0]);
        }

        // If we are in a specific channel, still read off general commands
        // that were not overridden
        if(rangePrefix != "General"){
          sheets.spreadsheets.values.get(
            {
      				auth: oauth2Client,
      				spreadsheetId: '1KFcvgsjI_6eCBoltdD50ddWxeLcIGfRBd6LWcKEI_Uw',
      				range: 'General Commands!A2:B',
    				},
            function(err, response) {
    					if (err) {
    						console.log('The API returned an error: ' + err);
    					}

    					var rows = response.values;

              for(var i = 0; i < rows.length; i++){
                // If the command we are looking at hasn't been logged yet
                // (aka not overridden)
                if(commands.indexOf(rows[i][0]) == -1){
                  commands.push(rows[i][0]);
                }
              }
              // Concatenate all commands to our response string
              res += commands.join(", ");

              // Reply to the user with our response
              message.reply(res);
            }
          );
        }
      }
    );
  }
};

//Helper Functions

function rescheduleApproval(message){
  sheets.spreadsheets.values.get(
    {
      auth: oauth2Client,
      spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
      range: 'Reschedule!A2:C',
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
            if(message.channel.name == row[0]){
              if(row[2] == 'Yes'){
                message.reply('Your reschedule has already been approved.');
                return;
              }
              else if(row[2] == 'No'){
                message.reply('Your reschedule has been declined previously, we will now approve the reschedule.');
              }

              var arr = ['Yes'];
              var arrarr = [arr];
              var index = i+2;

              sheets.spreadsheets.values.update(
                {
                  auth: oauth2Client,
                  spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
                  range:'Reschedule!C'+index,
                  valueInputOption: 'USER_ENTERED',
                  resource:
                  {
                    range: 'Reschedule!C'+index,
                    majorDimension: 'ROWS',
                    values: arrarr
                  }
                },
                function(err, response) {
                  if(err){ console.log('The API returned an error: ' + err); }
                  console.log('Approved Reschdule to doc.');
                  message.reply('Your reschedule has been approved.');
                }
              });
          }
        }
        message.reply('You have not submitted a time for rescheduling');
      }
    }
  );
}

function rescheduleReject(message){
  sheets.spreadsheets.values.get(
    {
      auth: oauth2Client,
      spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
      range: 'Reschedule!A2:C',
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
          if(message.channel.name == row[0]){
            if(row[2] == 'Yes'){
              message.reply('Your reschedule was previously approved, we will now reject your reschedule.');
            }
            else if(row[2] == 'No'){
              message.reply('Your reschedule has already been rejected. Please notify an admin');
              return;
            }

            var arr = ['No'];
            var arrarr = [arr];
            var index = i+2;

            sheets.spreadsheets.values.update(
              {
                auth: oauth2Client,
                spreadsheetId: '193MVydHAOMDsEt4duSBg4-ZETTk-IUdsxYxoO_-HrBg',
                range:'Reschedule!C'+index,
                valueInputOption: 'USER_ENTERED',
                resource:
                {
                  range: 'Reschedule!C'+index,
                  majorDimension: 'ROWS',
                  values: arrarr
                }
              },
              function(err, response) {
                if(err){
                  console.log('The API returned an error: ' + err);
                }
                console.log('Approved Reschdule to doc.');
                message.reply('Your reschedule has been rejected! Please contact an admin for the next step forward.');
                return;
              }
            );
          }
        }
      message.reply('You have not submitted a time for rescheduling');
      }
    }
  );
}
