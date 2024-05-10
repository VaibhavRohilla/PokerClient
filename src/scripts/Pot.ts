import { Container, Graphics, Sprite, TextureGCSystem } from "pixi.js";
import { config } from "./appConfig";
import { potType } from "./DataTypes";
import { Globals } from "./Globals";
import { TextLabel } from "./TextLabel";
import { NumberToStringWithCommas } from "./Utilities";


export class PotContainer extends Container
{
    pots : Pot[];

    constructor(Pots : Pot[] = [])
    {
        super();

        this.pots = Pots;
    }

    addPot(pot : Pot)
    {
        this.addChild(pot);
        this.pots.push(pot);
        //Arrange Pot
    }

    updatePot(pot : potType[])
    {
        for(let i=0; i<pot.length; i++)
        {

            if(this.pots[i] != undefined)
                this.pots[i].updatePot(pot[i].amount);
            else
                this.createPot(pot[i].amount);
        }


        this.updatePosition();
    }

    updatePosition()
    {

        if(this.pots.length == 0)
            return;

        
        let width = 0;

        const potsPos = [];

        potsPos.push(new Array<Pot>());
        for(let i = 0; i < this.pots.length; i++)
        {
            width += this.pots[i].width;

            if(config.logicalWidth * 0.6 <= width)
            {
                width = 0;
                
                potsPos.push(new Array<Pot>());
            }

            potsPos[potsPos.length - 1].push(this.pots[i]);
        }

         let y = 0;
        potsPos.forEach(pots => {

            let startX = 0;

            const half = pots.length/2;
            if(pots.length % 2 == 0)
            {
                startX -= (half * pots[0].width);
            } else
            {
               startX -= (Math.floor(half) * pots[0].width); 
            }


            pots.forEach(pot => {
                if(pots.length % 2 == 0)
                    pot.x = startX + pot.width/2;
                else
                    pot.x = startX;

                pot.y = y;
                startX += pot.width ;
            });

            y += pots[0].height * 1.2;
        });

      
    }

    createPot(potAmount : number)
    {
        const pot = new Pot(potAmount);
        this.addPot(pot);
    }

    deletePot(pot : Pot)
    {
        this.pots.splice(this.pots.indexOf(pot), 1);
        this.removeChild(pot);
        pot.destroy();
    }
}

export class Pot extends Graphics
{
    amount : number;
    
    
    private label : TextLabel;

    constructor(potAmount : number, position : {x : number, y : number} = {x : 0, y : 0})
    {
        super();

        this.beginFill(0x1B1D2C, 1);
        const width = 120;
        const height = 45;
        this.drawRoundedRect(-width/2, -height/2, width, height, 40);
        this.endFill();


        const chip = new Sprite(Globals.resources.playerChip.texture);
        chip.anchor.set(0, 0.5);
        chip.scale.set(0.7);
        chip.x = -width/2 + 2.5;
        chip.y = 2.5

        this.addChild(chip);

        this.x = position.x;
        this.y = position.y;
        this.amount = 0;
        

        // for(let i = 0; i < potAmount.length; i++)
        // {
        //     this.amount += potAmount[i];
        // }

        this.amount = potAmount;
        //rupee sign = \u20B9
        const fontSize = 16;
        this.label= new TextLabel(12, 0, 0.5, '\u20B9' + NumberToStringWithCommas(this.amount), fontSize, 0xffffff, "Verdana");
        this.label.y = -1;

        if(this.amount <= 99999)
        {
            this.label.style.fontSize = 16;
        }else if(this.amount <= 999999)
        {
            this.label.style.fontSize = 14;
        } else if( this.amount <= 999999)
        {
           this.label.style.fontSize = 12;
        }else if( this.amount <= 9999999)
        {
           this.label.style.fontSize = 10;
        }else
        {
           this.label.style.fontSize = 9;
        }


        this.addChild(this.label);
    }

    highlightPot()
    {
        this.clear();
        this.beginFill(0x33FFF3, 1);
        const width = 120;
        const height = 45;
        this.drawRoundedRect(-width/2, -height/2, width, height, 40);
        this.endFill();

        this.label.style.fill = 0;
    }


    updatePot(potAmount : number)
    {
        // for(let i = 0; i < potAmount.length; i++)
        // {
        //     this.amount += potAmount[i];
        // }

        this.amount = potAmount;

        this.label.updateLabelText('\u20B9' + NumberToStringWithCommas(this.amount));
    }


}