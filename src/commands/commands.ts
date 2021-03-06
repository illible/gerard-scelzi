import * as sapphire from '@sapphire/framework';
import * as discord from 'discord.js';
import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { durationToMS, guildDataCache, db, getRandomArbitrary, cacheType, bot, cleanMentions } from '../index';
import { ApplyOptions } from '@sapphire/decorators';
import * as lux from 'luxon';
import * as voice from '@discordjs/voice';
import { join } from 'path'
import * as crypto from 'crypto';
///<reference types="../index"/>
voice
let permissionsPrecondition = (...args: discord.PermissionResolvable[]) => {
    let preconditionArray: Array<sapphire.PreconditionEntryResolvable> = [];
    preconditionArray.push('override')
    args.forEach((item) => {
        preconditionArray.push(new sapphire.UserPermissionsPrecondition(item))
    });
    return preconditionArray
};
@ApplyOptions<sapphire.CommandOptions>({
    name: 'test',
    description: 'short desc',
    enabled: false,
    detailedDescription: 'desc displayed when help command is called',
})
export class testCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        args
        let voiceChannel = <discord.VoiceChannel>await message.guild?.channels.fetch('652647177641787442');
        if (message.member?.voice.channel === null) return;
        const connection = voice.joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        const audioPlayer = voice.createAudioPlayer();
        audioPlayer.play(voice.createAudioResource(join(__dirname, 'test.mp3')));
        connection.subscribe(audioPlayer);
    };
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'dismount',
    fullCategory: ['_enabled', '_owner'],
    description: 'Disables a command globally',
    requiredClientPermissions: [],
    preconditions: ['OwnerOnly']
})
export class ownerDisableCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let cmd = args.nextMaybe();
        if (!cmd.exists) return
        let command = this.container.stores.get('commands').find(value => value.name === cmd.value);
        if (!command) return message.channel.send('Command not found');
        command.enabled = false;
        return message.channel.send(`Dismounted *${cmd.value}*`);
    };
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'mount',
    fullCategory: ['_enabled', '_owner'],
    description: 'Enables a command globally',
    preconditions: ['OwnerOnly']
})
export class ownerEnableCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let cmd = args.next();
        let command = this.container.stores.get('commands').find(value => value.name === cmd);
        if (!command) return message.channel.send('Command not found');
        command.enabled = true;
        command.reload();
        return message.channel.send(`Mounted *${cmd}*`);
    };
};

@ApplyOptions<sapphire.CommandOptions>({
    name: 'eval',
    fullCategory: ['_enabled', '_owner'],
    description: 'Evaluates JS input',
    requiredClientPermissions: [],
    preconditions: ['OwnerOnly']
})
export class ownerEvalCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        let str = message.content;
        let out = str.substring(str.indexOf('```') + 3, str.lastIndexOf('```'));
        try {
            eval(out);
        } catch (error) {
            console.log("error");
            console.log(error);
            message.channel.send(`Unhandled exception: \n ${error}`);
        }
    };
};

@ApplyOptions<sapphire.CommandOptions>({
    name: 'deleted',
    description: '',
    requiredClientPermissions: [],
    preconditions: [permissionsPrecondition('MANAGE_MESSAGES'), 'GuildOnly'],
    options: ['id']
})
export class DeletedMSGCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let amount: number | never;
        let arg = await args.pick('number');
        if (isNaN(arg)) return message.channel.send('Please specify a valid amount of messages to view.');
        amount = (arg <= 10) ? arg : (() => {
            throw new sapphire.UserError({ identifier: 'amount>10', message: 'Amount must be less than 10.' });
        })();
        amount = (arg >= 0) ? arg : (() => {
            throw new sapphire.UserError({ identifier: 'amount<=0', message: 'Amount must be greater than 0.' });
        })();
        /*let idget = async () => {
            let i = args.getOption('id');
            if (i === null) throw new sapphire.UserError({
                identifier: 'invalidsyntax',
                message: 'Invalid command syntax'
            });
            return await db.query('SELECT * FROM deletedmsgs WHERE guildid=$1 AND id = $2 ORDER BY msgtime DESC LIMIT 1;',
                [message.guildId, id]);
        }*/
        let get = async () => {
            return await db.query('SELECT * FROM deletedmsgs WHERE guildid=$2 ORDER BY msgtime DESC LIMIT $1;',
                [amount, message.guildId]);
        }
        let del = await get();
        del.rows.forEach(async (msg) => {
            if (msg.content.length > 1028) {
                var content: string = msg.content.substring(0, 1025) + '...';
            } else {
                var content: string = msg.content;
            }
            const DeleteEmbed = new discord.MessageEmbed()
                .setTitle("Deleted Message")
                .setColor("#fc3c3c")
                .addField("Author", `<@${msg.author}>`, true)
                .addField("Deleted By", msg.deleted_by, true)
                .addField("Channel", `<#${msg.channel}>`, true)
                .addField("Message", content || "None")
                .setFooter(`ID: ${msg.id} | Message ID: ${msg.msgid}\nAuthor ID: ${msg.author}`);
            if (msg.attachments) {
                let attachArray: string[] = [];
                msg.attachments.forEach((attach: any) => {
                    attachArray.push(`[${attach.name}](${attach.url})`);
                });
                DeleteEmbed.addField('Attachments', attachArray.join('\n'));
            }
            message.channel.send({
                embeds: [DeleteEmbed]
            })
        });
        return;
    };

};

