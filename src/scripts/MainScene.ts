
import { GameScene } from './GameScene';
import { Prompt, PromptResponseType } from './Prompt';

import { Scene } from './Scene';
import { SceneManager } from './SceneManager';
import { TestingManager } from './TestingManager';


export class MainScene extends Scene
{

    constructor()
    {
        super("background", "background");


        // console.log(this);


        // const testManager = new TestingManager(this.mainContainer);

        // testManager.iniateButtons(10);

        // console.log(testManager)
        // this.joinGame();

        // const prompt = new Prompt("Joining Table....\nPlease Wait", PromptResponseType.YESORNO, undefined);
        // this.mainContainer.addChild(prompt.container);

    }


    update(dt: number): void {
        // throw new Error('Method not implemented.');
    }
    recievedMessage(msgType: string, msgParams: any): void {
        if(msgType == "matchmakingStart")
        {
            SceneManager.instance.start(new GameScene());
        }
    }


    // joinGame()
    // {
    //     new SocketManager(24, "PlayerName", 14, "https://cccdn.b-cdn.net/1584464368856.png", 20);
    // }


}
