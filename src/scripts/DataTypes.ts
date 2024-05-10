import { CurrentGameData } from "./Globals";
import { Player } from "./Player";

export class PlayerData
{
    isSelf :boolean;
    extraTime : number;
    lives : number;
    playerAvatarRef : Player | undefined = undefined;

    constructor(public plId: number = -1,public name: string = "",public avatarURL: string = "",public balance: string = "",public state: number,public defaultId: number = -1)
    {
        // console.log(this.state);
        this.isSelf = plId == CurrentGameData.plID;
        this.extraTime = -1;
        this.lives = 3;

        
    }

    remove()
    {
        this.playerAvatarRef?.delete();
        this.playerAvatarRef = undefined;
    }


    updateData(plId : number, balance : string)
    {
        this.plId = plId;
        this.balance = balance;
    }

}



export class ResultData
{
    name : string;
    plID : number;
    result : string;
    points : number;
    amount : number;
    cards : string[];
    reason : string;
    avatar : string;

    constructor(data : any)
    {
        this.name = data.name;
        this.plID = data.plId;
        this.result = data.result;
        this.points = data.points;
        this.amount = data.amount;
        this.cards = data.cards;
        this.reason = data.reason;
        this.avatar = data.avatar;
    }
}




export const SUIT= [
    "JOKER",
    "S",
    "C",
    "H",
    "D"
];






export const enum SocketSendMsg {
    CONNECT = "connect",
    RECONNECT = "reconnect",
    PING = "ping",
    CHECK = "check",
    CALL = "call",
    SWITCH = "switchTable",
    FOLD = "fold",
    RAISE = "raise",
    ALLIN = "allin",
};

export const enum SocketRecievedMsg {
    PONG = "pong",
    JOINED = "joined",
    REJOINED = "rejoined",
    WAIT_TIMER = "waitTimer",
    PADD = "pAdd",
    PREJOIN = "plRejoin",
    GAME_START_MSG = "GAMESTARTMSG",
    PLAYER_CARDS = "plCardsMsg",
    GAMEPLAY_TIMER = "timer",
    CARD_WITHDRAW = "cardWithdraw",
    RESULT = "resultMsg",
    PTIMER = "turnTimer",
    PLEFT = "pLeft",
    TURNSKIPPED = "turnSkipped",
    NEXT_TURN = "nextPlayerTurnMsg",
    KICKEDPLAYERS = "kickedPlayers",
    RECONNECTAGAIN = "reconnectAgain",
    ERROR = "error",
    THREESKIPS = "THREESKIPS",
    GAMEENDED = "gameEnded",
    PFOLDED = "plFolded",
    BLIND = "blind",
    POTUPDATE = "potUpdate",
    BALUPDATE = "balUpdate",
    SWITCH_FAILED = "switchFailed",
    SWITCH_SUCCESS = "switchSuccess",
    CALL_AMT = "callAmt",
    gId = "gId",
};

export interface potType {
    players : number[],
    amount : number,
    winner : number | null
}

export interface potWinnerType
{
    player : number,
    amount : number,
    cards : string[],
    type : string
}

export interface potResultType
{
    amount : number,
    winners : potWinnerType[],
    
    isRefund : boolean
}


export enum BidState
{
    NULL,
    CHECK,
    CALL,
    ALLIN
}


export enum PLAYERSTATE {
    INGAME,
    WAITING,
    FOLDED,
    LEFT,
    DISCONNECTED
}


export const enum GAMESTATE
{
	MATCHMAKING,
	CARDDISTRIBUTION,
	INGAME,
	RESULT,
	RESTARTING
}

export const enum AvatarStates {
    INGAME,
    DROPPED,
    DISCONNECT,
    KICKED,
    WAITING,
    NOSTATE
}

export const enum LEAVESTATE
{
    INTERNETDISCONNECTION,
    LEFT,
    THREESKIPS,
    ERROR,
    SWITCHED
}