@ApplyOptions<SubCommandPluginCommandOptions>({
    name: 'smite',
    description: '',
    requiredClientPermissions: ['BAN_MEMBERS'],
    preconditions: [permissionsPrecondition('BAN_MEMBERS'), 'GuildOnly'],
    subCommands: ['add', 'remove', 'list', 'reset', { input: 'add', default: true }]
})
export class smiteCommand extends SubCommandPluginCommand {
    public async add(message: discord.Message, args: sapphire.Args) {
        let user = await args.pick('member').catch(() => {
            return args.pick('user')
        })
        let content = await args.pick('string').catch(() => null);
        let reason = await args.repeat('string').catch(() => null);
        let time = content !== null ? durationToMS(content) : null;
        if (time === null) {
            if (content !== null && reason !== null) reason.unshift(content)
        };
        let strReason = reason === null ? 'not given' : reason?.join(' ');
        let endsDate = (time !== null) ? new Date(Date.now() + time) : null;
        if (user instanceof discord.GuildMember) {
            if (message.member!.roles.highest.comparePositionTo(user.roles.highest) <= 0 && (message.guild!.ownerId !== message.member!.id)) {
                message.channel.send(`You do not have a high enough role to do this.`);
                return;
            }
            if (!user.bannable) {
                return message.channel.send("This user is not bannable by the bot.");
            }
            await db.query(`INSERT INTO punishments (member, guild, type, reason, created_time, ends) VALUES ($1, $2, $3, $4, $5, $6) `,
                [user.id, message.guild!.id, 'blist', strReason, new Date(), endsDate]);
            message.guild!.bans.create(user, { reason: strReason, days: 0 });
            message.channel.send(`${user.user.username} has been added to the blacklist and banned${(time === null) ? '.' : `for ${content}`}\nProvided reason: ${strReason}`);
        } else {
            await db.query(`INSERT INTO punishments (member, guild, type, reason, created_time, ends) VALUES ($1, $2, $3, $4, $5, $6) `,
                [user.id, message.guild!.id, 'blist', strReason, new Date(), endsDate]);
            message.channel.send(`${user.username} has been added to the blacklist and banned${(time === null) ? '.' : `for ${content}`}\nProvided reason: ${strReason}`);
        };
        return;
    }

    public async remove(message: discord.Message, args: sapphire.Args) {
        let user = await args.pick('user');
        let q = await db.query(`SELECT * FROM punishments WHERE type='blist' AND member = $2 AND guild = $1`, [user.id, message.guild!.id]);
        if (q.rowCount === 0) return;
        message.guild!.members.unban(user).catch(() => { })
        db.query('UPDATE punishments SET resolved = true WHERE type=\'blist\' AND member = $2 AND guild = $1', [user.id, message.guild!.id]);
        message.channel.send(`${user.tag} has been removed from the blacklist`);
    }

