import { Container, DisplayObject, Graphics, Sprite, Texture } from "pixi.js";
import * as TWEEN from "@tweenjs/tween.js";
import { CurrentGameData, GameConfig, Globals, PlayersList } from "./Globals";
import { config } from "./appConfig";
import { TextLabel } from "./TextLabel";
import { AvatarStates, PLAYERSTATE } from "./DataTypes";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { fetchGlobalPosition, NumberToStringWithCommas } from "./Utilities";
import { BidStatus } from "./BidStatus";
import { GetResizedTexture } from "./utility";


const MAIN = require('./main');

export class Player
{
    

    container : Container;
    avatarContainer: Container;

    avatarBg! : Graphics;
    balanceText! : TextLabel;

    playerDeactiveMask! : Graphics;
    roundingContainer! : Container;


    lastStateVisual : Sprite | undefined = undefined;

    currentState! : PLAYERSTATE;

    lastValues : {ratio : number};

    timer : {main : TextLabel | null, secondary : TextLabel | null} = {main : null, secondary : null};
    
    RenderTimer!: (value : boolean) => void;
    UpdateBox!: (percentage: any, boolVal: any) => void;

    onPlayerDeleted : (pl : number) => void;

    // chip : Chip | null = null;

    cardsVisual : Card[] = [];
    statusLabel!: TextLabel;
    dealerIcon: Sprite;

    status : BidStatus | undefined;


    constructor(public plId : number, public name : string, public bal : string, position : {x : number, y : number} | undefined, public isSelf : boolean, parentContainer : Container, callBackPlayerDeleted : (pl : number) => void)
    {
        this.container = new Container();


        this.avatarContainer = new Container();
        this.avatarContainer.sortableChildren = true;
        this.container.addChild(this.avatarContainer);


        this.addPlayerAvatar(position);
        this.addTimer();
        
        if(position)
            this.addOtherBalance(this.bal); 
        else
            this.addOwnBalance(this.bal);
        
        const ratio = 0.9;

        this.createRounding(
            this.avatarBg.x - this.avatarBg.width/2 + this.avatarBg.width * (1 -ratio)/2,
            this.avatarBg.y - this.avatarBg.height/2 + this.avatarBg.height * (1 - ratio)/2,
            5,
            this.avatarBg.width*ratio,
            this.avatarBg.height*ratio, 10
        );

        this.dealerIcon = new Sprite(Globals.resources.dealerIcon.texture);
        this.dealerIcon.zIndex = 5;
        this.dealerIcon.anchor.set(0.5);
        this.dealerIcon.x = this.avatarBg.width/2 - 2;
        this.dealerIcon.y -= this.avatarBg.height/2 - 10;
        this.avatarContainer.addChild(this.dealerIcon);
        this.dealerIcon.renderable = false;
        this.lastValues = {
            ratio : 1
        };


        this.turnActivate(false);

        parentContainer.addChild(this.container);

        this.onPlayerDeleted = callBackPlayerDeleted;


        PlayersList[this.plId].playerAvatarRef = this;

        this.container.on("destroyed", () => {
            if(PlayersList[this.plId])
            {
                PlayersList[this.plId].playerAvatarRef = undefined;
            }
        })
        

        this.changeState(PlayersList[this.plId].state);

      
    }

    resetTimer()
    {
        this.UpdateBox(1, false);
    }

    setActiveDealer(value : boolean)
    {
        this.dealerIcon.renderable = value;
    }

    updateTimer()
    {
        const extraTime = PlayersList[this.plId].extraTime;
        this.timer.main?.updateLabelText(CurrentGameData.timer.toString());
        this.timer.secondary?.updateLabelText(extraTime.toString());

        if(CurrentGameData.timer == 0)
        {
            this.updateTimerVisual(1 - (extraTime/CurrentGameData.maxUnits.extraTime), (extraTime < GameConfig.maxTickTimer));
        } else
        {
            console.log(CurrentGameData.timer);
            console.log(CurrentGameData.maxUnits.timer);
            this.updateTimerVisual(1 - (CurrentGameData.timer/CurrentGameData.maxUnits.timer), ((CurrentGameData.timer  < GameConfig.maxTickTimer)));
        }
    }



