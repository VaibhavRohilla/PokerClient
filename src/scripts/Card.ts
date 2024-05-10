import { Tween } from "@tweenjs/tween.js";
import { Container, Sprite } from "pixi.js";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";
import { ConvertToCard } from "./Utilities";


const signNames = ["NULL", "spadeIcon", "clubIcon", "heartIcon", "diamondIcon"];

const letterCards : {[n : string] : string} = {
    "1" : "A",
    "11" : "J",
    "12" : "Q",
    "13" : "K"
}
export class Card
{

    visual : Container;
    label : TextLabel;
    sign : Sprite;
    background : Sprite;

    constructor(public cardID : string, position : {x : number, y : number}, parentContainer : Container,public defaultScaleVal : number = 1)
    {

        this.visual = new Container();

        this.background = new Sprite(Globals.resources.blankCard.texture);
        this.background.anchor.set(0.5);
        this.background.scale.set(defaultScaleVal);

        let split = cardID.split("-");


        let cardName = split[0];
        let cardSign = signNames[parseInt(split[1])];

        let color = 0xF66084
        if(cardSign == "spadeIcon" || cardSign == "clubIcon")
        {
            color = 0x51153D;
        }

        if(cardName in letterCards)
        {
            cardName = letterCards[cardName];
        }

        this.label = new TextLabel(0, -30, 0.5, cardName, 72, color, "Roboto Condensed Bold");
        this.label.style.fontWeight = "700";

        this.sign = new Sprite(Globals.resources[cardSign].texture);
        this.sign.y = 40;
        this.sign.x = -6;
        
        if(cardSign == "spadeIcon" || cardSign == "clubIcon")
        {
            this.sign.tint = 0x51153D;
        }
        
        this.sign.anchor.set(0.5);


        this.visual.addChild(this.background);

        this.background.addChild(this.label);
        this.background.addChild(this.sign);



        // if(cardID != "")
        //     this.visual = new Sprite(Globals.resources[ConvertToCard(this.cardID)].texture);
        // else
        //     this.visual = new Sprite(Globals.resources.backCard.texture);

        // this.visual.anchor.set(0.5);

        this.visual.x = position.x;
        this.visual.y = position.y;
        
        parentContainer.addChild(this.visual);

    }

    highlight(scaleValue : number = 0)
    {
        const tex = Globals.resources.highlightCard.texture;

        if(tex)
            this.background.texture = tex;

        this.visual.zIndex = 8;

        if(scaleValue != 0)
        {
            const tween = new Tween(this.background)
            .to({scale : {x : scaleValue, y : scaleValue}}, 300).start();
        }
    }

    unhighlight()
    {
        if(this.visual.zIndex == 0)
        {
            return;
        }


        const tex = Globals.resources.blankCard.texture;

        if(tex)
        {
            this.background.texture = tex;
            this.visual.zIndex = 0;
        }

        const tween = new Tween(this.background)
        .to({scale : {x : this.defaultScaleVal, y : this.defaultScaleVal}}, 100).start();

    }




    get width() : number
    {
        return this.visual.width;
    }

    remove()
    {
        this.visual.destroy();
    }

    
}