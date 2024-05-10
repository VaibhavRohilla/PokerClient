import { Graphics, InteractionEvent, Sprite } from "pixi.js";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";
import { clamp } from "./Utilities";




export enum SliderDirection {
    Horizontal,
    Vertical
}


export class Slider extends Graphics
{

    handle : Graphics;
    
    private hasHandleDown : boolean = false;

    maxValue : number;
    minValue : number;

    fillBar : Graphics;

    sliderToolTip : Sprite;
    sliderLabel : TextLabel;
    

    onValueChanged!: (value: number) => void;

    constructor(x : number, y : number, public length : number, public direction : SliderDirection)
    {
        super();

        this.x = x;
        this.y = y;

        let width = 0;
        let height = 0;
        let radius = 0;
        if(direction === SliderDirection.Vertical)
        {
            width = length * 0.05;
            height = length;
            radius = width;
            this.maxValue = height/2;
            this.minValue = -height/2;

        } else
        {
            width = length;
            height = 8;
            radius = 16;
            this.maxValue = width/2;
            this.minValue = -width/2;
        }


        let fillColor = 0x33FFF3;

        this.beginFill(0x0E101B, 1);
        this.drawRoundedRect(-width/2, -height/2, width, height, 40);
        this.endFill();


        this.fillBar = new Graphics();
        this.fillBar.beginFill(fillColor, 1);
        this.fillBar.drawRoundedRect(-width/2, -10/2, width, 10, 40);
        this.fillBar.endFill();

        this.addChild(this.fillBar);

        this.sliderToolTip = new Sprite(Globals.resources.sliderTooltip.texture);
        this.sliderToolTip.anchor.set(0.5, 1);
        this.sliderToolTip.scale.set(0.8);
        this.addChild(this.sliderToolTip);

        this.sliderLabel = new TextLabel(0, 0, 0.5, "899", 32, fillColor, "Nunito Sans Black");
        this.sliderLabel.y = -this.sliderToolTip.height * 0.68;
        this.sliderToolTip.addChild(this.sliderLabel);

        this.sliderToolTip.visible = false;

        this.handle = new Graphics();
        this.handle.interactive = true;
        this.handle.beginFill(fillColor, 1);
        this.handle.drawCircle(0, 0, radius );
        this.handle.endFill();
        this.addChild(this.handle);

        this.sliderToolTip.x = this.handle.x;
        this.sliderToolTip.y = this.handle.y;


        this.handle.on("pointerdown", this.onHandleDown.bind(this));
        this.handle.on("pointermove", this.onHandleMove.bind(this));
        this.handle.on("pointerup", this.onHandleUp.bind(this));
        this.handle.on("pointerupoutside", this.onHandleUp.bind(this));
    }


    assignEventCallback(callback : (value : number) => void)
    {
        this.onValueChanged = callback;
    }

    onHandleDown(event : InteractionEvent)
    {
        if(this.hasHandleDown)
            return;

        console.log("onHandleDown");
        this.sliderToolTip.visible = true;
        this.hasHandleDown = true;
    }

    fillBarUpdate(value : number) //value : 0 - 1
    {

        if(this.direction === SliderDirection.Horizontal)
        {
            this.fillBar.clear();
            this.fillBar.beginFill(0x33FFF3, 1);
            this.fillBar.drawRoundedRect(-this.length/2, -10/2, this.length * value, 10, 40);
            this.fillBar.endFill();
        }
    }

    updateSliderToolTip()
    {
        this.sliderToolTip.x = this.handle.x;
        this.sliderToolTip.y = this.handle.y - 20;

    }

    updateSliderLabel(text : string)
    {
        this.sliderLabel.text = text;
    }

    onHandleMove(event : InteractionEvent)
    {
        if(!this.hasHandleDown)
            return;
         
        if(this.direction === SliderDirection.Horizontal)
        {
            this.handle.x = event.data.getLocalPosition(this).x;
            this.handle.x = clamp(this.handle.x, this.minValue, this.maxValue);
            this.fillBarUpdate(this.value);
        } else
        {
            this.handle.y = event.data.getLocalPosition(this).y;
            this.handle.y = clamp(this.handle.y, this.minValue, this.maxValue);
        }   
        
        this.updateSliderToolTip();

        if(this.onValueChanged)
            this.onValueChanged(this.value);
    }

    setHandleValue(value : number)
    {
        if(this.direction === SliderDirection.Vertical)
        {
            this.handle.y = (this.maxValue - this.minValue) * value + this.minValue;
        } else
        {
            this.handle.x = (this.maxValue - this.minValue) * value + this.minValue;
            this.fillBarUpdate(this.value);
        }

        this.updateSliderToolTip();
    }


    get value()
    {
        if(this.direction === SliderDirection.Horizontal)
        {
            return (this.handle.x - this.minValue) / (this.maxValue - this.minValue);
        } else
            return 1 - (this.handle.y - this.minValue) / (this.maxValue - this.minValue);
    }

    onHandleUp(event : InteractionEvent)
    {
        if(!this.hasHandleDown)
            return;

        console.log("onHandleUp");
        this.sliderToolTip.visible = false;
        this.hasHandleDown = false;
    }

    
}