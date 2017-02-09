
/*
	Finds the team's opponent and sends a reply
*/
myOpponent: function (message, params){
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


},
