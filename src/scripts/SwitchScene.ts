import { Socket } from "dgram";
import { GameScene } from "./GameScene";
import { CurrentGameData, Globals, ResetAllData} from "./Globals";
import { Prompt, PromptResponseType } from "./Prompt";
import { Scene } from "./Scene";
import { SceneManager } from "./SceneManager";
import { SocketManager } from "./SocketManager";
import { LEAVESTATE } from "./DataTypes";


export class SwitchScene extends Scene
{
    oldTableGameId : string;
    prompt: Prompt;

    constructor(oldTableGameId : string)
    {
        super("background", "background");

        this.oldTableGameId = oldTableGameId;

        ResetAllData();
        CurrentGameData.leaveState = LEAVESTATE.SWITCHED

        this.prompt = new Prompt("Switching to new table....\nPlease Wait", PromptResponseType.NONE, undefined);
        
        this.addToScene(this.prompt.container);


        console.log("Switching to new table....");


        setTimeout(this.switchToNewTable.bind(this), 2000);
    }
    
    switchToNewTable()
    {
        new SocketManager(CurrentGameData.UID, CurrentGameData.name, CurrentGameData.tableTypeID, CurrentGameData.avatarURL, CurrentGameData.entryFee, this.oldTableGameId);
        CurrentGameData.leaveState = undefined
    }

    update(dt: number): void {

    }
    recievedMessage(msgType: string, msgParams: any): void {
        if(msgType == "matchmakingStart")
        {
            SceneManager.instance.start(new GameScene());
        }
    }
    
    override resize(): void {
        super.resize();

        if(this.prompt)
        this.prompt.resizeContainer()
    }
}