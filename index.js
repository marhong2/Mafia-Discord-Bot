const Discord = require('discord.js');
const bot = new Discord.Client();
const token = 'Hidden';
bot.on('ready', () => {
    console.log("This bot is online");
})
const PREFIX = '!'

bot.on('message', message => {
    if (message.author.bot) return;
    let args = message.content.substring(PREFIX.length).split(" ")
    if (args[0] != 'play' && !gamestate) return;
    let messanger = gamestate.get_player_by_id(message.author)
    let target = gamestate.get_player(args[1])
    switch (args[0]) {
        case 'play':
            gamestate = new GameState(message);
            gamestate.channel.send("Type !join followed by your user name E.g. '!join Discord_bot' to join the game. ");
            gamestate.channel.send("when  everyone is  in type !ready");
            break;

        case 'join':
            gamestate.add_player(message, args[1])
            break;

        case 'ready':
            gamestate.add_mafia(1)
            gamestate.add_cop(1)
            gamestate.add_doc(1)
            gamestate.tell_mafia()
            gamestate.channel.send("You were all peacefully asleep one night, when in the  middle of the night, you all wake up to a scream!!!! rushing outside, you find your childhood friend bob dead on the street.looking arround suspiciously, you all know that bob's construction company was rich and people in town wanted his company. good luck figuring out who is the killer(s)")
            gamestate.channel.send("|")
            gamestate.channel.send("**In this Chat** type in !next to progress to night. type in !hang <name> to initiate a public trial, e.g. !hang Discord_bot (plz Marcus is torturing me)")
            break;

        case 'hang':
            if (!gamestate.day) {
                message.reply('it is currently night')
            } else if (!args[1]) {
                message.reply('you need a name, e.g. !hang Discord_bot (pls kill me)')
            } else if (args[1] === 'Discord_bot') {
                message.reply('harder plz')
            } else if (args[1] === 'discord_bot' || args[1] === 'Discord_Bot') {
                message.reply('finally good night')
            } else if (!gamestate.get_player(args[1])) {
                message.reply('there is no one who is named ' + args[1])
            } else if (!gamestate.trial) {
                gamestate.channel.send('Any seconds to hang, ' + args[1])
                gamestate.channel.send('**In this Chat** type !second to second, or !retract to retract')
                gamestate.accuser = gamestate.get_player_by_id(message.author)
                gamestate.trial = gamestate.get_player(args[1])
            } else {
                gamestate.channel.send('There is currently a trial going on please wait')
            }
            break;

        case 'second':
            if(gamestate.get_player_by_id(message.author) === gamestate.accuser){
                gamestate.channel.send("The accuser can not second him self")
                break;
            }
            if (!gamestate.trial) {
                gamestate.channel.send('There is no trial right now')
                break;
            }
            gamestate.accuser = false
            gamestate.trial_vote = true
            gamestate.channel.send('the trial is a foot!!!!')
            gamestate.channel.send('**In a Private DM**  when you are ready, type !kill or !live. Treat live as not voting')
            gamestate.channel.send('when you are done type !next')//add auto functionality
            gamestate.poll = new Poll(gamestate.trial)
            gamestate.trial_vote = true
            console.log('initiate vote')
            break;

        case 'retract':
            if (message.user === gamestate.trail.user) {
                gamestate.channel.send("you can not retract because you are on trial")
                break;
            }
            gamestate.trial = false
            gamestate.channel.send('Vote has been retracted')
            gamestate.channel.send("type in !next to progress to night")
            gamestate.channel.send("**In this Chat** type in !hang <name> to initiate a public trial")
            break;
        case 'kill':
            if (!gamestate.trial_vote) {
                message.reply('there is no one on the chopping block right now')
                break;
            }
            if(message.channel === gamestate.channel){
                message.author.send("wrong chat")
                message.delete()
                break;
            }
            gamestate.poll.vote_to_kill(gamestate.get_player_by_id(message.author))
            gamestate.poll.continue()
            break;
        case 'live':
            if (!gamestate.trial_vote) {
                message.reply('there is no one on the chopping block right now')
                break;
            }
            if(message.channel === gamestate.channel){
                message.author.send("wrong chat")
                message.delete()
                break;
            }
            gamestate.poll.vote_to_kill(gamestate.get_player_by_id(message.author))
            gamestate.poll.continue()
            break;
        case 'next':
            if (!gamestate.trial_vote && gamestate.day) {
                gamestate.day = false
                //make the mute and  deffen automatic
                gamestate.channel.send("Everyone Please deffen. Mafia, use your group chat to dissguess who to kill,  and when you are ready")
                gamestate.channel.send("**IN A DM, ONE OF YOU** type !murder name to assassinate, !check name for the cop, !save name for the doc")
            }
            break;
        case 'murder':
            if (gamestate.day) return message.author.send("it is day time, you can not assassinate someone");
            if (!args[1]) return message.author.send("you need a target")
            if(messanger.maf) return message.author.send("you are not mafia")
            if(!target) return message.author.send("no target")
            if (gamestate.maf_action) return message.author.send("someone has already been assassinated")
            message.author.send("confirmed")
            gamestate.killed = target
            gamestate.maf_action = true
            gamestate.next_day()
            break;
        case 'save':
            if(!target) return message.author.send("no target")
            if (gamestate.day) return message.author.send("it is day time, you can not assassinate someone");
            if (!args[1]) return message.author.send("you need a target")
            if(!messanger.doc) return message.author.send("you are not doc")
            message.author.send("you will  save" + args[1])
            gamestate.saved = target
            gamestate.doc_action = true
            gamestate.next_day()
            break;


        case 'check':
            if(!target) return message.author.send("no target")
            if (gamestate.day) return message.author.send("it is day time, you can not assassinate someone");
            if (!args[1]) return message.author.send("you need a target")
            if(!messanger.cop) return message.author.send("you are not cop")
            if(gamestate.cop_action) return message.author.send("you have already checked someone")
            if(!target) return message.author.send("there is no  one named that")
            if(target.mafia) message.author.send("is mafia")
            else  message.author.send("is town")
            gamestate.cop_action = true
            gamestate.next_day()
            break;
    }
})