    updateTimerVisual(percentage : number, boolValue : boolean)
    {
        // console.log(percentage);
        const tween = new TWEEN.Tween(this.lastValues)
        .to({ratio : percentage}, 999)
        .onUpdate(
            (value) => {
                if(this.roundingContainer.renderable)
                    this.UpdateBox(value.ratio, boolValue);
            }
        )
        .onComplete((value) => {
            this.lastValues.ratio = value.ratio;
        })
        .start();

        if(boolValue && this.plId == CurrentGameData.plID)
        {
            // Globals.soundResources.tick.play();
            //TODO : SOUND HERE

            try
            {
                navigator.vibrate(300);
            }
            catch
            {
                console.log("Navigator blocked by device.");
            }
        }

    }


    addPlayerAvatar(avatarPos : {x : number, y : number} | undefined)
    {

        let width = 100;
        if(avatarPos != undefined)
        {
            this.avatarContainer.x = avatarPos.x;
            this.avatarContainer.y = avatarPos.y;
            this.avatarContainer.scale.set(0.7);
            width = 120;
        } else
        {
            this.avatarContainer.y = config.logicalHeight - 280;
            this.avatarContainer.x = config.logicalWidth/2;
            this.avatarContainer.scale.set(0.8);
        }


        //Adding Background
        this.avatarBg = new Graphics();
        this.avatarBg.beginFill(0x000000, 1);
        this.avatarBg.drawRoundedRect(-width/2, -width/2, width, width, 10);
        this.avatarBg.endFill();
        this.avatarBg.zIndex = 1;

        this.avatarBg.interactive = true;
        this.avatarBg.on("pointerdown", () => {
            //TODO : Profile Click here
            MAIN.openProfile(PlayersList[this.plId].defaultId); 
        });

        //Avatar Image

        const data = PlayersList[this.plId];
        GetResizedTexture(data!.avatarURL).then((playerImg)=>{
            this.resizeImage(playerImg, width) 
         })
        

        this.avatarContainer.addChild(this.avatarBg);
 

        this.playerDeactiveMask = new Graphics();
        this.playerDeactiveMask.beginFill(0x000000, 0.5);
        this.playerDeactiveMask.drawRoundedRect(-width/2, -width/2, width, width, 10);
        this.playerDeactiveMask.endFill();
        this.playerDeactiveMask.zIndex = 2;



        this.avatarContainer.addChild(this.playerDeactiveMask);

        // thisk.avatarBackground.addChild(this.playerDeactiveMask);
        


        this.addName(this.name);

      
    }

    resizeImage(texture:Texture, width:number){
        const avatar = Sprite.from(texture);
        avatar.anchor.set(0.5);


        const avatarAspect = avatar.height/avatar.width;

        avatar.width = width;
        avatar.height = width*avatarAspect;
        avatar.zIndex = 2;

        const mask = new Graphics();
        mask.beginFill(0x000000, 1);
        mask.drawRoundedRect(-width/2, -width/2, width, width, 10);
        mask.endFill();
        mask.zIndex = 3;
        
        avatar.mask = mask;
        this.avatarContainer.addChild(avatar);
        this.avatarContainer.addChild(mask);
    }

    updateStatus(str : string, color : number = 0xffffff)
    {
        if(this.statusLabel)
            this.statusLabel.updateLabelText(str.toUpperCase(), color);
    }

    init()
    {
        if(CurrentGameData.isDropped) 
            return;

        this.RenderTimer(true);
        
    }

    resetChips()
    {
        this.status?.destroy();
        this.status = undefined;
        // this.chip?.destroy();
        // this.chip = null;
    }

    isChipFolded : boolean = false;

