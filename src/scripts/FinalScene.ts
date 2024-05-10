import * as PIXI from "pixi.js";
import {  config } from "./appConfig";
import { BackgroundGraphic } from "./Background";
import { LEAVESTATE } from "./DataTypes";
import {  CurrentGameData, Globals } from "./Globals";
import { Prompt, PromptResponseType } from "./Prompt";
import { Scene } from "./Scene";
import { SocketManager } from "./SocketManager";


const MAIN = require('./main');

export class FinalScene extends Scene
{
    prompt: Prompt;

    constructor(textToShow : string, showBtn = false) {
        super("background", "background");

        console.log("Final Scene");

        this.prompt = new Prompt("You've been disconnected", PromptResponseType.NONE, undefined);

        this.addToScene(this.prompt.container);


        if(textToShow != "")
        this.prompt.textUpdate(textToShow);


        if(showBtn)
        {
            this.prompt.addButton("Leave Game", true, this.onButtonPress.bind(this));
        }

    }


    update(dt: number): void {
        // throw new Error("Method not implemented.");
    }
    recievedMessage(msgType: string, msgParams: any): void {
        // throw new Error("Method not implemented.");
    }

    onButtonPress()
    {
        CurrentGameData.leaveState = LEAVESTATE.LEFT;

        if(SocketManager.instance)
        SocketManager.instance!.closeSocket();

        //TODO : Add JSBridge
        MAIN.leaveGameAlert();
    }
    
    override  resize(): void {
      super.resize();

      if(this.prompt)
      this.prompt.resizeContainer();
  }

}