//objects from here on out
//
//
//
//
//
//

class GameState {
    constructor(message = false) {
        this.channel = message.channel
        this.day = true
        this.players = []
        this.maf = []
        this.maf_names = "The mafia are"
        this.trial = false // the person on trial
        this.trial_vote = false // if we are currently voting
        this.poll = false
        this.accuser = false
        this.maf_action = false
        this.cop_action = false
        this.doc_action = false
        this.killed = false
        this.saved = false
    }
    next_day(){
        if (this.maf_action && this.cop_action && this.doc_action) {
            this.day = true
            let dead = this.killed.kill()
            for(let i = 0; i < this.players.length; i++){
                if(this.players[i].mafia) this.maf_action = false
                if(this.players[i].doc) this.doc_action = false
                if(this.players[i].cop) this.cop_action = false
            }
            if(gamestate.killed === gamestate.saved && this.killed && this.saved){
                this.channel.send("it is now day! No one died!")
            }else{
                if(dead) return
                this.channel.send("it is now day! but oh my, in the  night, " + this.killed.name + " was killed! good luck finding the killer")
            }
            this.channel.send("**IN THIS CHAT** !hang to hang, !next to move on to the next day")
        }
    }
    add_player(message, name) {
        if (!name) {
            message.reply("you need a user name")
        } else {
            message.author.send("welcome")
            let player = new Player_Char(message, name);
            this.players = this.players.concat(player);
        }
    }
    add_mafia(mafia_num) {
        let i = 0
        while (i < mafia_num) {
            let position = Math.floor(Math.random() * this.players.length)
            if (!this.players[position].mafia) {
                this.players[position].mafia = true
                i++
                this.maf = this.maf.concat(this.players[position])
                this.maf_names = this.maf_names + " " + this.players[position].name + ","
            }

        }
    }
    tell_mafia() {
        // add a mafia chat
        for (let i = 0; i < this.maf.length; i++) {
            let player = this.maf[i]
            this.maf[i].user.send("you are mafia!! ")
            this.maf[i].user.send(this.maf_names)
            this.maf[i].user.send("make a group chat with your mafia members, because discord wont let me")
        }
    }
    add_cop(cop_num){
        let i = 0
        while (i < cop_num) {
            let position = Math.floor(Math.random() * this.players.length)
            if (!this.players[position].mafia && !this.players[position].cop) {
                this.players[position].cop =  true
                this.players[position].user.send("you are a cop")
                i++
            }
        }
    }
    add_doc(doc_num){
        let i = 0
        while (i < doc_num) {
            let position = Math.floor(Math.random() * this.players.length)
            if (!this.players[position].mafia && !this.players[position].cop && !this.players[position].doc) {
                this.players[position].doc =  true
                this.players[position].user.send("you are a doc")
                i++
            }
        }
    }
    get_player(name) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name === name) return this.players[i];
        }
        console.log('there is no such player')
        return false
    }
    get_player_by_id(persona) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].user.username == persona.username || this.players[i].user.id == persona.id){
                return this.players[i];
            } 
        }
        console.log('there is no such player')
        return false
    }
    remove(person) {
        let standin_char = []
        let standin_maf = []
        for (let i = 0; i < gamestate.maf.length; i++) {
            if (gamestate.maf[i] != person) {
                standin_maf = standin_maf.concat(gamestate.maf[i])
            }
        }
        for (let i = 0; i < gamestate.players.length; i++) {
            if (gamestate.players[i] != person) {
                standin_char = standin_char.concat(gamestate.players[i])
            }
        }
        console.log(standin_char, standin_maf)
        gamestate.maf = standin_maf
        gamestate.players = standin_char
        console.log(gamestate.players, gamestate.maf)
    }
}