    chipsTween(amount : number)
    {

        console.log(`Chips tweening : ${amount} && Player ID : ${this.plId}`);
        // if(this.chip != null)
        // {
        //     this.chip.destroy();
        //     this.chip = null;
        //     // return;
        // }

        if(this.status != undefined)
        {
            this.removeChip();
        }
        
        if(amount == -1)
        {
            this.status = new BidStatus("Folded", "down", "secondary");
            this.isChipFolded = true;
        }
        else
            this.status = new BidStatus(NumberToStringWithCommas(amount), "right", "primary");
        this.status.x = this.avatarBg.x;

        if(this.isSelf)
            this.status.y = this.avatarBg.y + this.avatarBg.height/2 + 40;
        else        
            this.status.y = this.avatarBg.y + this.avatarBg.height/2 + 70;

        

        this.avatarContainer.addChild(this.status);

        // let pos = {x : this.balanceText.x, y : this.balanceText.y};

        // pos.x *= this.avatarContainer.scale.x;
        // pos.y *= this.avatarContainer.scale.y;

        // pos.x += this.avatarContainer.x ;
        // pos.y += this.avatarContainer.y;

        // this.chip = new Chip(Globals.resources.playerChip.texture, amount, this.container.parent, PlayersList[this.plId], pos);   
    }

        
    removeChip()
    {
        // if(this.chip)
        // {
        //     this.chip.tweenToPot(potPosition);
        // }

        if(this.isChipFolded)
            this.isChipFolded = false;

        this.status?.destroy();
        this.status = undefined;
        // this.chip = null;
    }


    changeState(state : PLAYERSTATE)
    {

        console.log("Player State Changed : " + state);

        if(this.currentState == state)
            return;

        if(this.lastStateVisual)
        {
            this.lastStateVisual.destroy();
            this.lastStateVisual = undefined;
        }

        this.currentState = state;
        
        console.log(`Name : ${this.name} && State : ${this.currentState}`);

        if(this.isChipFolded)
        {
            this.removeChip();
        }

        if(this.currentState == PLAYERSTATE.INGAME)
            this.playerDeactiveMask.renderable = false; 
        else
            this.playerDeactiveMask.renderable = true;
        


        switch(state)
        {
            case PLAYERSTATE.FOLDED:
                this.lastStateVisual = new Sprite(Globals.resources.playerFolded.texture);
                this.lastStateVisual.anchor.set(0.5);
                this.lastStateVisual.zIndex = 4;

                this.chipsTween(-1);

                this.avatarContainer.addChild(this.lastStateVisual);


                this.timer.main?.updateLabelText("--");
                this.timer.secondary?.updateLabelText("--");
                console.log(this.lastStateVisual);
                break;
            case PLAYERSTATE.DISCONNECTED:
                this.lastStateVisual = new Sprite(Globals.resources.playerDisconnect.texture);
                this.lastStateVisual.anchor.set(0.5);
                this.lastStateVisual.zIndex = 4;

                this.avatarContainer.addChild(this.lastStateVisual);
                break;
            case PLAYERSTATE.LEFT:
                this.lastStateVisual = new Sprite(Globals.resources.playerLeft.texture);
                this.lastStateVisual.anchor.set(0.5);
                this.lastStateVisual.zIndex = 4;

                this.avatarContainer.addChild(this.lastStateVisual);
                break;
            case PLAYERSTATE.WAITING:
                this.lastStateVisual = new Sprite(Globals.resources.playerWaiting.texture);
                this.lastStateVisual.anchor.set(0.5);
                this.lastStateVisual.zIndex = 4;

                this.avatarContainer.addChild(this.lastStateVisual);
                break;
            // case AvatarStates.DECLARED:
            //     this.lastStateVisual = new Sprite(Globals.resources.playerDeclared.texture);
            //     this.lastStateVisual.anchor.set(0.5);
            //     this.avatarContainer.addChild(this.lastStateVisual);
            //     break; 
        }


        
    }

    turnActivate(value : boolean)
    {
        this.roundingContainer.renderable = value;

        

        if(!value)
        {
            this.lastValues.ratio = 1;
            this.timer.main?.updateLabelText("00");
        }

        this.resetTimer();
    }

