import { GAMESTATE,  LEAVESTATE, PlayerData, PLAYERSTATE, ResultData, SocketRecievedMsg, SocketSendMsg } from "./DataTypes";
import { FinalScene } from "./FinalScene";
import { GameScene } from "./GameScene";
import { Config, CurrentGameData, Globals, PlayersList, removePlayerFromList, ResultDataList} from "./Globals";
import { ReconnectScene } from "./ReconnectScene";
import { SceneManager } from "./SceneManager";
import { utf8_to_b64 } from "./Utilities";


export class SocketManager
{
    static instance : SocketManager | undefined = undefined;
    private socket : WebSocket | null = null;
    showReconnectSceneTimeout: NodeJS.Timeout | undefined;
    pingTimeout: NodeJS.Timeout | undefined;

    oldTableGameId : number | null = null;

    public constructor(uuid : number, name : string, tableTypeID : number, avatarURL : string, entryFee : number, oldTableId : string | null = null)
    {

        if(SocketManager.instance != undefined)
        {
            console.log("SocketManager already initialized");
            return;
        }
        
        SocketManager.instance = this;

        CurrentGameData.UID = uuid;
        CurrentGameData.tableTypeID = tableTypeID;
        CurrentGameData.entryFee = entryFee;
        CurrentGameData.name = name;
        CurrentGameData.avatarURL = avatarURL;
        
        const payload : any = {
            playerId : CurrentGameData.UID,
            entryFee : CurrentGameData.entryFee,
            tableTypeId : CurrentGameData.tableTypeID,
            name : CurrentGameData.name
        };

        if(oldTableId)
        {
            this.oldTableGameId = parseInt(oldTableId);
            payload["oldTableGameId"] = this.oldTableGameId;
        } else
        {
            this.oldTableGameId = null;
        }

        this.getServerURL(payload);

        // this.connectToServer("ws://localhost:8082");
        // this.connectToServer("wss://ad0b-2401-4900-1f33-f79e-8cae-cdbb-dbaf-5393.ngrok.io ");
    }


    public get getInstance() : SocketManager | undefined
    {
        return SocketManager.instance;
    }
    


