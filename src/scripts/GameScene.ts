import { Container, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { AutoFillHandle } from "./autoFillHandle";
import { ActionButton, Button } from "./Button";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { BidState, GAMESTATE, LEAVESTATE, PlayerData, PLAYERSTATE, potResultType, potType, SocketSendMsg } from "./DataTypes";
import { FinalScene } from "./FinalScene";
import { AvatarPositions, Config, CurrentGameData, GameConfig, Globals, initSelfPlayer, PlayersList, removePlayerFromList, ResetAllData, ResetData } from "./Globals";
import { CenterMessage } from "./InGameMessage";
import { Player } from "./Player";
import { Pot, PotContainer } from "./Pot";
import { PredefinedMoves } from "./PredefinedMoves";
import { Prompt, PromptResponseType } from "./Prompt";
import { RaisePanel } from "./RaisePanel";
import { ResultScene } from "./ResultScene";
import { Scene } from "./Scene";
import { SceneManager } from "./SceneManager";
import { SocketManager } from "./SocketManager";
import { SwitchScene } from "./SwitchScene";
import { TestingManager } from "./TestingManager";
import { TextLabel } from "./TextLabel";
import { TimeoutGroup } from "./TimeoutGroup";
import { NumberToStringWithCommas, toTitleCase } from "./Utilities";


const MAIN = require('./main');

export interface onRejoinData
{
    currentBids : {[key : number] : number},
    amtToCall : number, 
    bidState : BidState
}

const buttonPositions = [
    {x : config.logicalWidth/2, y : config.logicalHeight - 140},
    {x : config.logicalWidth/2 - 200, y : config.logicalHeight - 140},
    {x : config.logicalWidth/2 + 200, y : config.logicalHeight - 140},
];

export class GameScene extends Scene
{
    players: { [id: number]: Player; };

    cardContainer : Container;
    showedCards : Card[] = [];
    cardLastPosition : {x : number, y : number} = {x : -150, y : 0};

    centerMessage : CenterMessage;
    leaveButton : Button;
    checkButton : ActionButton;
    gamePlayTimer : TextLabel
    pot: PotContainer;
    callButton: ActionButton;
    switchButton: Button;
    foldButton: ActionButton;
    raiseButton: ActionButton;
    raisePanel: RaisePanel;
    amountToCall: number = -1;
    allInButton: ActionButton;
    emptySlots: Container;
    autoFillHandle: AutoFillHandle;

    currentBidState : BidState = BidState.NULL;

    walletLabel : TextLabel;
    walletIcon: Sprite;
    predefinedMoves: PredefinedMoves;
    leavePrompt: Prompt | undefined;

    resultTimeoutGroup : TimeoutGroup = new TimeoutGroup();

    constructor(initPlayersOnStart = false, autoStart = false, isReconnecting = false, onRejoinData :  onRejoinData | undefined = undefined )
    {
        super("background", "background");


        if(!isReconnecting)
        {
            ResetData();

            if(Object.keys(PlayersList).length > 0)
            {
                Object.values(PlayersList).forEach(player => {
                    // player.state= PLAYERSTATE.INGAME;
                    console.log("Player : " + player.plId + " is in game : " + player.state);
                    if(player.state == PLAYERSTATE.LEFT)
                    {
                        removePlayerFromList(player.plId);
                    }
                });
            }
        } 


        

        // TestingManager.pushSampleData();

        this.addBgElements();


        this.players = {};


        this.emptySlots = new Container();
        this.emptySlots.x = config.logicalWidth/2;
        this.emptySlots.y = config.logicalHeight /2 + 85;
        this.mainContainer.addChild(this.emptySlots);

        this.cardContainer = new Container();
        this.cardContainer.x = config.logicalWidth /2;
        this.cardContainer.y = config.logicalHeight /2 + 85;
        this.mainContainer.addChild(this.cardContainer);

        this.centerMessage = new CenterMessage(this.mainContainer, true);
        this.centerMessage.textUpdate("Waiting for others...", 22, 0xffffff);

        this.leaveButton = new Button(Globals.resources.button.texture, "LEAVE", 0xffffff, {x : 0, y : 80}, 0.55, {
            x : -2,
            y : -8
        });

        this.leaveButton.x = this.leaveButton.width/2 + 10;
        this.leaveButton.setActive(false);
        this.leaveButton.on("pointerdown", this.onLeaveClick.bind(this));
        this.mainContainer.addChild(this.leaveButton);

        const playerBg = new Sprite(Globals.resources.playerBG.texture);
        playerBg.x = config.logicalWidth/2;
        playerBg.y = config.logicalHeight - 100;
        playerBg.anchor.set(0.5, 0.7);

        this.mainContainer.addChild(playerBg);

        this.autoFillHandle = new AutoFillHandle();
        this.autoFillHandle.x = config.logicalWidth - 56;
        this.autoFillHandle.y = 80;
        this.mainContainer.addChild(this.autoFillHandle);

        this.autoFillHandle.visible = false;

        //Switch Table Button
        this.switchButton = new Button(Globals.resources.button.texture, "SWITCH", [0xFFFFFF, GameConfig.primaryColor], {x : config.logicalWidth - 75, y : 80}, 0.55, {
            x : -2,
            y : -7
        });
        this.switchButton.x = config.logicalWidth - this.switchButton.width/2 - 10;
        this.switchButton.on("pointerdown", this.onSwitchClick.bind(this));
        this.mainContainer.addChild(this.switchButton);
        this.switchButton.toggleState("deactive");
        // this.switchButton.toggleState("disable", "SUBMITTING");




        //check button
        this.checkButton = new ActionButton(Globals.resources.circleBtn.texture, "CHECK", 0xAB29B7, buttonPositions[0], true, "right", 18);
        this.checkButton.setActive(false);
        this.checkButton.on("pointerdown", this.onCheckClick.bind(this));
        this.mainContainer.addChild(this.checkButton);


        //call button
        this.callButton = new ActionButton(Globals.resources.circleBtn.texture, "CALL", 0x89FFAA, buttonPositions[0], true, "right", 12);
        this.callButton.label.y += 5;
        this.callButton.setActive(false);
        // this.callButton.setText("Call $20.0");
        this.callButton.on("pointerdown", this.onCallClick.bind(this));
        this.mainContainer.addChild(this.callButton);


        //Drop Table Button
        this.foldButton = new ActionButton(Globals.resources.rectBtn.texture, "FOLD", GameConfig.primaryColor, buttonPositions[1], false, "down");
        this.foldButton.setActive(false);
        this.foldButton.on("pointerdown", this.onFoldClick.bind(this));
        this.mainContainer.addChild(this.foldButton);


        this.raiseButton = new ActionButton(Globals.resources.rectBtn.texture, "BET", 0xFF7F23, buttonPositions[2], false, "up");
        this.raiseButton.setActive(false);
        this.raiseButton.on("pointerdown", this.onRaiseClick.bind(this));
        this.mainContainer.addChild(this.raiseButton);
        
        this.allInButton = new ActionButton(Globals.resources.rectBtn.texture, "ALL IN", 0xFF7F23, buttonPositions[2], false, "up");
        this.allInButton.setActive(false);
        this.allInButton.on("pointerdown", this.onAllInClick.bind(this));
        this.mainContainer.addChild(this.allInButton);
        
        
        this.gamePlayTimer = new TextLabel(config.logicalWidth/2, 100, 0.5, "00", 55, 0);
        this.gamePlayTimer.renderable = false;
        this.mainContainer.addChild(this.gamePlayTimer);
        
        this.pot = new PotContainer();
        this.pot.x = config.logicalWidth/2;
        this.pot.y = config.logicalHeight/2 - 50;
        this.mainContainer.addChild(this.pot);
        
        for(let i = 0; i < 5; i++)
        {
            const emptySeatIcon = new Sprite(Globals.resources.emptySeat.texture);
            emptySeatIcon.anchor.set(0.5);
            emptySeatIcon.position.set(AvatarPositions[i].x - 2, AvatarPositions[i].y + 8);
            this.mainContainer.addChild(emptySeatIcon);
        } 
        

        this.mainContainer.sortableChildren = true;

        this.raisePanel = new RaisePanel();
        this.raisePanel.zIndex = 4;
        this.mainContainer.addChild(this.raisePanel);
        
        
        // //COMMENT THIS OUT AFTER TESTING
        // this.addPlayerAvatars();
        // this.assignPlayerCards();

        // TestingManager.pushPotAmts();

        // this.addToPot(TestingManager.Data.pots);

        // Object.keys(this.players).forEach(key => {
        //         this.players[parseInt(key)].init();
        //     });

        // this.createEmptyCardSlots();
        // this.showCards(["1-2", "8-3", "10-1", "12-1", "6-4"]); 
        // // this.centerMessage.disable();
        // this.leaveButton.setActive(true);
        // this.players[0].turnActivate(true);
        // this.players[0].updateTimer();
        // this.players[0].updateTimerVisual(0.5, true);

        // setTimeout(() => {
        //     this.startResultProcess();
        // }, 1000);
  
        //COMMENT THIS OUT AFTER TESTING


        this.predefinedMoves = new PredefinedMoves();
        this.predefinedMoves.x = buttonPositions[0].x;
        this.predefinedMoves.y = buttonPositions[0].y + 20; 
        this.mainContainer.addChild(this.predefinedMoves);
        this.predefinedMoves.visible = false;
        


        this.walletLabel = new TextLabel(config.logicalWidth - 16, 12, 0, "\u20B9 0", 16, 0xffffff);
        this.walletLabel.style.fontWeight = "normal";
        this.walletLabel.anchor.set(1, 0);

        this.walletIcon = new Sprite(Globals.resources.walletIcon.texture);
        this.walletIcon.anchor.set(1, 0);
        this.walletIcon.x = this.walletLabel.x - this.walletLabel.width - 5;
        this.walletIcon.y = 12;

        // this.walletIcon.y = this.walletLabel.y + 2;
        this.walletIcon.scale.set(0.7);

        this.mainContainer.addChild(this.walletLabel);
        this.mainContainer.addChild(this.walletIcon);
        


        if(initPlayersOnStart)
            this.addPlayerAvatars();

        if(autoStart)
        {
            this.onGameStart(isReconnecting);
        }

        // Object.values(this.players).forEach(player => {
        //     player.chipsTween(100);
        // });


   
        
        if(onRejoinData)
        {
            this.onRejoined(onRejoinData.currentBids, onRejoinData.amtToCall, onRejoinData.bidState);
        }
        
        // this.setButtonsVisual(BidState.CALL);
        
        // this.setButtonsInteractive(false);
        // this.raisePanel.enablePanel(true, {min : 10, max : 200}, this.raiseButton, this.onRaiseErrorClick.bind(this), this.onRaised.bind(this));


        

        // this.addToScene(new DebugCircle(this.raisePanel, 20));


        // const p = [
        //             { players: [ 0, 1, 2 ], amount: 6, winner: null },
        //             { players: [ 1, 2 ], amount: 16, winner: null },
        //             { players: [ 1, 2 ], amount: 16, winner: null },
        //             // { players: [ 1, 2 ], amount: 16, winner: null },
        //             // { players: [ 1, 2 ], amount: 33, winner: null }
        //             ]



        // this.addToPot(p);

        // Globals.gameVerText = new TextLabel(config.logicalWidth-10, config.logicalHeight - 10, 1, CurrentGameData.tableGameID, 24, 0xffffff);
        // this.mainContainer.addChild(Globals.gameVerText);

        //rupee sign 20B9



    }



    updateWalletLabel(amount : number)
    {
        this.walletLabel.text = "\u20B9 " + NumberToStringWithCommas(amount);
        this.walletIcon.x = this.walletLabel.x - this.walletLabel.width - 5;
        this.walletIcon.y = 12;
    }






    createEmptyCardSlots() {

        const startPos = {
            x : this.cardLastPosition.x - 0.2,
            y : this.cardLastPosition.y + 8
        }

        


        for(let i = 0; i < 5; i++)
        {
            const emptySlot = new Sprite(Globals.resources.emptySlot.texture);
            emptySlot.scale.set(0.5);
            emptySlot.anchor.set(0.5);
            emptySlot.x = startPos.x;
            startPos.x += emptySlot.width - 11.5;
            emptySlot.y = startPos.y;

            this.emptySlots.addChild(emptySlot);
        }

    }
    addBgElements() {
        const element1 = new Sprite(Globals.resources.bgElement1.texture);
        element1.anchor.set(0.5);

        element1.x = config.logicalWidth/2;
        element1.y = config.logicalHeight/2 - 100;

        this.mainContainer.addChild(element1);

    }




    update(dt: number): void {
        // throw new Error("Method not implemented.");
    }
    
    recievedMessage(msgType: string, data: any): void {

        if(msgType == "onWaitTimer")
        {

            let switchBtnState = true;

            if(data >= 3 && !this.leaveButton.renderable)
            {
                this.leaveButton.setActive(true);
            }

            if(Object.values(PlayersList).length == 1)
            {
                this.centerMessage.textUpdate("Waiting for others..." + data);
            }
            else
            {
                this.centerMessage.textUpdate("Game starting in..." + data);

                if(data < 3 && this.leaveButton.renderable)
                {
                    this.leaveButton.setActive(false);

                    if(this.leavePrompt)
                    {
                        this.leavePrompt?.container.destroy();
                        this.leavePrompt = undefined;
                    }
                } 

                if(data < 3)
                {
                    switchBtnState = false;
                }

                //empty pots
                if(this.pot.pots.length>0){
                    const pots = this.pot.pots
                    pots.forEach((el)=>{
                        this.pot.deletePot(el)
                    })
                }
            }

            if(this.switchButton.renderable != switchBtnState)
            {
                if(!switchBtnState && PlayersList[CurrentGameData.plID].state == PLAYERSTATE.WAITING)
                {
                    console.log("TOGGLE SWITCH WAITING");
                } else
                {
                    console.log("TOGGLE SWITCH");
                    console.log(switchBtnState);

                    this.switchButton.toggleState(switchBtnState ? "normal" : "deactive");

                }
            }

            if(this.showedCards.length > 0)
            {
                for(let i = this.showedCards.length - 1; i >= 0; i--)
                {
                    this.showedCards[i].visual.destroy();
                    this.showedCards.splice(i, 1);
                }

                this.cardLastPosition = {x : -150, y : 0};
            }

            if(this.emptySlots.children.length > 0)
            {
                for(let i = this.emptySlots.children.length - 1; i >= 0; i--)
                {
                    this.emptySlots.children[i].destroy();
                }
            }

        } else if (msgType == "onRejoined")
        {
            this.addPlayerAvatars();

            console.log("REJOINING : Start");
            this.onGameStart(true);

            
            this.onRejoined(data.currentBids, data.amtToCall, data.bidState);
           

        } else if (msgType == "onJoined")
        {
            this.addPlayerAvatars();
            this.leaveButton.setActive(true);
            
            if(data.gameStarted)
            {
                if(PlayersList[CurrentGameData.plID].state == PLAYERSTATE.WAITING)
                {
                    this.switchButton.toggleState("normal");
                }

                this.centerMessage.textUpdate("Game in progress");


                if(data.showCards)
                {
                    this.showCards(CurrentGameData.WithdrawnCards);
                }
                // this.waitingCardsInit();
            }

            this.updateWalletLabel(CurrentGameData.walletBalance);


        } else if (msgType == "onPlayerJoined")
        {

            // if(msgParams.exits)
            // {
            //     this.players[msgParams.data.plId].delete();
            //     delete this.players[msgParams.data.plId];
            // }


            // if(gameData.leftList.includes(msgParams.data.plId))
            //     gameData.leftList.splice(gameData.leftList.indexOf(msgParams.data.plId), 1);

            this.addPlayer(data.playerData);



            // logThis("On Joined Player added :" + msgParams.data.pName, "#FF79C6");
        } else if (msgType == "onPlayerReJoined")
        {

            this.addPlayer(PlayersList[data.plId]);

            this.players[data.plId].init();
            
            this.players[data.plId].turnActivate(data.plId == CurrentGameData.currentTurn);

            if(data.bid && data.bid > 0)
            {
                this.players[data.plId].chipsTween(data.bid);
            }
            
        } else if (msgType == "onGameStart")
        {
            console.log("GAME STARTED");

            // if(msgParams.changedPls.length > 0)
            // {
            //     for(let i = 0; i < msgParams.changedPls.length; i++)
            //     {
            //         const plId = msgParams.changedPls[i];

            //         this.players[plId].removeState();
            //     }
            // }

            this.onGameStart();
            
        } else if (msgType == "onPlayerCards")
        {
            this.players[data]?.setActiveDealer(true);
            setTimeout(() => {
                this.assignPlayerCards();
            }, 1000);
        } else if (msgType == "onTurnTimer")
        {  

            if(!CurrentGameData.hasStarted)
            {
                CurrentGameData.hasStarted = true;
                
                CurrentGameData.currentTurn = data.plID;

                
                if(data.amtToCall)
                    this.amountToCall = data.amtToCall;
                
                if(PlayersList[CurrentGameData.plID].state == PLAYERSTATE.WAITING)
                {
                    this.centerMessage.textUpdate("Game in progress");
                } else
                {
                    this.centerMessage.disable();
                }

                for(let key in this.players)
                {
                    this.players[key].init();
                }

                // this.turnBegin();

                this.turnSwitch(data.bidState);
                // if(data.amtToCall)
                //     this.turnSwitch(BidState.CALL)
                // else
                //     this.turnSwitch(BidState.CHECK);
            }

            this.players[CurrentGameData.currentTurn].updateTimer();


            // this.updateTimer(data);

        } else if (msgType == "onCardWithdraw")
        {
            for(let plID in this.players)
            {
                if(this.players[plID].currentState == PLAYERSTATE.INGAME)
                {
                    this.players[plID].updateStatus("");
                }
            }
            this.showCards(data);
        } else if (msgType == "onResult")
        {
            // SceneManager.instance.start(new ResultScene());

            this.startResultProcess();

        } else if (msgType == "onPlayerLeftInMatchmaking")
        {
            console.log(data);

            removePlayerFromList(data.plId);

        } else if (msgType == "onPlayerLeft")
        {
            if(PlayersList[data.plId].state == PLAYERSTATE.WAITING)
            {
                removePlayerFromList(data.plId);
            } else if(this.players[data.plId])
            {
                this.players[data.plId].changeState(data.state)
                PlayersList[data.plId].state = data.state;
                
                if(data.isDisconnected)
                    this.players[data.plId].disable(data.isDisconnected);

                // if(!CurrentGameData.LeftList.includes(data.plId))
                //     CurrentGameData.LeftList.push(data.plId);
            }
        } else if (msgType == "onNextTurn")
        {
            //TODO : CHECK IF CURRENT TURN CAN BE -1
            let isCalled = false;

            this.amountToCall = -1;

            if(data.callAmt)
            {
                this.players[data.lastPl].chipsTween(data.callAmt);
                // isCalled = true;
            }

            if(data.status)
                this.players[data.lastPl].updateStatus(data.status);

            if(data.amtToCall)
            {
                this.amountToCall = data.amtToCall;
                isCalled = true;

            }





            if(data.pot)
                this.addToPot(data.pot);

            if(CurrentGameData.isMyTurn)
                this.turnSwitch(data.bidState);
            else
                this.turnSwitch(BidState.NULL);


        } else if (msgType == "onTurnSkipped")
        {
            //TODO : UPDATE LIVES if needed


            // this.players[data].chipsTween();

            this.turnSwitch(BidState.NULL);

        } else if (msgType == "onGameEnd")
        {
            let isCalled = false;
            this.amountToCall = -1;
            if(data.callAmt)
            {
                this.players[data.lastPl].chipsTween(data.callAmt);
                if(data.amtToCall)
                    this.amountToCall = data.amtToCall;
                isCalled = true;
            }

            this.addToPot(data.pot);

            if(CurrentGameData.isMyTurn)
                this.turnSwitch(data.bidState);
            else
                this.turnSwitch(BidState.NULL);
        } else if (msgType == "onPlayerFolded")
        {
            this.players[data].changeState(PLAYERSTATE.FOLDED);
            this.players[data].updateStatus("fold", 0xcc0000);
            this.players[data].removeCards();
            if(data == CurrentGameData.plID)
            {
                CurrentGameData.isDropped = true;
                // this.players
                this.switchButton.toggleState("deactive");

            }
        } else if (msgType == "onBlindMsg") 
        {
            if(data)
            {
                let msg = "Half Blind"
                for(let plID in data)
                {
                    let id = parseInt(plID);
                    if(this.players[id])
                    {
                        this.players[id].chipsTween(data[plID]);
                        this.players[id].updateStatus(msg);
                        msg = "Full Blind"
                    } else
                    {
                        console.log("Player not found");
                    }

                }
            }
        } else if (msgType == "onBalUpdate")
        {
            for(let playerID in this.players)
            {
                this.players[playerID].updateBalance();
            }
        } else if (msgType == "onPotUpdate")
        {
            this.addToPot(CurrentGameData.pot);
        } else if (msgType == "onSwitchFailed")
        {
            if(this.switchButton && !CurrentGameData.hasStarted)
            {
                this.switchButton.toggleState("normal");
            }
        } else if (msgType == "onAmountCalled")
        {
            this.players[data.pl].chipsTween(data.amt);
        } else if (msgType == "onSwitchSuccess")
        {
            console.log("Switch Success");        
            this.resultTimeoutGroup.clearAll();
            SceneManager.instance.start(new SwitchScene(data.tId));
        } else if (msgType == "onAutoFill")
        {
            this.autoFillHandle.enableHandle(data);
        } else if (msgType == "onWalletUpdate")
        {
            this.updateWalletLabel(CurrentGameData.walletBalance);
        }
        // throw new Error("Method not implemented.");
    }
    startResultProcess()
    {
        //disable all buttons
        this.setButtonsVisual(BidState.NULL);
      
        //disable checkbox buttons
        this.predefinedMoves.visible = false;
       
        //disable leave button
        this.leaveButton.visible = false;
        
        //disable auto fill button
        this.autoFillHandle.visible = false;

        const potResult = CurrentGameData.potResult;

        if(potResult)
        {
            //loop through pot results
                //highlight pots
                //highlight winner
                //highlight player cards
                //highlight cards in empty slots
                //highlight yellow banner for winner
                //show crown icon for winner
                //tween chips to winner
                //remove pots visually
                //wait for 2 seconds

            this.showPotResult(0, potResult);
        }

        
        //wait for 2 seconds 
            // show result screen
    }

    showPotResult(index : number, potResult : potResultType[])
    {
        if(index >= potResult.length)
        {
            //show result screen
            this.resultTimeoutGroup.clearAll();
            SceneManager.instance.start(new ResultScene()); 
            return;
        }
        console.log(index, potResult[index].amount)

        
        const pot = this.pot.pots.find(x => x.amount == potResult[index].amount);
        console.log(pot)
        if(pot)
        {
            console.log(pot)
            pot.highlightPot();
        }

        if(pot && potResult[index].isRefund)
        {
            const winner = this.players[potResult[index].winners[0].player];

            this.chipsTween(pot, winner, potResult[index].amount);
        
            

            this.resultTimeoutGroup.addTimeout(1000, () => {
                if(pot)
                {
                    this.pot.deletePot(pot);
                }
            
                this.resultTimeoutGroup.addTimeout(500, () => {

                    this.resultTimeoutGroup.addTimeout(500, () => {
                        this.showPotResult(index + 1, potResult);
                    });
                })
            });
            
            return;
        }


        
        const winners : Player[] = [];
        for(let i = 0; i < potResult[index].winners.length; i++)
        {
            const winner = this.players[potResult[index].winners[i].player];
        
            if(winner)
            {

                console.log(this.showedCards.map(x => x.cardID));
                const cards = [...potResult[index].winners[i].cards];


                for(let j = 0; j < this.showedCards.length; j++)
                {
                    const cardIndex = cards.findIndex(x => x == this.showedCards[j].cardID);

                    if(cardIndex >= 0)
                    {
                        this.showedCards[j].highlight(0.7);
                        
                        cards.splice(cardIndex, 1);
                        j--;
                    } 
                }

                winner.highlightWinner(cards, toTitleCase(potResult[index].winners[i].type));
                winner.updateBalance();


                winners.push(winner);

                
                //wait for 2 seconds
                this.resultTimeoutGroup.addTimeout(2000, () => {
                    if(pot)
                        this.chipsTween(pot, winner, potResult[index].winners[i].amount);
                });
            }
        }


        this.resultTimeoutGroup.addTimeout(3100, () => {
            if(pot)
            {
                this.pot.deletePot(pot);
            }

            this.showedCards.forEach(x => x.unhighlight());
            
            this.resultTimeoutGroup.addTimeout(500, () => {
                winners.forEach((pl) => {
                    pl.removeHighlight();
                });

                this.resultTimeoutGroup.addTimeout(500, () => {
                    this.showPotResult(index + 1, potResult);
                });
            })
        });


       
    }

    chipsTween(pot : Pot, player : Player, amount : number)
    {
        const localPosition = {
            x : pot.x + this.pot.x,
            y : pot.y + this.pot.y
        }
        
        const chip = new Chip(Globals.resources.playerChip.texture, amount, this.mainContainer)    
        chip.x = localPosition.x;
        chip.y = localPosition.y;

        const endPosition = {
            x : player.avatarContainer.position.x,
            y : player.avatarContainer.position.y
        }
        chip.tween(endPosition);

    }

    onRejoined(currentBids : {[key : string] : number}, amtToCall : number,  bidState : BidState)
    {

        console.log(`Rejoined Called : ${JSON.stringify(currentBids)}, Amount :${amtToCall}, bidState : ${bidState}`);

        if(CurrentGameData.currentTurn >= 0)
            CurrentGameData.hasStarted = true;


            this.centerMessage.disable();
            this.leaveButton.setActive(true);
            this.switchButton.toggleState("deactive");
            this.autoFillHandle.visible = true;
            this.autoFillHandle.enableHandle(CurrentGameData.autoFill);
            console.log("Rejoin : onGameStart")
    
            this.createEmptyCardSlots();


            
        for(let key in this.players)
        {
            this.players[key].init();
        }

        if(CurrentGameData.currentTurn >= 0)
            this.players[CurrentGameData.currentTurn].updateTimer();


        //Current Bids Set    
        for(let key in currentBids)
        {
            if(this.players[parseInt(key)] && currentBids[key] > 0)
            {
                // let value = Math.trunc(currentBids[key] / 10);
                this.players[parseInt(key)].chipsTween( currentBids[key]);
            }    
        }    


        
        this.amountToCall = -1;


        if(amtToCall)
        {
            this.amountToCall = amtToCall;
            // isCalled = true;
        }    



        this.pot.updatePot(CurrentGameData.pot);

        if(CurrentGameData.isMyTurn)
            this.turnSwitch(bidState);
        else
            this.turnSwitch(BidState.NULL);



        this.assignPlayerCards();
        this.showCards(CurrentGameData.WithdrawnCards);


    }

    turnBegin()
    {

    }

    onGameStart(isRejoining = false)
    {

        this.centerMessage.disable();
        this.leaveButton.setActive(true);  

          //empty pots
        if(this.pot.pots.length>0){
            const pots = this.pot.pots
            pots.forEach((el)=>{
                this.pot.deletePot(el)
            })
        }


        if(PlayersList[CurrentGameData.plID].state == PLAYERSTATE.WAITING)
        {
            this.switchButton.toggleState("normal");
        } else
        {
            
            this.switchButton.toggleState("deactive");
        }

        this.autoFillHandle.visible = true;
        this.autoFillHandle.enableHandle(CurrentGameData.autoFill);
        console.log("Rejoin : onGameStart")


        this.createEmptyCardSlots();

        if(isRejoining)
        {
            console.log("Rejoin " + CurrentGameData.gameState);

            if (CurrentGameData.gameState == GAMESTATE.INGAME)
            {
                
                // this.assignPlayerCards();
                // this.showCards(CurrentGameData.WithdrawnCards);
            } else if (CurrentGameData.gameState == GAMESTATE.RESULT)
            {
                this.resultTimeoutGroup.clearAll();
                SceneManager.instance.start(new ResultScene());

            }
        }


        this.updateWalletLabel(CurrentGameData.walletBalance);

    }

    onPlayerDeleted(plID : number)
    {
        console.log("Player Deleted : " + plID);
        console.log(this.players);
        if(this.players[plID])
        {
            delete this.players[plID];
        }
    }

    turnSwitch(state : BidState)
    {
        for(let key in this.players)
        {
            this.players[key].turnActivate(CurrentGameData.currentTurn ==  parseInt(key));
        }


        if(CurrentGameData.currentTurn == CurrentGameData.plID)
        {
            Globals.soundResources.turnChange.play();
            this.setButtonsVisual(state);
        } else
        {   
            this.setButtonsVisual(BidState.NULL);
        }


        //TODO : ADD TURN CHANGE SOUND



    }

    setButtonsInteractive(value : boolean)
    {
        this.checkButton.interactive = value;
        this.callButton.interactive = value;
        this.raiseButton.interactive = value;
        this.foldButton.interactive = value;
        this.allInButton.interactive = value;
    }


    setButtonsVisual(bidState : BidState)
    {

        this.currentBidState = bidState;

        if(bidState == BidState.NULL)
        {
            this.checkButton.setActive(false);
            this.callButton.setActive(false);
            this.raiseButton.setActive(false);
            this.foldButton.setActive(false);
            this.raisePanel.enablePanel(false);
            this.allInButton.setActive(false);

            if(PlayersList[CurrentGameData.plID].state == PLAYERSTATE.INGAME)
                this.predefinedMoves.visible = true;
            else
                this.predefinedMoves.visible = false;
            return;
        }
        let index = this.predefinedMoves.getCheckedButton();

        if(bidState == BidState.CHECK)
        {
            if(index == 0)
            {
                //check
                this.onCheckClick();
                
            } else if(index == 1)
            {
                this.onCheckClick();
                //check
            }
            
        } else 
        {

            if(index == 0)
            {
                this.onFoldClick();
                //fold
            } else if (index == 2)
            {
                if(bidState == BidState.CALL)
                {
                    this.onCallClick();
                    //call
                } else if(bidState == BidState.ALLIN)
                {
                    this.onAllInClick(); 
                    //all in
                }
            }
        }

        this.predefinedMoves.resetAll();
        this.predefinedMoves.visible = false;


        this.raiseButton.setActive(bidState != BidState.ALLIN);
        this.foldButton.setActive(true);

        console.log("Buttons Visual toggling : " + bidState);
        
        this.checkButton.setActive(bidState == BidState.CHECK);
        this.callButton.setActive(bidState == BidState.CALL);
        
        if(bidState == BidState.CALL)
            this.callButton.setText("CALL\n" + this.amountToCall);
            // this.callButton.setText("Call");

        this.allInButton.setActive(bidState == BidState.ALLIN);

        if(bidState == BidState.ALLIN)
            this.callButton.setText("ALL IN\n" + PlayersList[CurrentGameData.currentTurn].balance);


        if(!this.raiseButton.renderable)
            this.raisePanel.enablePanel(false);


        
 


    }

    

    onLeaveClick()
    {

        this.leavePrompt = new Prompt("Are you sure you want to leave?", PromptResponseType.YESORNO, this.leaveGame.bind(this));

        this.leavePrompt.container.on("removed", () => {
            this.leavePrompt = undefined;
        });

        this.addToScene(this.leavePrompt.container);


    }



    onCheckClick()
    {
        this.setButtonsVisual(BidState.NULL);
        Globals.soundResources.click.play();

        const payload = {
            t : SocketSendMsg.CHECK,
            plId : CurrentGameData.plID
        }

        SocketManager.instance?.sendMessage(payload);
    }

    onCallClick()
    {  

        if(this.amountToCall == -1)
        {
            
            // if(!this.raisePanel.renderable)
            // {
            //     this.raisePanel.enablePanel(true, {min : 5, max : parseFloat(PlayersList[CurrentGameData.plID].balance)}, this.callButton, this.onCallClick.bind(this));
            //     return;
            // }

            // this.raisePanel.enablePanel(false);
            // this.setButtonsVisual(false, false, false);
            
    
            // const payload = {
            //     t : SocketSendMsg.CALL,
            //     amt : this.raisePanel.getAmount(),
            // }
    
            // SocketManager.instance?.sendMessage(payload);

            return;
        }
        Globals.soundResources.click.play();
        this.setButtonsVisual(BidState.NULL);

        const payload = {
            t : SocketSendMsg.CALL,
            amt : this.amountToCall,
        }

        SocketManager.instance?.sendMessage(payload);
    }

    onRaiseErrorClick(state : boolean)
    {
        this.raiseButton.tint = state ? 0x2b4929 : GameConfig.primaryColor;
        // this.raiseButton.buttonLabel.tint = state ? 0x696a69 : 0xffffff;
        this.raiseButton.interactive = !state;   
        Globals.soundResources.click.play();
        this.setButtonsVisual(this.currentBidState);
    }

    onRaiseClick()
    {
        Globals.soundResources.click.play();
        
        if(!this.raisePanel.visible)
        {
            this.setButtonsInteractive(false);
            this.raisePanel.enablePanel(true, {min : CurrentGameData.minRaiseAmt, max : parseFloat(PlayersList[CurrentGameData.plID].balance)}, this.raiseButton, this.onRaiseErrorClick.bind(this), this.onRaised.bind(this));
            return;
        }
        
        
    }  

    onRaised()
    {
        console.log("Raised");
        console.log(this.raisePanel == undefined)
        this.raisePanel.enablePanel(false);
        
        this.setButtonsVisual(BidState.NULL);

        if(this.raisePanel.minRaiseAmt >= this.raisePanel.maxRaiseAmt)
        {
            this.onAllInClick();
        } else
        {

            const payload = {
                t : SocketSendMsg.RAISE,
                amt : this.raisePanel.getAmount(),
            }
    
            SocketManager.instance?.sendMessage(payload);
        }
    }
    
    onAllInClick()
    {
        this.setButtonsVisual(BidState.NULL);
        Globals.soundResources.click.play();
 
        const payload = {
            t : SocketSendMsg.ALLIN,
        }

        SocketManager.instance?.sendMessage(payload);       
    }




    onSwitchClick()
    {
        // const prompt = new Prompt("Are you sure you want to switch?", PromptResponseType.YESORNO, this.switchTable.bind(this));
        
        // this.prompt.container.on("destroy", () => {
        //     this.prompt = undefined;
        // });


        Globals.soundResources.click.play();

        this.switchButton.toggleState("disable", "Switching");

        // this.switchButtonToggle("wait");

        const payload = {
            t : SocketSendMsg.SWITCH,
            plId : CurrentGameData.plID
        }

         
        
        SocketManager.instance?.sendMessage(payload);
        
        console.log("switching table"); 
        return;
        
        
        // ResetAllData();
        // SceneManager.instance.start(new GameScene());
        

    }


    onFoldClick()
    {

        console.log("Fold Clicked");
        this.setButtonsVisual(BidState.NULL);
        Globals.soundResources.click.play();
        
        this.foldButton.setActive(false);

        const payload = {
            t : SocketSendMsg.FOLD,
            plId : CurrentGameData.plID
        }

        SocketManager.instance?.sendMessage(payload);
    }

 

    raiseBid(amt : number)
    {

    }
   
    addToPot(pot : potType[]) {

        this.pot.updatePot(pot);
        

        Object.values(this.players).forEach(player => {
            // player.removeChip(this.pot.position);
            player.removeChip();
        });
    }

    leaveGame()
    {
        this.leaveButton.interactive = false;
        this.leaveButton.renderable = false;
        CurrentGameData.leaveState = LEAVESTATE.LEFT;
        // Globals.socket?.socket.close();

        const payload = {
            t : "clickedLeave"
        }

        SocketManager.instance?.sendMessage(payload);

        setTimeout(() => {

            MAIN.leaveGameAlert();

            this.resultTimeoutGroup.clearAll();
            SceneManager.instance.start(new FinalScene("You Left!"));
        }, 3000);
    }



    addSelfPlayer()
    {
        const selfPlayer = initSelfPlayer();
        PlayersList[selfPlayer.plId] = selfPlayer;
    }

    addPlayerAvatars()
    {
        // console.log(PlayersList);

        for(let i = 0; i < 6; i++)
        {
            console.log();
            if(PlayersList[i] != undefined)
            {
                this.addPlayer(PlayersList[i]);
            }
        }
        
        // for(let i=0; i < Object.values(PlayersList).length; i++)
        // {
        //     this.addPlayer(Object.values(PlayersList)[i]);
        // }
    }




    addPlayer(plData: PlayerData) {
        
        let position = undefined;
        let cardPosition = {x : 320, y : 0};

        
        if(!plData.isSelf)
        {
            // position = (plData.plId != 5) ? AvatarPositions[plData.plId] : AvatarPositions[CurrentGameData.plID];

            let seatIndex = plData.plId - CurrentGameData.plID;
            if(seatIndex < 0)
            {
                seatIndex = 5 + seatIndex;
            } else if (seatIndex > 0)
            {
                seatIndex = seatIndex - 1;
            }
            // kklseatIndex;
            console.log(plData.plId + " : seatIndex : " + seatIndex);
            position = AvatarPositions[seatIndex];

            // cardPosition = (plData.plId != 5) ? CardsPosition[plData.plId] : CardsPosition[CurrentGameData.plID];
        }

        const player = new Player(plData.plId, plData.name, plData.balance, position, plData.isSelf, this.mainContainer, this.onPlayerDeleted.bind(this));

        if(this.players[plData.plId])
        {
            this.players[plData.plId].delete();

        }

        this.players[plData.plId] = player;

        //TODO set player state 

        this.players[plData.plId].changeState(PlayersList[plData.plId].state);
    }


    assignPlayerCards()
    {
        for(let i=0; i < Object.values(this.players).length; i++)
        {
            const player = Object.values(this.players)[i];

            if(player.currentState == PLAYERSTATE.WAITING)
                continue;


            player.assignCards(this.mainContainer);
        }   
    }

    showCards(cards: string[]) {
        console.log("Cards created");
        console.log(cards);
        for(let i=0; i < cards.length; i++)
        {

            const card = new Card(cards[i], this.cardLastPosition, this.cardContainer, 0.5);

            this.showedCards.push(card);
            this.cardContainer.sortableChildren = true;
            this.cardLastPosition.x += card.width + 5;

            

            // position.x += 50;

            Globals.soundResources.cardDiscard.play();
        }
    }

    
	updateTimer(time : number) {

        if(!this.gamePlayTimer.renderable)
            this.gamePlayTimer.renderable = true;

		const seconds = Math.floor(time % 60);
		const minutes = Math.floor(time / 60);
		console.log(seconds, minutes, "TIMIEMIMT");
		let timeString : string = ((minutes < 10) ? minutes.toString().padStart(2,"0") : minutes).toString();
		timeString += ":"
		timeString += (seconds < 10) ? seconds.toString().padStart(2,"0") : seconds;
		console.log(timeString);
		
        
		if(time < 3)
		{
			this.gamePlayTimer.updateLabelText(timeString, 0xfb6163);
			Globals.soundResources.timeTick.play(); 

			try
			{
				navigator.vibrate(300);
			}
			catch
			{
				console.log("Navigator blocked by device.");
			}
		} else
        {
            this.gamePlayTimer.updateLabelText(timeString);
        }

	}

    override resize(): void 
    { 
       super.resize();

       if(this.leavePrompt)
        this.leavePrompt.resizeContainer();
    }
}