import { Container, DisplayObject } from "pixi.js";
import { config } from "./appConfig";
import { BackgroundGraphic, BackgroundImage } from "./Background";
import { Globals } from "./Globals";

export abstract class Scene
{


    private sceneContainer : Container;
    private fullBackground : BackgroundGraphic | BackgroundImage;

    mainContainer : Container;
    private mainBackground : BackgroundGraphic | BackgroundImage;

    constructor(mainBackgroundColor : number | string, fullBgColor : number | string = 0x20233b)
    {
        this.sceneContainer = new Container();


        if(typeof fullBgColor == "number")
            this.fullBackground = new BackgroundGraphic(window.innerWidth, window.innerHeight, fullBgColor);
        else
            this.fullBackground = new BackgroundImage(Globals.resources[fullBgColor].texture, window.innerWidth, window.innerHeight);


        this.sceneContainer.addChild(this.fullBackground);

        this.mainContainer = new Container();

        this.resetMainContainer();

        this.sceneContainer.addChild(this.mainContainer);

        if (typeof mainBackgroundColor == "number") 
            this.mainBackground = new BackgroundGraphic(config.logicalWidth, config.logicalHeight, mainBackgroundColor);
        else 
            this.mainBackground = new BackgroundImage(Globals.resources[mainBackgroundColor].texture, config.logicalWidth, config.logicalHeight);


        this.mainContainer.addChild(this.mainBackground);
    }

    resetMainContainer()
    {
        this.mainContainer.x = config.minLeftX;
        this.mainContainer.y = config.minTopY;
        this.mainContainer.scale.set(config.minScaleFactor);
    }

    resize() : void
    {
        this.resetMainContainer();
        this.fullBackground.onResize(window.innerWidth, window.innerHeight);
    }

    initScene(container: Container) {
        container.addChild(this.sceneContainer);
    }

    addToScene(obj : DisplayObject)
    {
        this.sceneContainer.addChild(obj);
    }

    
    destroyScene() {
        this.sceneContainer.destroy();
    }

    abstract update(dt:number) : void;
    
    abstract recievedMessage(msgType : string, msgParams : any) : void;
}