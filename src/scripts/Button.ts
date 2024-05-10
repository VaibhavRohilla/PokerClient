import { Graphics, Resource, Sprite, Texture, TextureGCSystem } from "pixi.js";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";
import { clamp } from "./Utilities";


type STATE = "normal" | "disable" | "deactive";

export class Button extends Sprite
{

    buttonLabel! : TextLabel;
    
    maxCharacters : number = 8;
    characterSize : number = 42;
    
    labelColor : number;

    state : STATE = "normal";

    textOffset : {x : number, y : number} = {x : 0, y : 0};

    constructor(texture : Texture<Resource> | undefined, text : string | undefined, color : number | number[], position : {x : number, y : number}, public labelPercent : number = 0.6, textOffset : {x : number, y : number} = {x : 0, y : 0})
    {
        super(texture);
        this.interactive = false;
        this.anchor.set(0.5);

        if(color instanceof Array)
        {
            this.labelColor = color[1];
            this.tint = color[0];
        }
        else
        {            
            this.labelColor = color;
            this.tint = color;
        }

        if(text)
        {
            console.log(text, (this.maxCharacters / text.length));
        
            let characterRatio = (this.maxCharacters / text.length);
            characterRatio = clamp(0, labelPercent, characterRatio);
            this.buttonLabel = new TextLabel(textOffset.x, textOffset.y, 0.5, text,this.characterSize *  characterRatio, this.labelColor);
            this.addChild(this.buttonLabel);
        }


        this.x = position.x;
        this.y = position.y;

        
    }

    setActive(active : boolean)
    {
        this.renderable = active; 
        this.interactive = active;
    }

    toggleState(state : STATE, text : string | undefined = undefined)
    {

        if(state == this.state)
            return;

        this.state = state;
        

        if(state != "deactive")
        {

            if(state == "disable")
            {
                this.buttonLabel.style.fill = 0x999999;
                this.interactive = false;
            }
            else
            {
                this.buttonLabel.style.fill = this.labelColor;
                this.interactive = true;
                console.log("Interactive ON");
            }

            this.renderable = true;
            // this.setActive(true);

            if(text != undefined)
            {
                this.setText(text, this.buttonLabel.style.fill);
            }
        } else
        {
            this.interactive = false;
            // this.setActive(false);

            this.renderable = false;
        }
    }


    setText(text : string, color? : number)
    {
        if(!this.buttonLabel)
            return;


        // this.buttonLabel.y = this.textOffset.y;
        // this.buttonLabel.x = this.textOffset.x;
        this.buttonLabel.updateLabelText(text, color ? color : this.labelColor);
        let characterRatio = (this.maxCharacters / text.length);
        characterRatio = clamp(0,this.labelPercent , characterRatio);
        this.buttonLabel.style.fontSize = this.characterSize * characterRatio;
    }
}


export class ActionButton extends Sprite
{

    label : TextLabel;
    border : Sprite;
    arrow : Sprite;

    constructor(texture : Texture<Resource> | undefined, text : string, color : number, position : {x : number, y : number}, isCircle :boolean, arrowDir : "up" | "down" | "right", fontSize : number = 24)
    {
        super(texture);

        this.anchor.set(0.5);

        this.x = position.x;
        this.y = position.y;
        
        this.label = new TextLabel(0, 0, 0.5, text, fontSize, color);
        this.label.style.align = "center";
        this.label.x = -5;
        // this.label.y = -5;

        this.border = new Sprite(Globals.resources[isCircle ? "circleBorder" : "rectBorder"].texture);
        this.border.anchor.set(0.5);
        this.border.x = -5;
        this.border.y = -5;
        this.border.tint = color;

        this.arrow = new Sprite(Globals.resources["arrowDown"].texture);
        this.arrow.anchor.set(0.5);

        if(arrowDir == "up")
        {
            this.arrow.rotation = Math.PI;
        } else if(arrowDir == "right")
        {
            this.arrow.rotation = -Math.PI / 2;
        }

        this.arrow.tint = color;

        this.arrow.x = -5;
        this.arrow.y = -25;

        this.addChild(this.arrow);
        this.addChild(this.border);
        this.addChild(this.label);
    }


    setActive(active : boolean)
    {
        this.renderable = active;
        this.interactive = active;
    }

    setText(text : string)
    {
        this.label.updateLabelText(text);
    }


}


type ButtonType = "rect" | "circle";

export class CheckboxButton extends Sprite
{

    label : TextLabel;
    border : Sprite;
    box : Graphics;
    checkMark : Sprite;
    isChecked : boolean = false;



    constructor(label : string, public type: ButtonType, public labelColor : 0xFF557E | 0xAB29B7 | 0x28B4E0)
    {
        super(Globals.resources[type + "Btn"].texture);
        this.anchor.set(0.5);

        this.interactive = true;
        this.label = new TextLabel(0, 0, 0.5, label, 16, labelColor, "Nunito Sans Black");
        this.label.style.align = "center";
        this.label.x = -5;
        this.label.y = 10;
        // this.label.y = -5;

        this.border = new Sprite(Globals.resources[this.type + "Border"].texture);
        this.border.anchor.set(0.5);
        this.border.x = -5;
        this.border.y = -5;
        this.border.tint = labelColor;

        this.addChild(this.border);
        this.addChild(this.label);


        this.box = new Graphics();
        this.box.beginFill(labelColor, 0);
        this.box.lineStyle(2, labelColor);
        this.box.drawRoundedRect(-10, -10, 20, 20, 6);
        this.box.endFill();
        this.box.y = -25;
        this.box.x = -5;
        this.addChild(this.box);


        this.checkMark = new Sprite(Globals.resources["checkMark"].texture);
        this.checkMark.anchor.set(0.5);
        this.checkMark.tint = labelColor;
        this.checkMark.visible = false;
        this.box.addChild(this.checkMark);
    }

    check()
    {
        this.checkMark.visible = true;
        this.isChecked = true;
    }

    uncheck()
    {
        this.checkMark.visible = false;
        this.isChecked = false;
    }


}