class Poll {
    constructor(person) {
        this.on_trial = person
        this.vote_kill = []
        this.vote_live = []
        this.kill = 0
        this.live = 0
        this.voted = 0
        this.done = false
    }
    vote_to_kill(voter) {
        if (!this.has_voted(voter)) {
            this.kill++
            this.vote_kill = this.vote_kill.concat(voter)
            this.voted++
        }
    }
    vote_to_live(voter) {
        if (!this.has_voted(voter)) {
            this.live++
            this.vote_live = this.vote_live.concat(voter)
            this.voted++
        }
    }
    get_voted_live() {
        let voted_live = "The Following Voted to let " + this.on_trial.name + " live; "
        for (let i = 0; i < this.vote_live.length; i++) {
            voted_live = voted_live + this.vote_live[i].name + ", "
        }
        return voted_live
    }
    get_voted_kill() {
        let voted_kill = "The Following Voted to let " + this.on_trial.name + " hang; "
        for (let i = 0; i < this.vote_kill.length; i++) {
            voted_kill = voted_kill + this.vote_kill[i].name + ", "
        }
        return voted_kill
    }

    has_voted(voter) {
        //if(voter === this.on_trial){
        //    voter.send("you are on trial, you can not vote")
        //   return true
        //}
        for (let i = 0; i < this.vote_kill.length; i++) {
            if (this.vote_kill[i] === voter) {
                console.log(voter)
                voter.user.send("You have already voted to kill,your vote is final")
                return true
            }
        }
        for (let i = 0; i < this.vote_live.length; i++) {
            if (this.vote_live[i] === voter) {
                voter.user.send("You have already voted to let them live,your vote is final")
                return true
            }
        }
        return false
    }
    continue(){
        if (this.voted >= gamestate.players.length) {
            gamestate.channel.send(gamestate.poll.get_voted_live())
            gamestate.channel.send(gamestate.poll.get_voted_kill())
            if (gamestate.poll.kill > gamestate.poll.live) {
                gamestate.channel.send(gamestate.trial.name + " has been hanged")
                gamestate.channel.send("you all watch as their feet dangle and sway with the wind")
                if (gamestate.trial.kill()) return;
            } else {
                gamestate.channel.send(gamestate.trial.name + "lives to see another night")
            }
            gamestate.channel.send("**In this Chat** type !next to continue")
            gamestate.trial = false
            gamestate.poll = false
            gamestate.trial_vote = false
            return;

        }
    }
}

class Player_Char {
    constructor(message, name) {
        console.log('player joined')
        this.name = name
        this.mafia = false
        this.cop =  false
        this.doc = false
        this.alive = true
        this.user = message.author
    }
    kill() {
        gamestate.channel.send(this.name + " is dead")
        this.alive = false
        console.log(this.name)
        console.log("player is dead")
        gamestate.remove(this)
        return end()
    }
}

//Raw functions
//
//
//
//
//
//

function end() {
    if (gamestate.maf.length >= gamestate.players.length - gamestate.maf.length) {
        gamestate.channel.send("the mafia have won!!")
        gamestate = new GameState()
        return true
    }
    if (gamestate.maf.length === 0) {
        gamestate.channel.send("the town has won!!!!!")
        gamestate = new  GameState()
        return true
    }
}

function make_player(name) {
    return new Player_Char(name);
}
var gamestate = new GameState()
bot.login(token);