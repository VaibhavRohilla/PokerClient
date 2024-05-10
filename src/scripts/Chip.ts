import { Easing, Tween } from "@tweenjs/tween.js";
import { Container, Resource, Sprite, Texture } from "pixi.js";
import { config } from "./appConfig";
import { PlayerData } from "./DataTypes";
import { chipPositions, CurrentGameData } from "./Globals";
import { TextLabel } from "./TextLabel";



export class Chip extends Sprite
{

    amountLabel: TextLabel;

    constructor(texture :  Texture<Resource> | undefined, amount : number, parentContainer : Container | null)
    {
        super(texture);
        

        this.anchor.set(0.5);

            
        this.amountLabel = new TextLabel(30, 0, 0, amount.toString(), 24, 0xffffff);
        this.amountLabel.anchor.set(0, 0.5);
        this.amountLabel.style.fontWeight = 'bold';

        this.addChild(this.amountLabel);
        

        if(parentContainer != null)
            parentContainer.addChild(this);

    }

    tween(endPosition : {x : number, y : number})
    {
        if(endPosition)
        {
            console.log("tweening");
            console.log(endPosition);
            const tween = new Tween(this).to(endPosition, 1000).easing(Easing.Quadratic.Out).onComplete(() => {
                this.destroy();
            }).start();
        }
    }

    tweenToPot(potPosition : {x : number, y : number})
    {
        const tween = new Tween(this).to(potPosition, 1000).easing(Easing.Quadratic.Out).onComplete(() => {
            this.destroy();
        }).start();
    }
}