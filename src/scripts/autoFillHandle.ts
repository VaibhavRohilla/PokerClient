import { Tween } from "@tweenjs/tween.js";
import { Container, Graphics } from "pixi.js";
import { SocketManager } from "./SocketManager";
import { TextLabel } from "./TextLabel";




const inactiveHandle = 0xadc4bf;

const activeBG = 0x3CFFD1;
const activeHandle = 0xB1FF24;


export class AutoFillHandle extends Container
{
    bgGraphic : Graphics;
    handle : Graphics;
    label : TextLabel;
    value : boolean = false;
    constructor()
    {
        super();

        this.bgGraphic = new Graphics();
        this.bgGraphic.beginFill(inactiveHandle, 0.14);
        this.bgGraphic.drawRoundedRect(-80/2, -40/2, 80, 40, 50)
        this.bgGraphic.endFill();
        this.addChild(this.bgGraphic);

        this.handle = new Graphics();
        this.handle.beginFill(inactiveHandle);
        this.handle.drawCircle(0, 0, 20);
        this.handle.endFill();

        this.handle.x = -20;

        this.addChild(this.handle);

        this.label = new TextLabel(-70, 0, 0.5, "Auto\nFill", 18, 0xffffff);
        this.addChild(this.label);

        // this.handle.interactive = true;

        // this.handle.on("pointerdown", () => {
        //     this.sendTrigger();
        // });

        this.bgGraphic.interactive = true;

        this.bgGraphic.on("pointerdown", () => {
            this.sendTrigger();
        });
    }


    sendTrigger()
    {
        const payload  = {
            t : "autofill",
            value : !this.value
        };

        SocketManager.instance?.sendMessage(payload);

        // this.handle.interactive = false;
        this.bgGraphic.interactive = false;
    }


    


    enableHandle(value : boolean)
    {
        if(value)
        {
            //tween handle to the right

            this.bgGraphic.clear();
            this.bgGraphic.beginFill(activeBG, 0.14);
            this.bgGraphic.drawRoundedRect(-80/2, -40/2, 80, 40, 50)
            this.bgGraphic.endFill();

            this.handle.clear();
            this.handle.beginFill(activeHandle);
            this.handle.drawCircle(0, 0, 20);
            this.handle.endFill();

            
            new Tween(this.handle).to({
                x : 20
            }, 200).start();
        } else 
        {
            //tween handle to the left

            this.bgGraphic.clear();
            this.bgGraphic.beginFill(inactiveHandle, 0.14);
            this.bgGraphic.drawRoundedRect(-80/2, -40/2, 80, 40, 50)
            this.bgGraphic.endFill();

            this.handle.clear();
            this.handle.beginFill(inactiveHandle);
            this.handle.drawCircle(0, 0, 20);
            this.handle.endFill();

            new Tween(this.handle).to({
                x : -20
            }, 200).start();
        }

        this.value = value;
        // this.handle.interactive = true;
        this.bgGraphic.interactive = true;
    }
}