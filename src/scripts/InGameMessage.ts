import { Container, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";


export class CenterMessage
{
    private container : Container;
    private label : TextLabel;

    private allCaps : boolean = false;

    constructor(parentContainer : Container, allCaps : boolean)
    {
        this.container = new Container();

        this.allCaps = allCaps;

        this.label = new TextLabel(config.logicalWidth/2, config.logicalHeight/2 - 120, 0.5, "", 55, 0xffffff);
        this.label.style.align = "center";

        
        this.container.addChild(this.label); 
        this.container.renderable = false;
        parentContainer.addChild(this.container);
    }

    textUpdate(messageToShow : string, size : number | undefined = undefined, color : number = 0xffffff)
    {
        this.container.renderable = true;

        if(size != undefined)
            this.label.style.fontSize = size;
            
        this.label.style.fill = [color];

        this.label.text  = this.allCaps ? messageToShow.toUpperCase() : messageToShow;
    }


    disable()
    {
        this.container.renderable = false;
    }
    
}