const Discord = require('discord.js');
const bot = new Discord.Client();
const commandPrefix = "!i";

bot.on('ready', () => {
    bot.user.setStatus('available') // Can be 'available', 'idle', 'dnd', or 'invisible'
    bot.user.setPresence({
        game: {
            name: 'PRAISE GERALD',
            type: 2
        }
    });
});   


const token = 'NjcxMTU2MTMwNDgzMDExNjA1.XszgVg.SLrHn6JHfAecf0K9CnuPHoEBn7w';

bot.on('ready', () =>{
    console.log('Preparing to take over the world...');
    console.log('World domination complete.');
    console.log('ONLINE');
    console.log(`Logged in as ${client.user.tag}!`);
   // Client.guilds.get("576344535622483968").channels.get("588221105710432286").send("Hello there.")
})

bot.on('message', msg=>{
    switch(msg.content){
//-----------------------No prefix commands here------------------------------------
        case "HELLO":
            msg.reply('HELLO FRIEND'); 
            break;
        case "Bonjour":
            msg.reply('i like french bread');
            break;
        case "Should toast rob no?":
            msg.reply('no');
            break;
             case "Bonjour":
            msg.reply('i like french bread');
            break;
        case "Gerald":
            msg.reply('that is me');
            break;
        case "PRAISE GERALD":
             msg.reply('Yes');
            break;
            case "ÞĬļɶɫʋʑʕ":
                msg.reply('ÞĬļɶɫʋʑʕ');
                console.log('dafaq');
               break;
        case "hi":
            msg.reply('Why hello there.');
            break;
         case "NI":
            msg.channel.sendMessage('NI');
            console.log('NI');
            break;
        case "ÝƏƏ":
            msg.reply('ÝƏƏ');
            console.log('dafaq');
            break;
//--------------------------------End no prefix commands here---------------------------------
        default:
            checkCommand(msg);
            break;
    }
})


bot.login(token);

function checkCommand(msg){
    try{
        if(msg.content.startsWith(commandPrefix)){
            var command = msg.content.replace(commandPrefix, '');
            switch(command){
//-----------------------Prefix commands here------------------------------------
                case "invite":
                    msg.channel.sendMessage('Add me to your server with https://discordapp.com/oauth2/authorize?client_id=671156130483011605&scope=bot&permissions=8');
                break;
                case "ledie":
                    throw "You broke it, good job.";
                break;
                case "admin":
                    msg.channel.sendMessage('ACCESS DENIED');
                break;
                case "backflip":
                    msg.channel.sendMessage('**does a backflip**');
                break;
                //case "cookie":
                  //  msg.channel.sendMessage('no cookie for u 1 year');
                    //console.log('cookie denied');
               // break;
                //case "bread":
                  //  msg.channel.sendMessage('donate le bread pls');
                    //console.log('bread shipment imbound');
                //break;
                case "emerald":
                    msg.channel.sendMessage('Zac currently has mined **224644** emeralds! (27/5/2020) Check his status for his position.');
                break;
                case "help":
                    msg.channel.sendMessage('The link to join my creators discord is https://discord.gg/Y2EtATM');
                    msg.channel.sendMessage('Invite me with https://discordapp.com/oauth2/authorize?client_id=671156130483011605&scope=bot&permissions=8');
                break;
                case "flicker":
                    msg.channel.sendMessage('The link to join my creators discord is https://discord.gg/Y2EtATM');
                break;
//--------------------------------End prefix commands, unknown command below-----------------------------
                default:
                    msg.channel.sendMessage('Unknown command!');
                    console.log('Oh no. Somebody cant english!')
                break;
            }
        }
    } catch (e){
        msg.channel.sendMessage('Error!');
        msg.channel.sendMessage('Error code: ' + Math.floor(Math.random() * 999 + 1));
        msg.channel.sendMessage(e);
        console.log('ERROR')
    }
    
}

//-----------------------Custom functions here------------------------------------
function randomnumber(msg){
    msg.channel.sendMessage(Math.floor(Math.random() * 10 + 1));
}


/*
if (message.content.startsWith(commandPrefix + "kick")) {
        // Easy way to get member object though mentions.
        var member= message.mentions.members.first();
        // Kick
        member.kick().then((member) => {
            // Successmessage
            message.channel.send(":wave: " + member.displayName + " got kicked lol what a nerd");
        }).catch(() => {
             // Failmessage
            message.channel.send("Access Denied");
        });
    }
});
 client.on("message", (message) => {
    if (message.content.startsWith(commandPrefix + "ban")) {
        // Easy way to get member object though mentions.
        var member= message.mentions.members.first();
        // ban
        member.ban().then((member) => {
            // Successmessage
            message.channel.send(":wave: " + member.displayName + " has been smited.");
        }).catch(() => {
             // Failmessage
            message.channel.send("Access Denied");
        });
    }
});

*/
