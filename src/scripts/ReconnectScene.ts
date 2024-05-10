import { GameScene } from "./GameScene";
import { CurrentGameData, Globals, PlayersList } from "./Globals";
import { Prompt, PromptResponseType } from "./Prompt";
import { Scene } from "./Scene";
import { SceneManager } from "./SceneManager";
import { SocketManager } from "./SocketManager";


export class ReconnectScene extends Scene
{
    reconnectMsg : Prompt;
    waitTimer: number;
    currentTimer: number;

    constructor(public msgToShow : string)
    {
        super("background", "background");

        // SocketManager.instance?.closeSocket();
        if(SocketManager.instance)
            SocketManager.instance!.closeSocket();


        this.reconnectMsg = new Prompt(`${this.msgToShow}\nReconnect in 5s..`, PromptResponseType.NONE, undefined);
        this.addToScene(this.reconnectMsg.container);
        this.reconnectMsg.addButton("Reconnect", false, this.onButtonPress.bind(this));
        // this.reconnectMsg.
        this.waitTimer = 5;
        this.currentTimer = this.waitTimer;


        this.reconnectMsg.toggleOverlay(false);

        setTimeout(this.pingCheckConnection.bind(this), 2000);
    }

    onButtonPress()
    {
        this.reconnectMsg.toggleOverlay(false);
        this.reconnectMsg.textUpdate(`${this.msgToShow}\nReconnecting...`);

        CurrentGameData.isReconnecting = true;

        new SocketManager(CurrentGameData.UID, PlayersList[CurrentGameData.plID].name, CurrentGameData.tableTypeID, PlayersList[CurrentGameData.plID].avatarURL, CurrentGameData.entryFee);
    }

    pingCheckConnection()
    {
        if(window.navigator.onLine)
        {
            this.startTimer();
        } else
        {
            setTimeout(this.pingCheckConnection.bind(this), 2000);
        }
    }

    startTimer()
    {
        setTimeout(() => {
            this.currentTimer--;

            if(this.currentTimer > 0)
            {
                this.reconnectMsg.textUpdate(`${this.msgToShow}\nReconnecting in ${this.currentTimer}s..`);
                this.startTimer();
            } else
            {
                this.reconnectMsg.textUpdate(`${this.msgToShow}\nReconnect Now`);
                this.reconnectMsg.toggleOverlay(true);
            }
        }, 1000);
    }

    update(dt: number): void {
        // throw new Error("Method not implemented.");
    }
    recievedMessage(msgType: string, data: any): void {
        if(msgType == "onRejoined")
        {
            SceneManager.instance.start(new GameScene(true, false, true, {
                currentBids :  data.currentBidAmts,
                amtToCall : data.amtToCall,
                bidState : data.bidState
            }));
        } 
    }

    override resize(): void {
        super.resize();

        if(this.reconnectMsg)
        this.reconnectMsg.resizeContainer();
    }
}