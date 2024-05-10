
import * as PIXI from 'pixi.js';
import { GAMESTATE, LEAVESTATE, PlayerData, PLAYERSTATE, potResultType, potType, ResultData } from './DataTypes';
import { MyEmitter } from './MyEmitter';
import Stats from "stats.js";
import { SceneManager } from './SceneManager';
import { App } from './App';
import { config } from './appConfig';
import { TextLabel } from './TextLabel';
import { Howl } from 'howler';


type globalDataType = {
  resources: PIXI.utils.Dict<PIXI.LoaderResource>;
  emitter: MyEmitter | undefined;
  isMobile: boolean;
  // fpsStats : Stats | undefined,
  App : App | undefined,
  gameVerText : TextLabel | undefined,
  soundResources: { [key: string]: Howl }
};

export const Globals : globalDataType = {
  resources: {},
  emitter: undefined,
  get isMobile() {
    //  return true;
    return PIXI.utils.isMobile.any;
  },
  // fpsStats: undefined,
  App: undefined,
  soundResources : {},
  gameVerText : undefined
};


export const GameConfig = {
    maxTickTimer : 9,
    primaryColor : 0xFF557E,
    secondaryColor : 0xFFFFFF,
    primaryFont : "Nunito Sans Black",
    secondaryFont : "Roboto Condensed",
};


type currentGameDataType = {
  UID : number,
  tableTypeID : number,
  entryFee : number,
  tableGameIDHash : string,
  tableGameID : string,
  isReconnecting : boolean,
  plID : number, // Change After testing
  name : string,
  avatarURL : string,
  isDropped : boolean,
  hasStarted : boolean,
  CardsInHand : string[],
  WithdrawnCards : string[],
  // LeftList : string[]
  currentTurn : number,
  timer : number,
  maxUnits : {timer : number, extraTime : number},
  minRaiseAmt : number,
  gameState : GAMESTATE,
  leaveState : LEAVESTATE | undefined,
  errorMsg : string,
  pot : potType[],
  isMyTurn : boolean,
  assignedServerAddress : string, //TODO : Remove Later
  autoFill : boolean,
  pointVal : number,
  walletBalance : number,
  potResult : potResultType[] | undefined,
};

export const CurrentGameData : currentGameDataType = {
    UID : -1,
    tableTypeID : -1,
    entryFee : -1,
    tableGameIDHash : "",
    tableGameID : "",
    isReconnecting : false,
    plID : -1, // Change After testing
    name : "",
    avatarURL : "",
    isDropped : false,
    hasStarted : false,
    CardsInHand : [],
    WithdrawnCards : [],
    // LeftList : [],
    currentTurn : -1,
    timer : -1,
    // maxUnits : {timer : -1, extraTime : -1},
    maxUnits : {timer : 30, extraTime : 30},
    minRaiseAmt : -1,
    gameState : GAMESTATE.MATCHMAKING,
    leaveState : undefined,
    errorMsg : "",
    pot : [],
    get isMyTurn() {
      return this.currentTurn === this.plID;
    },
    assignedServerAddress : "",
    autoFill : true,
    pointVal : 0,
    walletBalance : 0,
    potResult : undefined,
};

export const ResetData = () => {
  CurrentGameData.CardsInHand = [];
  CurrentGameData.WithdrawnCards = [];
  // CurrentGameData.LeftList = [];
  CurrentGameData.hasStarted = false;
  CurrentGameData.isDropped = false;
  CurrentGameData.isReconnecting = false;
  CurrentGameData.potResult = undefined;
  
};

export const ResetAllData = () => {
  ResetData();
  CurrentGameData.plID = -1;
  // // CurrentGameData.name = "";
  // CurrentGameData.avatarURL = "";
  CurrentGameData.gameState = GAMESTATE.MATCHMAKING;
  CurrentGameData.leaveState = undefined;
  CurrentGameData.errorMsg = "";
  CurrentGameData.pot = [];

  ResultDataList.splice(0, ResultDataList.length);

  Object.keys(PlayersList).forEach((key ) => {
    delete PlayersList[parseInt(key)];
  });

};

export const ResultDataList : ResultData[] = [];


// export const ResultDataList : ResultData[] = [
//   new ResultData({name: "Player Name 1", plId: 0, result: "win", points: 24, amount: 32, cards: ["1-2", "3-4", "6-1"],reason : "pair", avatar : "https://images.pexels.com/photos/10869715/pexels-photo-10869715.jpeg"}),
//   new ResultData({name: "Player Name Is 1 and 2", plId: 1, result: "folded", points: 24, amount: -32, cards: undefined,reason : "" , avatar : "https://images.pexels.com/photos/10869715/pexels-photo-10869715.jpeg"}),
//   new ResultData({name: "abhishekdhiman", plId: 3, result: "lost", points: 24, amount: 32, cards: undefined,reason : "pair" , avatar : "https://images.pexels.com/photos/10869715/pexels-photo-10869715.jpeg"}),
//   new ResultData({name: "abhishekdhiman", plId: 4, result: "lost", points: 24, amount: 32, cards: undefined,reason : "pair" , avatar : "https://images.pexels.com/photos/10869715/pexels-photo-10869715.jpeg"}),
//   new ResultData({name: "abhishekdhiman", plId: 5, result: "lost", points: 24, amount: 32, cards: undefined,reason : "pair" , avatar : "https://images.pexels.com/photos/10869715/pexels-photo-10869715.jpeg"}),
//   new ResultData({name: "abhishekdhiman", plId: 2, result: "lost", points: 24, amount: 32, cards: undefined,reason : "pair" , avatar : "https://images.pexels.com/photos/10869715/pexels-photo-10869715.jpeg"}),
// ];

export const PlayersList : {[index:number] : PlayerData} = {};

export const removePlayerFromList =(plID : number) => {
    if(PlayersList[plID])
    {
      PlayersList[plID].remove();
      delete PlayersList[plID];
    }
};

export const initSelfPlayer : () => PlayerData = () => new PlayerData(CurrentGameData.plID, CurrentGameData.name, CurrentGameData.avatarURL, "", 0, CurrentGameData.UID);


export const AvatarPositions = [
  {x : 125, y : config.logicalHeight/2 - 150},
  {x : 125, y : config.logicalHeight/2 - 400},
  {x : config.logicalWidth/2 , y : config.logicalHeight/2 - 520},
  {x : config.logicalWidth - 125, y : config.logicalHeight/2 - 400},
  {x : config.logicalWidth - 125, y : config.logicalHeight/2 - 150},
];

export const chipPositions = [
  {x : 270, y : config.logicalHeight/2 - 120},
  {x : 270, y : config.logicalHeight/2 - 470},
  {x : config.logicalWidth/2 - 50, y : 120},
  {x : config.logicalWidth - 300, y : config.logicalHeight/2 - 470},
  {x : config.logicalWidth - 300, y : config.logicalHeight/2 - 120},
];


export const Config = {
    // apiUrl : "http://localhost:8081/api/joinserver"
    apiUrl : "http://139.59.28.242:8086/api/joinserver"
    // apiUrl : "http://139.59.86.126:8081/api/joinserver"
    // apiUrl : "https://pokerbalancer.cap.gamesapp.co/api/getserver",
    // apiUrl : "https://8447-223-178-213-193.in.ngrok.io/ge"
};