    public async list(message: discord.Message) {
        let smite = await db.query(`SELECT * FROM punishments WHERE type='blist' AND guild = $1 AND NOT RESOLVED`, [message.guild!.id]);
        if (smite.rowCount === 0) message.channel.send(`No users are blacklisted`);
        smite.rows.forEach(async (i) => {
            let x = await bot.users.fetch(i.member);
            let date = i.ends ? (+new Date(i.ends) - Date.now()) : null;
            let duration = date === null ? 'permanently' : `for ${lux.Duration.fromMillis(date!)}`;
            message.channel.send(`**${x.username}#${x.discriminator}** is blacklisted until *${duration}*. Case ID: ${i.id}`);
        });
    }
    public async reset(message: discord.Message) {
        let banned = await db.query(`SELECT * FROM punishments WHERE type='blist' AND guild = $1 AND NOT RESOLVED`, [message.guild!.id]);
        message.channel.send(`Warning: This will unban all blacklisted users. Are you sure you want to do this?`);
        const filter = (m: discord.Message) => m.author.id === message.author.id
        const collector = message.channel.createMessageCollector({ filter, time: 10000 });
        let response = false
        collector.on('collect', async m => {
            if (m.content === 'yes') {
                await db.query('UPDATE punishments SET resolved = true WHERE type=\'blist\' AND guild = $1', [message.guild!.id]);
                banned.rows.forEach((i) => {
                    message.guild!.members.unban(i.userid).catch((err) => {
                        console.log(err)
                    })
                });
                message.channel.send(`Done`)
                response = true
                collector.stop();
                return;
            } else if (message.content === 'no') {
                message.channel.send(`Command aborted.`);
                response = true
                collector.stop()
                return
            }
        });
        collector.on('end', () => {
            if (response === true) return
            message.channel.send(`Command timed out`)
        });

    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'query',
    fullCategory: ['_enabled', '_owner'],
    description: 'Runs SQL input against database',
    requiredClientPermissions: [],
    preconditions: ['OwnerOnly']
})
export class queryCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        let str = message.content;
        let out = str.substring(str.indexOf('```') + 3, str.lastIndexOf('```'));
        if (message.author.id !== "471907923056918528" && message.author.id !== "811413512743813181") {
            message.channel.send('You do not have permission to do this');
            return;
        }
        let data = await db.query(out);
        let JSONdata = JSON.stringify(data.rows, null, 1);
        if (JSONdata?.length && JSONdata.length < 2000) {
            message.channel.send(`${data.command} completed - ${data.rowCount} rows, \n${cleanMentions(JSONdata)}`);
            return;
        } else if (JSONdata?.length && JSONdata.length > 2000) {
            const buffer = Buffer.from(JSONdata)
            const attachment = new discord.MessageAttachment(buffer, 'file.json');
            message.channel.send(`${data.command} completed - ${data.rowCount} rows,`);
            message.channel.send({ files: [attachment] });
        } else {
            message.channel.send(`${data.command} completed - ${data.rowCount} rows,`);
        }

    };

};

@ApplyOptions<sapphire.CommandOptions>({
    name: 'prefix',
    fullCategory: ['_enabled'],
    description: 'Shows prefix',
    requiredClientPermissions: [],
    preconditions: ['GuildOnly', permissionsPrecondition('ADMINISTRATOR')]
})
export class prefixCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let x = args.nextMaybe()
        if (!x.exists) {
            let prefix = await guildDataCache.get(message.guild!.id, cacheType.prefix);
            message.channel.send(`The prefix for this server is \`${prefix}\``);
            return
        }
        guildDataCache.change(message.guild!.id, cacheType.prefix, x.value);
        message.channel.send(`Changed prefix for ${message.guild!.name} to ${x.value}`);
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'sirmole',
    description: 'unfunny',
    requiredClientPermissions: [],
    preconditions: []
})
export class sirmoleCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        message.channel.send('sir mole is a very cringe man who gets extremely angy and likes to ban people for no reason')
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'pluto',
})
export class plutoCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        message.channel.send(`<@!453823323135016965>`);
    }
}
@ApplyOptions<sapphire.CommandOptions>({
    name: 'sammy',
})
export class sammyCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        message.channel.send(`<@!696926289726144562>`);
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'repo',
})
export class repoCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        message.channel.send(`https://github.com/ofoxsmith/gerard-scelzi`);
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'invite',
})
export class inviteCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        message.channel.send(`Invite is: https://discord.com/api/oauth2/authorize?client_id=920756165284069398&permissions=8&scope=bot`);
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'info',
})
export class infoCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        let uptime = process.uptime();
        let uptimeString = "";
        if (uptime >= 86400) {
            uptimeString += Math.floor(uptime / 86400) + " days ";
            uptime %= 86400;
        }
        if (uptime >= 3600) {
            uptimeString += Math.floor(uptime / 3600) + " hours ";
            uptime %= 3600;
        }
        if (uptime >= 60) {
            uptimeString += Math.floor(uptime / 60) + " minutes ";
            uptime %= 60;
        }
        uptimeString += Math.floor(uptime) + " seconds";
        let start = Date.now()
        await db.query('select 1;')
        let elapsed = Date.now() - start;
        message.channel.send(`**Uptime:** ${uptimeString}\n**Websocket heartbeat:** ${bot.ws.ping}ms\n**Database heartbeat:** ${elapsed}ms`);
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'setstatus',
    preconditions: ['OwnerOnly'],
}) export class setstatusCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        message
        let stat = args.next();
        if (stat === 'online' || stat === 'idle' || stat === 'dnd' || stat === 'invisible') {
            bot.user!.setStatus(stat);
        };
        const activity = args.next()
        if (activity === 'playing' || activity === 'streaming' || activity === 'watching' || activity === 'listening' || activity === 'none') {
            let stat = (activity === 'none') ? undefined : <discord.ActivityType>activity.toUpperCase();
            let name = (await args.repeat('string')).join(' ');
            bot.user!.setActivity(name, { type: (stat as any) });
            return;
        };
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'setup',
}) export class setupCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let i = args.next();
        if (i === 'delmsgkey') {
            message.channel.send(`Regenerating keys`);
            message.channel.send(`All stored messages will become inaccessible after new keys are generated`)
            let x = crypto.createDiffieHellman(120);
            x.generateKeys('base64');
            db.query(`UPDATE guilds SET delmsg_public_key = $1 WHERE guildid = $2`, [x.getPublicKey('base64'), message.guild!.id]);
        }
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'sex',
    enabled: false,
}) export class sexCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        if (getRandomArbitrary(1, 50) === 22) {
            let msg = discord.Util.splitMessage(`
It was a wonderful monday morning... 
BigUniverse got out of bed and immediatly grabbed his phone to talk to his wonderful boyfriend, Gustavo. He messaged him, "Squish me daddy!!!"
Unfortunately, Gustavo had greater plans then going over to BigUniverse's house and railing him. Gustavo wanted a better boyfriend.
He had been programming an AI that would function as a boyfriend for him, but he did not have a body for it. He messaged BigUniverse,
"Im sorry but I dont think we can continue this relationship."
BigUniverse was distraught. He replied, "I will 1v1 you in minecraft bedwars!"
But nothing could change this. Gustavo would date a robot.
If u want more, dm me :)
-sirmole
		`);
            msg.forEach(x => message.channel.send(x));
            return
        }

        let msg = discord.Util.splitMessage(`
No. You aren't having this.
But... you can have this https://www.youtube.com/watch?v=k4FF7x8vnZg&t=0s&ab_channel=Hepburn
		`);
        msg.forEach(x => message.channel.send(x));
    }
};