    addTimer()
    {

        const mainTimer = new Sprite(Globals.resources.playerTimerBg.texture);
        const secondaryTimer = new Sprite(Globals.resources.playerSecTimerBg.texture);
        
        this.timer.main = new TextLabel(0, 0, 0.5, "00", 16, 0xFFFFFF);
        this.timer.secondary = new TextLabel(0, 0, 0.5, "00", 16, 0xFFFFFF);


        if(PlayersList[this.plId] && PlayersList[this.plId].extraTime > -1)
        {
            this.timer.secondary.updateLabelText(PlayersList[this.plId].extraTime.toString());
        } else
        {
            this.timer.secondary.updateLabelText(CurrentGameData.maxUnits.extraTime.toString());
        }

        if(this.isSelf)
        {
            mainTimer.anchor.set(0.2, 0.5);
            mainTimer.x = this.avatarBg.width/2;
            mainTimer.y -= 25;

            secondaryTimer.anchor.set(0.15, 0.5);
            secondaryTimer.x = this.avatarBg.width/2;
            secondaryTimer.y += 10;

            this.timer.main.x += mainTimer.width * 0.3;
            this.timer.secondary.x += secondaryTimer.width * 0.35;
        } else
        {
            mainTimer.anchor.set(0.5);
            mainTimer.x += -this.avatarBg.width/2 - mainTimer.width * 0.35;
            mainTimer.y -= 25

            secondaryTimer.anchor.set(0.5);
            secondaryTimer.x += -this.avatarBg.width/2 - secondaryTimer.width * 0.35;
            secondaryTimer.y += 10;
        }


        this.avatarContainer.addChild(mainTimer);
        this.avatarContainer.addChild(secondaryTimer);

        mainTimer.addChild(this.timer.main);
        secondaryTimer.addChild(this.timer.secondary);





        this.RenderTimer = ((value : boolean) => {
            mainTimer.renderable = value;
            secondaryTimer.renderable = value;
        });

        this.RenderTimer(false);
        
    }



    addOtherBalance(bal : string)
    {
        if(bal == null)
        bal = "0000";

        const circle = new Sprite(Globals.resources.playerChip.texture);
        circle.anchor.set(0.5);
        circle.scale.set(0.6);
        circle.x = -this.avatarBg.width/2;
        circle.y = this.avatarBg.height/2 + 25;


        this.balanceText = new TextLabel(circle.x + 20, circle.y - 3 , 0.5, "₹ "+NumberToStringWithCommas(parseFloat(bal)), 18, 0xffffff);
        this.balanceText.anchor.set(0, 0.5);

        const combinedWidth = circle.width + this.balanceText.width + 20;

        circle.x = -combinedWidth/2 + circle.width/2;
        this.balanceText.x = circle.x +  20;

        this.avatarContainer.addChild(this.balanceText);
        this.avatarContainer.addChild(circle); 
    }

    addOwnBalance(bal : string)
    {
        // if(gameData.plId != this.plId)
        //     return;


        // scoreBg.x = this.avatarContainer.x;
        if(bal == null)
            bal = "0000";

        const circle = new Sprite(Globals.resources.playerChip.texture);
        circle.anchor.set(0.5);
        circle.x = -350;
        circle.y = 0;


        this.balanceText = new TextLabel(circle.x + 30, circle.y - 6 , 0.5, NumberToStringWithCommas(parseFloat(bal)), 32, 0xffffff);
        this.balanceText.anchor.set(0, 0.5);


        this.avatarContainer.addChild(this.balanceText);
        this.avatarContainer.addChild(circle);
    }

    updateBalance(bal:string | undefined = undefined)
    {
        // if(gameData.plId == this.plId)
        //rupee sign = /u20B9
        if(bal)
            this.balanceText.text = '\u20B9' + NumberToStringWithCommas(parseFloat(bal));
        else
            this.balanceText.text ='\u20B9' + NumberToStringWithCommas(parseFloat(PlayersList[this.plId].balance)) ;
    }

    addName(name : string, )
    {
        if(name.length > 12)
        {
            name = name.substring(0, 10)
            name += "..."
        }
        const nameText = new TextLabel(this.avatarBg.x, this.avatarBg.y - this.avatarBg.height/2 - 10, 0.5 , name, 24, 0xffffff);
        nameText.anchor.set(0.5, 1);

        if(this.isSelf)
        {
            nameText.x = -220;
            nameText.y = -30;

            nameText.anchor.set(1, 1);
        }

        this.avatarContainer.addChild(nameText);
    }


    assignCards(container : Container)
    {

        const cardContainer = new Container();



        let position = {x : config.logicalWidth/2 - 52, y : config.logicalHeight-  435};
        let angle = -5;
        if(this.isSelf)
        {
            for(let i = 0; i < 2; i++)
            {
                let card = new Card(CurrentGameData.CardsInHand[i], position, cardContainer, 0.9);

                if(i == 0)
                {
                    card.background.tint = 0xFFFAF3;
                }

                card.visual.angle = angle;
                this.cardsVisual.push(card);
                position.x += 104 + 8
                angle *= -1;
            } 
            cardContainer.x = 0;
            cardContainer.y = 0;

            cardContainer.zIndex = 5;
            container.addChild(cardContainer);

            Globals.soundResources.cardFan.play();

        } else
        {
            let cardPairs = new Sprite(Globals.resources.cardPairs.texture);
            cardPairs.anchor.set(0.5);
            cardContainer.addChild(cardPairs); 

            cardContainer.x = this.avatarBg.width/3;
            cardContainer.y = this.avatarBg.height/3;
            cardContainer.zIndex = 3;


            this.avatarContainer.addChild(cardContainer);
        }       

    }

