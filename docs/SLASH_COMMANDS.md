# Installing the slash commands
So you have installed the app on your Slack Workspace, now you would like to install the slash commands.
1. Navigate to your app on slack. `https://api.slack.com/apps`.
2. Click on `Slash Commands` from the side menu.
3. Click on `Create New Command`.
4. Fill out the input fields for the slash command.
   eg.
   ```
      Command => `/ask`
      Request URL => `http://{yoursubdomain}.ngrok.io/api/messages`
      Short Description => `Short Description of the command. eg. Ask questions to your team without feeling embarrassed.`
      Usage Hint => `Useful hints for command.  eg. How much do the individual assignments weigh?`
   ```
5. Enable `Escape channels, users, and links sent to your app`.
6. Click `Save`.