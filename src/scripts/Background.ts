import * as PIXI from "pixi.js";
import { Texture } from "pixi.js";
import {config } from "./appConfig";
import { Globals } from "./Globals";


export class BackgroundTile extends PIXI.TilingSprite {
    constructor(topImage : Texture,width = config.logicalWidth, height= config.logicalHeight, scaleSize = null) {

        super(topImage);


        this.width = width;
        this.height = height;

        if(scaleSize != null)
        {
            this.width *= scaleSize;
            this.height *= scaleSize;
        }
    }
}

export class BackgroundImage extends PIXI.Sprite {
    constructor(texture : Texture | undefined,width = config.logicalWidth, height= config.logicalHeight, scaleSize = null) {

        super(texture);


        this.width = width;
        this.height = height;

        if(scaleSize != null)
        {
            this.width *= scaleSize;
            this.height *= scaleSize;
        }
    }

    onResize(width : number | null = null, height : number | null = null)
    {
        if(width != null)
            this.width = width;
        
        if(height != null)
            this.height = height;
        
    }

}

export class BackgroundGraphic extends PIXI.Graphics
{

    defaultProperties : any = undefined;

    constructor(width : number, height : number, color : number )
    {
        super();
        this.defaultProperties = { 
            width : width, 
            height : height,
            color : color
        };

        this.createGraphic();
    }

    createGraphic()
    {
        this.clear();

       //draw gradient background
        this.beginFill(this.defaultProperties.color, 1);
        this.drawRect(0, 0, this.defaultProperties.width, this.defaultProperties.height);
        this.endFill();
    }

    onResize(width : number | null = null, height : number | null = null, color : number | null = null)
    {
        if(width != null)
            this.defaultProperties.width = width;
        
        if(height != null)
            this.defaultProperties.height = height;

        if(color != null)
            this.defaultProperties.color = color;
        
        this.createGraphic();
    }
}