@ApplyOptions<sapphire.CommandOptions>({
    name: 'help',
    enabled: false,
}) export class helpCommand extends sapphire.Command {
    public async messageRun(message: discord.Message) {
        message.channel.send('Hello! I am Gerald. I will enable you to take control of your server by my rules >:)');
    }
}

@ApplyOptions<sapphire.CommandOptions>({
    name: 'listguilds',
}) export class guildsCommand extends sapphire.Command {
    public async messageRun() {
        let x = await bot.guilds.fetch();
        x.each((a) => { console.log(`In guild '${a.name}'', (${a.id})'\n Owner is ${a.owner}`) });
    }
}


@ApplyOptions<sapphire.CommandOptions>({
    name: 'gay',
    enabled: false,
}) export class gayCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let cmd = args.next()
        if (cmd === 'add') {
            let change = (await args.repeat('string')).join(' ')
            await db.query('UPDATE members SET sexuality=$1 WHERE userid = $2',
                [change, message.author.id]);
            message.channel.send(`set ${message.author.username} to ${cleanMentions(change)}`);
            return;
        }
        message.mentions.members?.each(async (eachmem) => {
            let s = await db.query('SELECT * FROM members WHERE userid = $1', [BigInt(eachmem.id)])
            message.channel.send(`${(eachmem.nickname !== null) ? eachmem.nickname : eachmem.user.username} is ${cleanMentions(s.rows[0].sexuality)}`);
        })
        message.mentions.roles?.each(async (eachrole) => {
            eachrole.members.each(async (eachmem) => {
                let s = await db.query('SELECT * FROM members WHERE userid = $1', [BigInt(eachmem.id)])
                message.channel.send(`${(eachmem.nickname !== null) ? eachmem.nickname : eachmem.user.username} is ${cleanMentions(s.rows[0].sexuality)}`);
            })

        })
    }
}


