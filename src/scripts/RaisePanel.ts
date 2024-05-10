import { Container, DisplayObject, Graphics, Sprite } from "pixi.js";
import { config } from "./appConfig";
import { Button } from "./Button";
import { CurrentGameData, GameConfig, Globals } from "./Globals";
import { KeyPad } from "./Keypad";
import { Slider, SliderDirection } from "./Slider";
import { TextLabel } from "./TextLabel";
import { clamp, onlyNumbers } from "./Utilities";


const inactiveColor = 0x33FFF3;
const activeColor = 0xFF7F23;

export class RaisePanel extends Container
{

    maxRaiseAmt : number = 100;
    minRaiseAmt : number = 10;
    slider: Slider;
    inputValue : string = "";

    raiseLabel : TextLabel;
    minLabel : TextLabel;
    maxLabel : TextLabel;

    amountBtnsContainer : Container;

    raiseCallback : (() => void) | undefined;

    constructor()
    {
        super();

        const panelConfig = {
            width : 400,
            height : 600
        }

        this.x = config.logicalWidth/2;
        this.y = config.logicalHeight;

        const background = new Sprite(Globals.resources.playerBG.texture);
        background.anchor.set(0.5, 1);
        this.addChild(background);

        const closeBtn = new Button(Globals.resources.cancelBtn.texture, "CANCEL", 0xffffff, {
            x : 0, y : -80});
        closeBtn.interactive = true;
        closeBtn.buttonLabel.x -= 5;
        closeBtn.buttonLabel.y -= 5;
        closeBtn.buttonLabel.style.fill = [GameConfig.primaryColor];
        closeBtn.x = -background.width/2 + closeBtn.width/2 + 40;
        closeBtn.on('pointerdown', () => {
            this.errorPanel(false);
            this.enablePanel(false);
        });
        this.addChild(closeBtn);


        const raiseBtn = new Button(Globals.resources.raiseBtn.texture, "", 0xffffff, {
            x : 0, y : -80});
        raiseBtn.interactive = true;
        raiseBtn.x = background.width/2 - raiseBtn.width/2 - 40;
        raiseBtn.on('pointerdown', () => {
            if(this.raiseCallback)
            {
                this.raiseCallback();
                this.raiseCallback = undefined;
            }
        });
        this.raiseLabel = new TextLabel(0, 0, 0.5, "RAISE", 28, 0x33FFF3, "Nunito Sans Black");
        this.raiseLabel.x -= 5;
        this.raiseLabel.y -= 5;

        raiseBtn.addChild(this.raiseLabel);


        const raiseBorder =  new Sprite(Globals.resources.raiseBtnBorder.texture);
        raiseBorder.anchor.set(0.5);
        raiseBorder.x -= 5;
        raiseBorder.y -= 5;
        raiseBtn.addChild(raiseBorder);
        this.addChild(raiseBtn);


        
        
        
        //rupee sign = \u20B9
        this.minLabel = new TextLabel(0, 0, 0.5,"" , 12, 0xA095BE, "Nunito Sans Black");
        this.minLabel.x = -background.width/2 + 40;
        this.minLabel.y = -background.height * 0.5 - 30;
        this.addChild(this.minLabel);

        this.maxLabel = new TextLabel(0, 0, 0.5, "", 12, 0xA095BE, "Nunito Sans Black");
        this.maxLabel.x = background.width/2 - 40;
        this.maxLabel.y = -background.height * 0.5 - 30;
        this.addChild(this.maxLabel);
        
        this.slider = new Slider(background.x, -background.height * 0.45, background.width * 0.9, SliderDirection.Horizontal);
        this.slider.assignEventCallback(this.onSliderValueChanged.bind(this));
        this.addChild(this.slider);
        
        this.amountBtnsContainer = new Container();

        this.addChild(this.amountBtnsContainer);

        for(let i = 0; i < 3; i++)
        {
            const btn = new Button(Globals.resources.amountBtn.texture, "100", 0xffffff, {
                x : 0, y : -80});
            btn.interactive = true;
            btn.x = -background.width/2 + btn.width/2 + 60 + (i * (btn.width * 0.9));
            btn.y = -background.height * 0.5 - 100;
            btn.buttonLabel.anchor.set(0, 0.5);
            btn.buttonLabel.x -= 5;
            btn.buttonLabel.y -= 5;
            btn.buttonLabel.style.fontSize = 18;
            btn.buttonLabel.style.fontFamily = "Nunito Sans Black";
            btn.on('pointerdown', () => {
                this.activeButtonsEffect(btn);
                this.updateAmount(parseFloat(btn.buttonLabel.text));
            });

            const chip = new Sprite(Globals.resources.playerChip.texture);
            chip.anchor.set(0, 0.5);
            chip.scale.set(0.8);
            chip.x = -btn.width/2 + 20;  
            btn.addChild(chip);

            btn.buttonLabel.x = chip.x  + chip.width/2 + 20;

            const btnBorder = new Sprite(Globals.resources.amountBorder.texture);
            btnBorder.anchor.set(0.5);
            btnBorder.x -= 5;
            btnBorder.y -= 5;
            btnBorder.tint = inactiveColor;
            btn.addChild(btnBorder);
            btn.setChildIndex(btnBorder, 0);
            
            this.amountBtnsContainer.addChild(btn);
        }

        const allInBtn = new Button(Globals.resources.allInBtn.texture, "ALL IN", 0xffffff, {
            x : 0, y : -80});

        allInBtn.interactive = true;
        allInBtn.x = this.amountBtnsContainer.getChildAt(2).x + 150;
        allInBtn.y = -background.height * 0.5 - 100;
        allInBtn.buttonLabel.anchor.set(0, 0.5);
        allInBtn.buttonLabel.x -= 5;
        allInBtn.buttonLabel.y -= 4;
        allInBtn.buttonLabel.style.fill = [0xffffff];
        allInBtn.buttonLabel.style.fontSize = 18;
        allInBtn.buttonLabel.style.fontFamily = "Nunito Sans Black";
        allInBtn.on('pointerdown', () => {
            this.activeButtonsEffect(allInBtn);
            this.allInAmount();
        });

        const allInChip = new Sprite(Globals.resources.playerChip.texture);
        allInChip.anchor.set(0, 0.5);
        allInChip.scale.set(0.8);
        allInChip.x = -allInBtn.width/2 + 30;
        allInChip.y = -2;
        allInBtn.addChild(allInChip);
        allInBtn.buttonLabel.x = allInChip.x  + allInChip.width/2 + 20;

        const allInBorder = new Sprite(Globals.resources.allInBtnBorder.texture);
        allInBorder.anchor.set(0.5);
        allInBorder.x -= 5;
        allInBorder.y -= 5;
        allInBorder.tint = inactiveColor;
        allInBtn.addChild(allInBorder);

        allInBtn.setChildIndex(allInBorder, 0);

        this.amountBtnsContainer.addChild(allInBtn);
        

        const sliderValue = this.slider.value;

        this.visible = false;

    }

