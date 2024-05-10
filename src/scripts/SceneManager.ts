import * as PIXI from "pixi.js";
import TWEEN from "@tweenjs/tween.js";
import { Globals } from "./Globals";
import { Scene } from "./Scene";
import { Container } from "pixi.js";
import { TextLabel } from "./TextLabel";
import { config } from "./appConfig";

export class SceneManager {


    static instance : SceneManager;

    container! : PIXI.Container;
    scene : Scene | null = null;
    gameIdLabel! : TextLabel;
    constructor() {

        if(SceneManager.instance != undefined)
        {
            console.log("SceneManager already created!");
            return;
        }

        SceneManager.instance = this;
        

        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.scene = null;

        const ver = new TextLabel(10, 0, 0, "v0.1.40", 12, 0xffffff);
        ver.zIndex = 99;
        this.container.addChild(ver);

        this.gameIdLabel = new TextLabel(window.innerWidth - 150, window.innerHeight, 0, "", 12, 0xffffff);
        this.gameIdLabel.style.stroke = 0x000000;
        this.gameIdLabel.style.strokeThickness = 1;
        this.gameIdLabel.style.fontWeight = "100";
        
        this.gameIdLabel.anchor.set(1, 1);
        this.gameIdLabel.x = window.innerWidth - config.minLeftX - 22;
        this.gameIdLabel.y = window.innerHeight - 2;
        
        this.gameIdLabel.zIndex = 99;
        this.container.addChild(this.gameIdLabel);

    }


    start(scene : Scene) {

        if (this.scene)
        {
            this.scene.destroyScene();
            this.scene = null;
        }


        console.log("Starting Scene: " + scene.constructor.name);

        this.scene = scene;
        this.scene.initScene(this.container)
        // this.container.addChild(this.scene.sceneContainer);


        if( window.orientation == 90 || window.orientation == -90)
            {
                
                //orientation
            }
    }

    updateGameId(gameId : string)
    {   
        this.gameIdLabel.text = "GID : #" + gameId;
        this.gameIdLabel.x = window.innerWidth - config.minLeftX - 22;
        this.gameIdLabel.y = window.innerHeight - 2;
    }

    update(dt : number) {
        TWEEN.update();
        
        if (this.scene && this.scene.update) {
            this.scene.update(dt);
        }

        // Globals.stats.update();
        // Globals.fpsStats.update();

        // Globals.stats.begin();

        // // monitored code goes here

        // Globals.stats.end();
    }

    resize()
    {
        if (this.scene) {
            this.scene.resize();
            this.gameIdLabel.x = window.innerWidth - config.minLeftX - 22;
            this.gameIdLabel.y = window.innerHeight - 2;
        }
    }

    recievedMessage(msgType : string, msgParams : any)
    {
		if(this.scene && this.scene.recievedMessage)
        {
            this.scene.recievedMessage(msgType, msgParams);
        }
    }
}