    getServerURL(payLoad : any)
    {
        console.log("getServerURL");
        console.log(JSON.stringify(payLoad));
        
        fetch(Config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(payLoad),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);

                if(data.code != 200)
                {
                    console.log("Error getting server url");

                    SceneManager.instance?.start(new FinalScene(data.result ? data.result : "Error getting server url"));
                    //TODO : Load Final Scene
                    return;
                }

                CurrentGameData.tableGameIDHash = "#"+ utf8_to_b64(data.result.tableGameId);
                CurrentGameData.tableGameID = data.result.tableGameId;

                if(Globals.gameVerText)
                    Globals.gameVerText.text = CurrentGameData.tableGameID;
                
                CurrentGameData.assignedServerAddress = data.result.address;
                this.connectToServer(data.result.address);
                
            });
    }

    connectToServer(serverURL : string)
    {
        console.log("connect");

        // serverURL = "wss://46e9-223-178-213-193.in.ngrok.io";

        this.socket = new WebSocket(serverURL);

        this.defineSocketEvents();

    }

    defineSocketEvents() {
        this.socket!.onopen = (e) => {   
            console.log("Socket opened");

            let payload : any = {};


            if(this.oldTableGameId != null)
            {
                Globals.emitter?.Call("matchmakingStart");
            }
            

            // if(CurrentGameData.isReconnecting)
            // {
            //     payload = {
            //         t : SocketSendMsg.RECONNECT,
            //         plId : CurrentGameData.plID,
            //         tableId : CurrentGameData.tableGameID,
            //     };
            // } else
            // {
                payload = {
                    t : SocketSendMsg.CONNECT,
                    gid : "" +CurrentGameData.UID,
                    tableGameId : CurrentGameData.tableGameID,
                    tableTypeId : CurrentGameData.tableTypeID,
                    entryFee : CurrentGameData.entryFee,
                    pName : CurrentGameData.name,
                    pImage : CurrentGameData.avatarURL
                };
            // }

            this.sendMessage(payload);


            this.pingServer();
        };


        this.socket!.onmessage = (e) => {
            // console.log("Socket message");
            
            let data = JSON.parse(e.data);
            
            if(data.t != SocketRecievedMsg.PONG && data.t != SocketRecievedMsg.WAIT_TIMER)
            {
                
                console.log("Socket message : " + data.t);

                if(data.t == SocketRecievedMsg.PTIMER)
                {
                    console.log("PTIMER : " + data.data + " : " + data.extraTime);
                } else
                    console.table(data);

                // console.log(e.data);
            }
            this.handleMessage(data);
        };

        this.socket!.onclose = (e) => {
            console.log("Socket closed");


            SocketManager.instance = undefined;

            clearTimeout(this.pingTimeout);
            clearTimeout(this.showReconnectSceneTimeout);


            console.log("Close State : " + CurrentGameData.leaveState);

            if(e.wasClean)
            {
                console.log('Connection closed cleanly, code = ' + e.code + ' reason = ' + e.reason);

            } else
            {
                console.log('Connection died, code = ' + e.code);
            }

            console.log("Close State : " + CurrentGameData.leaveState);

            if(CurrentGameData.leaveState == LEAVESTATE.INTERNETDISCONNECTION)
            {
                SceneManager.instance.start(new ReconnectScene("Internet Disconnected!"));
            } else if (CurrentGameData.leaveState == LEAVESTATE.LEFT)
            {
                //TODO : Implement JS BRIDGE

                clearTimeout(this.showReconnectSceneTimeout);
                SceneManager.instance.start(new FinalScene("You left the game!"));
            } else if (CurrentGameData.leaveState == LEAVESTATE.THREESKIPS)
            {
                clearTimeout(this.showReconnectSceneTimeout);
                SceneManager.instance.start(new FinalScene("You skipped 3 times!\nGet Back."));
            } else if (CurrentGameData.leaveState == LEAVESTATE.ERROR)
            {
                clearTimeout(this.showReconnectSceneTimeout);
                console.log(CurrentGameData.errorMsg);
                SceneManager.instance.start(new FinalScene(CurrentGameData.errorMsg, true));

            } else if (CurrentGameData.leaveState == LEAVESTATE.SWITCHED)
            {

            }else {
                clearTimeout(this.showReconnectSceneTimeout);
                console.log("[closed]",CurrentGameData.errorMsg);
                SceneManager.instance.start(new ReconnectScene("Connection closed abnormally."));
            }

            // Globals.scene!.start(new FinalScene("Connection lost"));
        };
    }

    handleMessage(data : any) {
        if(data.t == SocketRecievedMsg.PONG)
        {
            clearTimeout(this.showReconnectSceneTimeout);
            this.pingServer();
        } else if   (data.t == SocketRecievedMsg.WAIT_TIMER)
        {
            Globals.emitter?.Call("onWaitTimer", data.data);
        } else if   (data.t == SocketRecievedMsg.JOINED)
        {
            

            CurrentGameData.plID = data.plId;
            CurrentGameData.tableGameID  = data.tId;

            CurrentGameData.walletBalance = data.wBal;

            for(let i = 0; i < data.snap.length; i++)
            {
                const pData = data.snap[i];

                const playerData = new PlayerData(pData.plId, pData.pName, pData.pImage, pData.pBal,  pData.pState, pData.pDefaultId);
                // PlayersList.push(playerData);
                PlayersList[pData.plId] = playerData;

            }

            if(data.showCards)
            {
                CurrentGameData.WithdrawnCards = data.showCards;
            }

            CurrentGameData.maxUnits.timer = data.turnTime;
            CurrentGameData.maxUnits.extraTime = data.extraTime;

            if(data.gameStarted && data.showCards)
            {
                // CurrentGameData.hasStarted = true;
                CurrentGameData.WithdrawnCards = data.showCards;
            }
            

            // if(data.gameStarted)
            //     CurrentGameData.isDropped = true;

            CurrentGameData.autoFill = data.autoFill;

            if(CurrentGameData.isReconnecting)
            {
                CurrentGameData.isReconnecting = false;

                SceneManager.instance.start(new GameScene(true,false, false, undefined));
            } else
                Globals.emitter?.Call("onJoined", {gameStarted : data.gameStarted, showCards : data.showCards});

            // Globals.emitter.Call("joined", {gameStarted : data.gameStarted});            
        } else if   (data.t == SocketRecievedMsg.REJOINED)
        {
            for(let key in PlayersList)
            {
                delete PlayersList[key];
            }

            CurrentGameData.plID = data.plId;
            CurrentGameData.tableGameID  = data.tId;

            CurrentGameData.walletBalance = data.wBal;


            CurrentGameData.CardsInHand = data.cards;
            CurrentGameData.WithdrawnCards = data.showCards;

            CurrentGameData.gameState = data.gameState;


            if(data.pointVal)
            {
                CurrentGameData.pointVal = data.pointVal;
            }

            if(data.curTurn)
                CurrentGameData.currentTurn = data.curTurn;

            CurrentGameData.pot = data.pot;

            if(data.gId)
                SceneManager.instance.updateGameId(data.gId);

            CurrentGameData.autoFill = data.autoFill;

            CurrentGameData.minRaiseAmt = data.min;

            for(let i = 0; i < data.snap.length; i++)
            {
                const pData = data.snap[i];

                const playerData = new PlayerData(pData.plId, pData.pName, pData.pImage, pData.pBal,  pData.pState, pData.pDefaultId);
                // PlayersList.push(playerData);
                PlayersList[pData.plId] = playerData;
            }

            
            CurrentGameData.maxUnits.timer = data.turnTime;
            CurrentGameData.maxUnits.extraTime = data.extraTime;

            console.log("Timer : " + data.turnTime);


            if(PlayersList[CurrentGameData.plID].state == PLAYERSTATE.FOLDED)
                CurrentGameData.isDropped = true;

                //TODO : Handle if is reconnecting
            
            if(data.result)
            {
                ResultDataList.splice(0, ResultDataList.length);

                for(let i = 0; i < data.result.length; i++)
                {
                    
                    ResultDataList.push(new ResultData(data.result[i]));
                }
            }

            

            if(CurrentGameData.isReconnecting)
            {
                CurrentGameData.isReconnecting = false;

                SceneManager.instance.start(new GameScene(true, false, true, {
                    currentBids : data.currentBidAmts,
                    amtToCall : data.amtToCall,
                    bidState : data.bidState
                }));
            } else
                Globals.emitter?.Call("onRejoined", {currentBids : data.currentBidAmts, amtToCall : data.amtToCall, bidState : data.bidState});

        } else if   (data.t == SocketRecievedMsg.PADD)
        {
            const playerData =  new PlayerData(data.plId, data.pName, data.pImage, data.bal, data.currState, data.pDefaultId);

            //TODO : ADD Check for Duplicate
            // let dataAlreadyExisted = false;
            // if(gameData.players[msg.plId])
            // {
            //     dataAlreadyExisted = true;
            // }

            PlayersList[data.plId] = playerData;


            // gameData.players[msg.plId] = plData;

            Globals.emitter?.Call("onPlayerJoined", {playerData : playerData, gameStarted : false});
            // Globals.emitter.Call("playerJoined", {data : plData, gameStarted : msg.gameStarted, exits : dataAlreadyExisted});
        } else if   (data.t == SocketRecievedMsg.PREJOIN)
        {
            const playerData = new PlayerData(data.plId, data.pName, data.pImage, data.bal, data.pState, data.pDefaultId);

            PlayersList[data.plId].remove();
            PlayersList[data.plId] = playerData;

            Globals.emitter?.Call("onPlayerReJoined", {plId : data.plId, bid : data.bid});

        } else if   (data.t == SocketRecievedMsg.GAME_START_MSG)
        {

            CurrentGameData.WithdrawnCards = [];

            for(let i = 0; i < data.snap.length; i++)
            {
                const pData = data.snap[i];
                var playerData = PlayersList[pData.plId];

                if(playerData)
                {
                    if(pData.pState != playerData!.state)
                    {
                        playerData!.state = pData.pState;
                        playerData.playerAvatarRef?.changeState(playerData.state);
                    }
    
                    playerData!.defaultId = pData.pDefaultId;
                } else
                {
                    playerData = new PlayerData(pData.plId, pData.pName, pData.pImage, pData.pBal, pData.pState, pData.pDefaultId);
                    PlayersList[pData.plId] = playerData;
                }



                if(playerData.plId == CurrentGameData.plID)
                {
                    CurrentGameData.walletBalance = pData.pWalBal;
                }

            }

            CurrentGameData.pointVal = data.pointVal;

            Globals.emitter!.Call("onGameStart", undefined);
        } else if   (data.t == SocketRecievedMsg.PLAYER_CARDS)
        {
            CurrentGameData.CardsInHand = data.cards;

            Globals.emitter!.Call("onPlayerCards", data.dealer);
        } else if   (data.t == SocketRecievedMsg.PTIMER)
        {

                CurrentGameData.currentTurn = data.currPlTurn;
                if(PlayersList[data.currPlTurn])
                    PlayersList[data.currPlTurn].extraTime = data.extraTime;
                CurrentGameData.timer = data.data;
    
                Globals.emitter!.Call("onTurnTimer", {bidState : data.bidState, plID : data.currPlTurn, amtToCall : data.amtToCall});
            

        } else if   (data.t == SocketRecievedMsg.CARD_WITHDRAW)
        {
            CurrentGameData.WithdrawnCards = [...CurrentGameData.WithdrawnCards, ...data.cards];
            Globals.emitter!.Call("onCardWithdraw", data.cards);
        } else if   (data.t == SocketRecievedMsg.NEXT_TURN)
        {
            let lastPlId = CurrentGameData.currentTurn;
            
            CurrentGameData.currentTurn = data.plId

            if(data.min)
                CurrentGameData.minRaiseAmt = data.min;

            if(data.pot)
            {
                CurrentGameData.pot = data.pot;
            }

            Globals.emitter!.Call("onNextTurn", {bidState : data.bidState, lastPl : lastPlId, callAmt : data.callAmt , pot : data.pot, amtToCall : data.amtToCall ,  status : data.lastPlStatus});
        } else if   (data.t == SocketRecievedMsg.TURNSKIPPED)
        {
            let lastPlId = CurrentGameData.currentTurn;
            CurrentGameData.currentTurn = data.plId;



            Globals.emitter!.Call("onTurnSkipped", lastPlId);
        } else if   (data.t == SocketRecievedMsg.RESULT)
        {
            ResultDataList.splice(0, ResultDataList.length);

            CurrentGameData.potResult = data.potData;

            for(let i = 0; i < data.result.length; i++)
            {
                ResultDataList.push(new ResultData(data.result[i]));
            }

            Globals.emitter!.Call("onResult", undefined);
        } else if   (data.t == SocketRecievedMsg.PLEFT)
        {
            console.log(data);
            if(data.gameState == GAMESTATE.INGAME || data.gameState == GAMESTATE.CARDDISTRIBUTION || data.isDisc)
            {
                Globals.emitter!.Call("onPlayerLeft", {plId : data.data, state : data.state, isDisconnected : data.isDisc});
            } else
            {
                Globals.emitter!.Call("onPlayerLeftInMatchmaking", {plId : data.data});
            }
        } else if   (data.t == SocketRecievedMsg.KICKEDPLAYERS)
        {
            for(let i = 0; i < data.players.length; i++)
            {
                removePlayerFromList(data.players[i]);
            }
        } else if   (data.t == SocketRecievedMsg.RECONNECTAGAIN)
        {
            CurrentGameData.leaveState = LEAVESTATE.INTERNETDISCONNECTION;
            this.socket!.close();
        } else if   (data.t == SocketRecievedMsg.ERROR)
        {
            CurrentGameData.errorMsg = data.msg;
            CurrentGameData.leaveState = LEAVESTATE.ERROR;
            console.log(CurrentGameData.errorMsg);

            // CurrentGameData.errorMsg = 
            SceneManager.instance.start(new FinalScene(data.msg, true));

        } else if   (data.t == SocketRecievedMsg.THREESKIPS)
        {
            CurrentGameData.leaveState = LEAVESTATE.THREESKIPS;
            this.socket!.close();
        } else if   (data.t == SocketRecievedMsg.GAMEENDED)
        {
            const lastPl = CurrentGameData.currentTurn;
            CurrentGameData.currentTurn = -1;
            CurrentGameData.pot = data.pot;
 
            Globals.emitter!.Call("onGameEnd", {bidState : data.bidState, pot : data.pot, callAmt : data.callAmt, lastPl : lastPl});
        } else if   (data.t == SocketRecievedMsg.PFOLDED)
        {
            PlayersList[data.plId].state = PLAYERSTATE.FOLDED;

            Globals.emitter!.Call("onPlayerFolded", data.plId);
        } else if   (data.t == SocketRecievedMsg.BLIND)
        {
        
            CurrentGameData.minRaiseAmt = data.minRaiseAmt ;
            
            Globals.emitter?.Call("onBlindMsg", data.data);
        } else if   (data.t == SocketRecievedMsg.BALUPDATE)
        {
            if(PlayersList[data.plId])
                PlayersList[data.plId].balance = data.bal;
            

            Globals.emitter?.Call("onBalUpdate");
        } else if (data.t == SocketRecievedMsg.POTUPDATE)
        {
            CurrentGameData.pot = data.pots;
            Globals.emitter?.Call("onPotUpdate");
        }
         else if   (data.t == SocketRecievedMsg.SWITCH_FAILED)
        {
            Globals.emitter?.Call("onSwitchFailed");
        } else if (data.t == SocketRecievedMsg.CALL_AMT)
        {
            Globals.emitter?.Call("onAmountCalled", {pl : data.plId, amt : data.amt});
        } else if (data.t == SocketRecievedMsg.SWITCH_SUCCESS)
        {
            CurrentGameData.leaveState = LEAVESTATE.SWITCHED;
            Globals.emitter?.Call("onSwitchSuccess", {tId : data.oldTableGameId});
        } else if (data.t == SocketRecievedMsg.gId)
        {
            if(SceneManager.instance)
            {
                // SceneManager.instance.gameIdLabel!.text = "GID : " + data.gId;
                SceneManager.instance.updateGameId(data.gId);
            }
        } else if (data.t == "autofill")
        {
            CurrentGameData.autoFill = data.val;
            Globals.emitter?.Call("onAutoFill", data.val);
        } else if (data.t == "walletUpdate")
        {
            CurrentGameData.walletBalance = data.wBal;
            Globals.emitter?.Call("onWalletUpdate");
        }
    }

    closeSocket()
    {
        this.socket?.close();

        this.socket = null;
        SocketManager.instance = undefined;
    }

    sendMessage(payload: any) {
        if(this.socket != null)
        {

            if(payload.t != SocketSendMsg.PING)
            {
                
                console.log("Sending : " + payload.t);
                console.table(payload); 
            }
            // console.log("Sending message : + " + JSON.stringify(payload));

            this.socket.send(JSON.stringify(payload));
        }
    }

    pingServer()
    {
        

        this.showReconnectSceneTimeout = setTimeout(() => {
                CurrentGameData.leaveState = LEAVESTATE.INTERNETDISCONNECTION;
                // console.log(this.socket)
                // this.socket!.close();

                console.log("Internet Disconnected!");
                SceneManager.instance!.start(new ReconnectScene("Internet Disconnected!"));
        }, 5000);

        this.pingTimeout = setTimeout(() => {
            this.sendMessage({
                t : SocketSendMsg.PING
            });
        }, 1000);
    }


}