    activeButtonsEffect(btn : Button)
    {
        Globals.soundResources.click.play();
        for(let i = 0; i < this.amountBtnsContainer.children.length; i++)
        {
            const tempBtn = this.amountBtnsContainer.getChildAt(i) as Button;

            const border = tempBtn.getChildAt(0) as Sprite;

            border.tint = inactiveColor;

            tempBtn.buttonLabel.style.fill = [0xffffff];
        }


        btn.buttonLabel.style.fill = [activeColor];
        const border = btn.getChildAt(0) as Sprite;
        border.tint = activeColor;

    }

    allInAmount() {
        this.updateAmount(this.maxRaiseAmt);
    }

    updateAmount(amount : number)
    {
        console.log("update amount", amount);
        this.onInputUpdate(amount.toString());
    }

    onInputUpdate(inputValue : string)
    {

        if(onlyNumbers(inputValue))
        {
            const value : number = parseFloat(parseFloat(inputValue).toFixed(2));

            // this.input.text = clamp(value, this.minRaiseAmt, this.maxRaiseAmt);

            // if(value < this.minRaiseAmt || value > this.maxRaiseAmt)
            //     this.errorPanel(true);
            // else
            //     this.errorPanel(false);
        } else
        {
           
            // this.errorPanel(true);
        }


        console.log("onInputUpdate", inputValue);

        this.inputValue = inputValue;
        // this.input.text = inputValue;

        this.updateSliderValue();
    }

    errorPanel(state : boolean)
    {
       if(this.potErroredCallback)
            this.potErroredCallback(state);
    }

    potErroredCallback! : ((state : boolean) => void) | undefined;

    enablePanel(value : boolean, sliderValue : {min : number, max : number} | undefined = undefined, positionRef : DisplayObject | undefined = undefined, potCallback : ((state : boolean) => void )| undefined = undefined, raiseCallback : (() => void) | undefined = undefined)
    {


        console.log("enablePanel", value, sliderValue, positionRef);
        if(raiseCallback)
        {
            this.raiseCallback = raiseCallback;
        }

        this.visible = value;

        if(value)
            this.potErroredCallback = potCallback;
        else
            this.potErroredCallback = undefined;

       
        if(sliderValue)
        {
            if( sliderValue.min >= sliderValue.max)
            {
    
                this.minRaiseAmt = sliderValue.max;
                this.maxRaiseAmt = sliderValue.max;

                this.slider.handle.interactive = false; 
                this.slider.setHandleValue(1);
            } else
            {

                this.minRaiseAmt = sliderValue.min;
                this.maxRaiseAmt = sliderValue.max;

                this.slider.handle.interactive = true;
                this.slider.setHandleValue(0);
            }
        }

        this.minLabel.text = "\u20B9"+this.minRaiseAmt.toString();
        this.maxLabel.text = "\u20B9"+this.maxRaiseAmt.toString();
    
        
        this.enableAllAmountBtns();
        
        if(value && sliderValue != undefined)
        {
            
            this.inputValue = this.convertSliderValueToAmount(this.slider.value).toString();
            this.raiseLabel.text = "RAISE " + this.getAmount().toString(); 
            // this.input.text = this.convertSliderValueToAmount(this.slider.value).toString();
            
        }
    }


