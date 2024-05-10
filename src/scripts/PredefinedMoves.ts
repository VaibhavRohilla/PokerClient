import { Container } from "pixi.js";
import { Button, CheckboxButton } from "./Button";
import { Globals } from "./Globals";



export class PredefinedMoves extends Container
{
    

    buttons : CheckboxButton[] = [];


    constructor()
    {
        super();
       
        
        const foldCheck = new CheckboxButton("FOLD/\nCHECK","rect" , 0xFF557E);
        foldCheck.x = -200;
        foldCheck.on("pointerdown", () => {
            this.buttonPointerDown(foldCheck);
        });
        this.buttons.push(foldCheck);
        this.addChild(foldCheck);

        const check = new CheckboxButton("CHECK", "circle", 0xAB29B7);
        check.on("pointerdown", () => {
            this.buttonPointerDown(check);
        });
        this.buttons.push(check);
        this.addChild(check);

        const call = new CheckboxButton("CALL\nANY", "rect", 0x28B4E0);
        call.x =200;
        call.on("pointerdown", () => {
            this.buttonPointerDown(call);
        });
        this.buttons.push(call);
        this.addChild(call);



        // const button = new Button(Globals.resources.button.texture, )    
    }

    getCheckedButton() : number
    {
        for(let i = 0; i < this.buttons.length; i++)
        {
            if(this.buttons[i].isChecked)
            {
                return i;
            }
        }

        return -1;
    }

    buttonPointerDown(button: CheckboxButton) {
        if(button.isChecked)
        {
            button.uncheck();
            return;
        }

        this.resetAll(); 

        button.check();
    }

    resetAll() {
        for(let i = 0; i < this.buttons.length; i++)
        {
            this.buttons[i].uncheck();
        }
    }
}