@ApplyOptions<sapphire.CommandOptions>({
    name: 'ask',
    options: ['user']
}) export class askCommand extends sapphire.Command {
    public async messageRun(message: discord.Message, args: sapphire.Args) {
        let opt = args.nextMaybe()
        if (args.getOption('user')) {
            throw new Error(`Not implemented yet`);/*
            let test = (args.getOption('user') === null) ? <string>args.getOption('user') : '1'
            let num = parseInt(test);
            if (!num || num < 1 || num > 10) return
            let y = await message.guild?.roles.fetch('858473576335540224');
            let i = await message.guild?.roles.fetch('877133047210852423');
            if (!y) return;
            if (!i) return;
            let member: Array<discord.GuildMember> = []
            y.members.each((mem) => member.push(mem));
            i.members.each((mem) => member.push(mem));
            let uniq = [...new Set(member)];
            for (let i = 0; i < num; i++) {
                let ask = uniq[getRandomArbitrary(0, member.length - 1)]
                await message.channel.send(`${(ask.nickname !== null) ? ask.nickname : ask.user.username}`);
            }
            return*/
        } else if (opt.exists && opt.value === 'user') {
            throw new Error(`Not implemented yet`);/*
            let y = await message.guild?.roles.fetch('858473576335540224');
            let i = await message.guild?.roles.fetch('877133047210852423');
            if (!y) return;
            if (!i) return;
            let member: Array<discord.GuildMember | string> = []
            y.members.each((mem) => member.push(mem));
            i.members.each((mem) => member.push(mem));
            member.push('nobody');
            let uniq = [...new Set(member)];
            let ask = uniq[getRandomArbitrary(0, member.length - 1)]
            if (typeof ask === 'string') {
                message.channel.send(`${ask}`);
                return
            }
            await message.channel.send(`${(ask.nickname !== null) ? ask.nickname : ask.user.username}`);
            return;*/
        }
        else if (opt.exists && opt.value === 'percent') {
            message.channel.send(`${getRandomArbitrary(0, 100)}%`);
            return;
        }
        if (getRandomArbitrary(0, 20) > 9) {
            return message.channel.send('yes');
        } else {
            return message.channel.send('no');
        }

    }
}


@ApplyOptions<sapphire.CommandOptions>({
    name: 'update-database',
    fullCategory: ['_enabled', '_owner'],
    description: 'rebuild database',
    requiredClientPermissions: [],
    preconditions: ['OwnerOnly']
}) export class ownerUpdateCommand extends sapphire.Command {
    public async messageRun() {
        let x = await bot.guilds.fetch();
        x.each(async (g) => {
            let guild = await g.fetch();
            (await guild.members.fetch()).each(async (mem) => {
                db.query(`INSERT INTO members (guild, userid) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [guild.id, mem.id]);
            })
        })

    };
};

@ApplyOptions<SubCommandPluginCommandOptions>({
    name: 'commands',
    aliases: ['cmds', 'command'],
    fullCategory: ['_enabled'],
    description: '',
    preconditions: [permissionsPrecondition('ADMINISTRATOR'), 'GuildOnly'],
    subCommands: ['disable', 'enable', 'status'],

})
export class commandsManagerCommand extends SubCommandPluginCommand {
    public async disable(message: discord.Message, args: sapphire.Args) {
        let cmd = args.nextMaybe()
        if (cmd.exists === false) {
            throw new sapphire.UserError({ identifier: 'invalidsyntax', message: 'Specify a command to disable' });
        }
        let command = this.container.stores.get('commands').find(value => value.name === cmd.value);
        if (!command) return message.channel.send('Command not found');
        if (command.fullCategory.some(x => x === '_enabled')) {
            message.channel.send(`This command cannot be disabled.`)
            return;
        }
        let i = (await guildDataCache.get(message.guild!.id, cacheType.disabled)).split('');
        i.some(x => x === cmd.value!) ? (() => { 
            throw new sapphire.UserError({ identifier: 'invalid', message: 'Command already disabled' }) 
        }) : i.push(cmd.value!);
        guildDataCache.change(message.guild!.id, cacheType.disabled, i.join(' '));
        return message.channel.send(`Disabled command **${cmd.value!}**`)
    }

    public async enable(message: discord.Message, args: sapphire.Args) {
        let cmd = args.nextMaybe()
        if (cmd.exists === false) throw new sapphire.UserError({ identifier: 'invalidsyntax', message: 'Specify a command to enable' });
        let command = this.container.stores.get('commands').find(value => value.name === cmd.value);
        if (!command) return message.channel.send('Command not found');
        let i = (await guildDataCache.get(message.guild!.id, cacheType.disabled)).split(' ');
        guildDataCache.change(message.guild!.id, cacheType.disabled, i.filter(x => x !== cmd.value).join(' '));
        return message.channel.send(`Enabled command **${cmd.value!}**`)
    }
    public async status(message: discord.Message) {
        message
        throw new Error(`Not implemented yet`);
    }
}
