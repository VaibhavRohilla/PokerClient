import { Container, Graphics, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";


export class KeyPad extends Container
{

    bgGraphic : Graphics;

    inputValue : string = "";

    onInputChangeCallback : (value : string) => void;

    isActive : boolean = true;

    constructor(x : number, y : number, bgColor : number, callback : (value : string) => void)
    {
        super();

        this.onInputChangeCallback = callback;
        this.x = x;
        this.y = y;

        const dimensions = {width : 250, height : 330};
        this.bgGraphic = new Graphics()
        this.bgGraphic.beginFill(bgColor, 1);
        this.bgGraphic.lineStyle({
            width : 3, 
            color : 0x313936
        })
        this.bgGraphic.drawRoundedRect(-dimensions.width/2, -dimensions.height/2, dimensions.width, dimensions.height, 10);
        this.bgGraphic.endFill();


        this.addChild(this.bgGraphic)


        let index = 1;
        for(let i=-1; i <= 1; i++)
        {
            for(let j=-1; j <= 1; j++)
            {
                this.addButton(index.toString(), 80 * j, (75 * i) - 30);
                index++;
            }
        }

        this.addButton(".", -80, (75 * 2) - 30);
        this.addButton("0", 0, (75 * 2) - 30);
        this.addButton("clear", 80, (75 * 2) - 30, true);
    }

    setActive(value : boolean)
    {
        this.isActive = value;
    }


    addButton(value : string, x : number, y : number, isSprite : boolean = false)
    {

       const button = new Graphics();
       button.beginFill(0x322a2d, 1);
       button.lineStyle({
           color : 0xe1b884, 
           width : 5
       });
       button.drawCircle(0, 0, 25);
       button.endFill();

       if(isSprite)
       {
           const sprite = new Sprite(Globals.resources[value].texture);
           sprite.anchor.set(0.5);
           sprite.scale.set(0.2);
           sprite.tint = 0xff7f50;
           button.addChild(sprite);
       } else
       {
           const text = new TextLabel(0, 0, 0.5,value, 28);
           button.addChild(text);
       }

       button.x = x;
       button.y = y;


       button.interactive = true;

       button.on("pointerdown", this.buttonDown.bind(this, value, button));

       button.on("pointerup", this.buttonUp.bind(this, button))
    

       this.bgGraphic.addChild(button);
    }

    buttonDown(value : string, button : Graphics)
    {

        if(!this.isActive)
            return;
        
        if(value == "clear")
            this.inputValue = this.inputValue.slice(0, -1);
        else      
            this.inputValue += value;
        
        button.tint = 0x8c8c8c;

        // console.log(this.inputValue);
        this.onInputChangeCallback(this.inputValue);
    }

    buttonUp(button : Graphics)
    {
        button.tint = 0xffffff;
    }
}