    removeCards()
    {
        this.cardsVisual.forEach(card => {
            card.remove();
        });

        this.cardsVisual = [];
    }


    createRounding(x : number, y : number, lineSize : number, width : number, height : number, arcRadius: number)
    {
        this.roundingContainer = new Container();
        this.roundingContainer.x = x;
        this.roundingContainer.y = y;
        this.roundingContainer.zIndex = 3;
        this.avatarContainer.addChild(this.roundingContainer);

        const edge1 = new Graphics();
        edge1.lineStyle(lineSize, 0x61cc5f, 1);
        edge1.drawRoundedRect(0, 0, width, height, arcRadius);
        edge1.endFill();

        const edge2 = new Graphics();
        edge2.lineStyle(lineSize, 0xfb6163, 1);
        edge2.drawRoundedRect(0, 0, width, height, arcRadius);
        edge2.endFill();
        
    
        // Mask in this example works basically the same way as in example 1. Except it is reversed and calculates the mask in straight lines in edges.
        const mask = new Graphics();
        mask.position.set(width / 2, height / 2);
        edge1.mask = mask;
        edge2.mask = mask;

        this.roundingContainer.addChild(edge1);
        this.roundingContainer.addChild(edge2);
        this.roundingContainer.addChild(mask);

        edge2.renderable = false;

        console.log(this.roundingContainer);
    
        this.UpdateBox = (percentage, boolVal) => {

            // console.log(percentage);
            edge1.renderable = !boolVal;
            edge2.renderable = boolVal;



            const phase = percentage * (Math.PI * 2);
            // Calculate target point.
            const x = Math.cos(phase - Math.PI / 2) * width;
            const y = Math.sin(phase - Math.PI / 2) * height;
            // Line segments
            const segments = [
                [-width / 2 + lineSize, -height / 2 + lineSize, width / 2 - lineSize, -height / 2 + lineSize], // top segment
                [width / 2 - lineSize, -height / 2 + lineSize, width / 2 - lineSize, height / 2 - lineSize], // right
                [-width / 2 + lineSize, height / 2 - lineSize, width / 2 - lineSize, height / 2 - lineSize], // bottom
                [-width / 2 + lineSize, -height / 2 + lineSize, -width / 2 + lineSize, height / 2 - lineSize], // left
            ];
            // To which dir should mask continue at each segment
            let outDir : any = [
                [0, -1],
                [1, 0],
                [0, 1],
                [-1, 0],
            ];
    
            // Find the intersecting segment.
            let intersection = null;
            let winding = 0;
            // What direction should the line continue after hit has been found before hitting the line size
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                const hit = this.intersect(0, 0, x, y, segment[0], segment[1], segment[2], segment[3]);
                if (hit) {
                    intersection = hit;
                    if (i === 0) winding = hit.x < 0 ? 0 : 4;
                    else winding = 4 - i;
                    outDir = outDir[i];
                    break;
                }
            }
    
            const corners = [
                -width / 2 - lineSize, -height / 2 - lineSize, // Top left,
                -width / 2 - lineSize, height / 2 + lineSize, // Bottom left
                width / 2 + lineSize, height / 2 + lineSize, // Bottom right
                width / 2 + lineSize, -height / 2 - lineSize, // Top right
            ];
    
            // Redraw mask
            mask.clear();
            mask.lineStyle(2,  0xfb6163, 1);
            mask.beginFill(0xff0000, 1);
    
            mask.moveTo(0, 0);
            mask.moveTo(0, -height / 2 - lineSize);
    
            // fill the corners
            for (let i = 0; i < winding; i++) {
                mask.lineTo(corners[i * 2], corners[i * 2 + 1]);
            }
    
            mask.lineTo(intersection!.x + outDir[0] * lineSize * 2, intersection!.y + outDir[1] * lineSize * 2);
            mask.lineTo(intersection!.x, intersection!.y);
            mask.lineTo(0, 0);
    
            mask.endFill();
        };

    }



    intersect(x1 : number, y1 : number, x2 : number, y2 : number, x3 : number, y3 : number, x4 : number, y4 : number) {
        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false;
        }
    
        const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    
        // Lines are parallel
        if (denominator === 0) {
            return false;
        }
    
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
    
        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false;
        }
    
        // Return a object with the x and y coordinates of the intersection
        const x = x1 + ua * (x2 - x1);
        const y = y1 + ua * (y2 - y1);
    
        return { x, y };
    }

    disable(isLeft : boolean)
    {
        this.timer.main!.text = "--";
        this.timer.secondary!.text = "--";


        console.log("Left is " + isLeft)

        // this.resetChips();     

        if(isLeft)
            this.changeState(PLAYERSTATE.DISCONNECTED);
        else
            this.changeState(PLAYERSTATE.FOLDED);
    }

    highlightEntities : DisplayObject[] = [];

    highlightWinner(cards: string[], winLabel : string)
    {
        const cardContainer = new Container();

        if(this.isSelf)
        {

            if(this.cardsVisual.length ==  0)
            {
                return;
            }
            
            for(let i = 0; i < cards.length; i++)
            {
                const card = this.cardsVisual.find(c => c.cardID == cards[i]);

                if(card)
                {
                    card.highlight();
                }
            }


            const graphic = new Graphics();
            graphic.beginFill(0xFFDA3F, 1);
            graphic.drawRoundedRect(-112, 0, 224, 56, 10);
            graphic.x = config.logicalWidth/2;
            graphic.y = config.logicalHeight - 375;
            graphic.endFill();
    
            const label = new TextLabel(0, 0, 0.5, winLabel, 28, 0x0B0C0D, "Nunito Sans Black");
            label.y += 28;
            graphic.addChild(label);
            
            
            this.cardsVisual[0].visual.parent!.addChild(graphic);
            this.highlightEntities.push(graphic);

            const crown = new Sprite(Globals.resources["crown"].texture);
            crown.anchor.set(0.5);
            crown.x = this.cardsVisual[1].visual.width/2;
            crown.y = -this.cardsVisual[1].visual.height/2 + 10;
            crown.zIndex = 4;
            crown.angle = 40;
            this.cardsVisual[1].visual.addChild(crown);
            this.highlightEntities.push(crown);
            
            return;
        }

    
        console.log("Highlighting winner");
        console.log(cards);

        let position = {
            x: -52,
            y: 0
        };

        let angle = -5;

        for(let i = 0; i < cards.length; i++)
        {
            let card = new Card(cards[i], position, cardContainer, 0.8);
            console.log(card.width) 
            card.highlight();
            card.visual.angle= angle;

            position.x += 104
            angle *= -1;
        }

        const graphic = new Graphics();
        graphic.beginFill(0xFFDA3F, 1);
        graphic.drawRoundedRect(-112, 0, 224, 56, 10);
        graphic.y += 48;
        graphic.endFill();

        const label = new TextLabel(0, 0, 0.5, winLabel,28, 0x0B0C0D, "Nunito Sans Black");
        label.y += 28;
        graphic.addChild(label);

        cardContainer.addChild(graphic);

        cardContainer.x = 0;
        cardContainer.y = 12;
        cardContainer.zIndex = 3;

        this.avatarContainer.addChild(cardContainer);
        this.highlightEntities.push(cardContainer);

        const crown = new Sprite(Globals.resources["crown"].texture);
        crown.anchor.set(0.5);
        crown.x = +16;
        crown.y = -138;
        crown.zIndex = 4;
        this.avatarContainer.addChild(crown);
        this.highlightEntities.push(crown);
    }

    removeHighlight()
    {
        if(this.isSelf)
        {
            this.cardsVisual.forEach((card) => {
                card.unhighlight();
            });

        }

        for(let i = 0; i < this.highlightEntities.length; i++)
        {
            this.highlightEntities[i].destroy();
        }

        this.highlightEntities = [];
    }

    delete()
    {
        // this.chip?.destroy();
        this.status?.destroy();
        this.status = undefined;
        this.container.destroy();
        console.log("Destroyed");

        
        this.onPlayerDeleted(this.plId);
    }
}