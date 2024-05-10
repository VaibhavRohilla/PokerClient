import { Graphics, Sprite } from "pixi.js";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";


const colors = {
    primary : 0x89FFAA,
    secondary : 0xFF557E
}

export class BidStatus extends Graphics
{
    constructor(amount : string, arrowDir : "up" | "down" | "right" | "none", colorName : "primary" | "secondary")
    {
        super();


        const amountLabel = new TextLabel(7, -1, 0.5, amount, 24, colors[colorName]);
        amountLabel.style.align = "center";
        this.addChild(amountLabel);

        const width = amountLabel.width  + 60;

        const aspectRatio = 58 / 28;

        this.clear();
        this.beginFill(colors[colorName], 0);
        this.lineStyle(4,colors[colorName], 1);
        const height = 36;
        this.drawRoundedRect(-width / 2, -height / 2, width, height, 50);
        this.endFill();
        this.zIndex = 5;


        if(arrowDir == "none")
            return;

        const arrow = new Sprite(Globals.resources["arrowDown"].texture);
        arrow.anchor.set(0.5);

        if(arrowDir == "up")
        {
            arrow.rotation = Math.PI;
            arrow.tint = 0xFF7F23;
        } else if(arrowDir == "right")
        {
            arrow.rotation = -Math.PI / 2;
            arrow.tint = 0x89FFAA;
        } else if(arrowDir == "down")
        {
            arrow.tint = 0xFF557E;
        }

        arrow.x = -width / 2 + 21;
        arrow.y = 2;
        
        this.addChild(arrow);

    }
}