    enableAllAmountBtns()
    {
        let startAmount = this.minRaiseAmt;

        if(this.minRaiseAmt == this.maxRaiseAmt)
        {
            for(let i = 0; i < 3; i++)
            {
                const btn = this.amountBtnsContainer.getChildAt(i) as Button;
                btn.buttonLabel.text = this.minRaiseAmt.toString();
                const width = btn.buttonLabel.width + 120;
                console.log("width", width);
                console.log("btn.width", btn.width);
                let ratio = width / btn.width;


                btn.interactive = true;
                
                if(i == 0)
                {
                    this.activeButtonsEffect(btn);
                }

                if(width > btn.width)
                {
                    btn.buttonLabel.style.fontSize = 18 / ratio;
                }
            }
            return;
        }

        //divide by 4 because we have 4 buttons to 2 decimal places
        let amtPerBtn = (this.maxRaiseAmt - this.minRaiseAmt) / 4

        amtPerBtn = Math.trunc(amtPerBtn * 100) / 100;

        for(let i = 0; i < 3; i++)
        {
            
            const btn = this.amountBtnsContainer.getChildAt(i) as Button;
            btn.interactive = true;

            startAmount = this.convertChangeAmt(startAmount);

            btn.buttonLabel.text = startAmount.toString();

            const width = btn.buttonLabel.width + 120;
            console.log("width", width);
            console.log("btn.width", btn.width);
            let ratio = width / btn.width;

            if(i == 0)
            {
                this.activeButtonsEffect(btn);
            }

            if(width > btn.width)
            {
                btn.buttonLabel.style.fontSize = 18 / ratio;
            }

            startAmount += amtPerBtn;

        }



    }


    getAmount() : number
    {
        return  Math.trunc(parseFloat(this.inputValue) * 100) / 100; 
    }

    convertSliderValueToAmount(value : number) : number
    {
        let amt = value * (this.maxRaiseAmt - this.minRaiseAmt) + this.minRaiseAmt;
        // amt = Math.trunc(amt * 10) / 10;
        return amt;
    }

    updateSliderValue()
    {
        if(this.maxRaiseAmt == this.minRaiseAmt)
        {
            this.slider.setHandleValue(1);
            this.onSliderValueChanged(this.slider.value);
            return;
        } 

        const difference  = this.maxRaiseAmt - this.minRaiseAmt;
        let currentValue = parseFloat(this.inputValue) - this.minRaiseAmt;
        

        let ratio = currentValue/difference;

        ratio = clamp(ratio, 0, 1);
        this.slider.setHandleValue(ratio );
        
        this.onSliderValueChanged(this.slider.value);
    }

    onSliderValueChanged(value : number)
    {
        console.log("onSliderValueChanged: " + value);
        
        let amount = this.convertSliderValueToAmount(value);

        let changedAmount = this.convertChangeAmt(amount);

        this.inputValue  = changedAmount.toString();
        this.raiseLabel.text = "RAISE " + this.getAmount().toString();
        this.slider.updateSliderLabel(this.getAmount().toString());

        if(changedAmount != amount)
        {
            this.slider.setHandleValue((changedAmount - this.minRaiseAmt) / (this.maxRaiseAmt - this.minRaiseAmt));
        }
    }

    convertChangeAmt(amount : number) : number
    {
        
        console.log("convertChangeAmt", amount);
        const mod = amount % CurrentGameData.pointVal;
        const ratio = mod / CurrentGameData.pointVal;
        
        if(ratio <= 0.5)
        {
            amount -= mod;
        } else
        {
            amount += (CurrentGameData.pointVal - mod);
        }
        
        let changedAmount = Math.trunc(amount * 100) / 100;

        console.log("convertChangeAmt", amount, changedAmount);
        console.log("convertChangeAmt", this.minRaiseAmt, this.maxRaiseAmt);
        if(changedAmount < this.minRaiseAmt)
        {
            changedAmount = this.minRaiseAmt;
        } else if(changedAmount > this.maxRaiseAmt)
        {
            changedAmount = this.maxRaiseAmt;
        }

        return changedAmount;
    }
}