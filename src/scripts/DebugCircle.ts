import * as PIXI from "pixi.js";
import { Container, DisplayObject } from "pixi.js";

export class DebugCircle extends PIXI.Graphics
{
    constructor(component : DisplayObject, radius = 5, container : Container | null = null)
    {
        super();

        let point = new PIXI.Point();
        
        component.getGlobalPosition(point, false);



        this.lineStyle(0); 
        this.beginFill(0xDE3249, 1);
        this.drawCircle(point.x, point.y, radius);
        this.endFill();

        if(container != null)
            container.addChild(this);
    }
}