# TespaBot

## Setup overview

In the following section, you will create your own Discord bot to test upon
locally. You will then add the bot to a new Discord server you create to test
with locally.

## Setup guide

First, create a new directory on your computer for the bot. Clone this repository
into this directory. Next, go to http://https://nodejs.org/en/ and download
v6.9.4 ("recommended for all users" version). Install the executable.

After installation of node and npm, create a file called *vars.env*. Copy the
following four fields into the file. Fields with ___ will be filled in the
following steps.

```
DISCORD_TOKEN=___

GOOGLE_CLIENT_ID=___

GOOGLE_CLIENT_SECRET=___

GOOGLE_CALLBACK=urn:ietf:wg:oauth:2.0:oob
```

First, head to https://discord.gg/developers/ to create a bot. Click on **My Apps**
and create a new app. Create any name and description for the bot and create the
bot. Once created, click **Add a Bot User**. Click to reveal the token and paste
it into the field in *vars.env* titled **DISCORD_TOKEN**, replacing the underscores
that were included above.

Next, we will set up our Google Client fields. Use the following guide to set up
these fields: https://developers.google.com/sheets/api/quickstart/nodejs. Before
running *quickstart.js*, modify the line beginning
```
var SCOPES = ...
```
to
```
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly,
              'https://www.googleapis.com/auth/spreadsheets'];
```

After modifying this line, run *quickstart.js* by executing
```
node quickstart.js
```


Finally, download credentials from the OAuth2 credentials made earlier, found
[https://console.developers.google.com/apis/credentials](here). Name the downloaded
file *client_secret.json* and include it in the Discord Bot directory. Once done,
we are ready to install dependencies.

## Installing dependencies

The following list is all the dependencies that must be installed for the bot to
run.

* npm
* discord.js
- node-fetch
- googleapis
- google-auth-library
- dotenv

To install these dependencies, use the following command:
```
npm install [PACKAGE]
```
where [PACKAGE] is the name of one of the above npm packages. For instance,
installing discord.js would be executed by using:
```
npm install discord.js
```

## Creating a server

Open Discord and create a new server by clicking the + in your server list. Name
the server whatever you want.

After creating the server, enter the following link into your web browser:
```
https://discordapp.com/oauth2/authorize?client_id=[id]&scope=connections%20bot&permissions=0&response_type=code
```
where you replace [id] with your bot's client ID, which is found at the
top of your app's Discord developer page. When done properly, a dialogue with
open in Discord asking which server to add your bot to. Select your newly created
server and the bot will be added to it.

## Testing the bot

Inside of a terminal, enter the following command:
```
node TespaBot.js
```

If done properly, the terminal will print "I am ready!", indicating that you have
successfully set up the bot.

If any of the above is unclear or doesn't work on your machine, message Ben or Zach.
