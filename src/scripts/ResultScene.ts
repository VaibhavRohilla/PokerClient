import { Container, Graphics, InteractionEvent, Sprite, Texture } from "pixi.js";
import { config } from "./appConfig";
import { AutoFillHandle } from "./autoFillHandle";
import { Button } from "./Button";
import { Card } from "./Card";
import { ResultData } from "./DataTypes";
import { GameScene } from "./GameScene";
import { CurrentGameData, Globals, PlayersList, removePlayerFromList, ResultDataList } from "./Globals";
import { Scene } from "./Scene";
import { SceneManager } from "./SceneManager";
import { TestingManager } from "./TestingManager";
import { TextLabel } from "./TextLabel";
import { ConvertToCard, NumberToStringWithCommas, toTitleCase } from "./Utilities";
import { GetResizedTexture } from "./utility";


export class ResultScene extends Scene
{
    resultBoxes : any = {};
    resultContainer: Container;
    resultBoxContainer: Container;
    crossBtn: Button;
    isRestarted : boolean = false;

    waitingResultBox! : TextLabel;


    isTouching : boolean = false;
    touchStartY : number = 0;
    constructor()
    {
        super("background", 0x10121e);

        // TestingManager.pushSampleData();
        
        this.resultContainer = new Container();
        this.resultBoxContainer = new Container(); 
        

        const leaveButton = new Button(Globals.resources.button.texture, "LEAVE", 0xffffff, {x : 0, y : 80}, 0.55, {
            x : -2,
            y : -8
        });

        leaveButton.x = leaveButton.width/2 + 10;
        leaveButton.interactive = false;
        // leaveButton.setActive(false);
        this.mainContainer.addChild(leaveButton);


        
        const autoFillHandle = new AutoFillHandle();
        autoFillHandle.x = config.logicalWidth - 56;
        autoFillHandle.y = 80;
        this.mainContainer.addChild(autoFillHandle);
        autoFillHandle.enableHandle(CurrentGameData.autoFill);

        const walletLabel = new TextLabel(config.logicalWidth - 16, 12, 0, "\u20B9 0", 16, 0xffffff);
        walletLabel.style.fontWeight = "normal";
        walletLabel.anchor.set(1, 0);

        const walletIcon = new Sprite(Globals.resources.walletIcon.texture);
        walletIcon.anchor.set(1, 0);
        walletIcon.y = 12;
        walletIcon.scale.set(0.7);
        
        walletLabel.updateLabelText("\u20B9 " + NumberToStringWithCommas(CurrentGameData.walletBalance));
        walletIcon.x = walletLabel.x - walletLabel.width - 5;

        this.mainContainer.addChild(walletLabel);
        this.mainContainer.addChild(walletIcon);

        const graphic = new Graphics();
        graphic.beginFill(0x0b0c15, 0.8);
        // graphic.drawRoundedRect(0, 0, config.logicalWidth, config.logicalHeight, 40);
        graphic.drawRect(0, 0, config.logicalWidth, config.logicalHeight);
        graphic.endFill();

        this.mainContainer.addChild(graphic);
        
        this.mainContainer.addChild(this.resultContainer);
        this.createResultBoard();

        this.crossBtn = new Button(Globals.resources.closeBtn.texture, "", 0xffffff, {x : config.logicalWidth, y : 45});
        this.crossBtn.anchor.set(1, 0);
        this.resultContainer.addChild(this.crossBtn);
        this.crossBtn.setActive(false);
        this.crossBtn.once("pointerdown", this.closeResultBoard.bind(this));

        this.resultBoxContainer.on("touchstart", (e : InteractionEvent) => {
            e.stopPropagation();

            console.log("touchstart"); 
            if(e.data.pointerId == 0)
            {
                this.isTouching = true;

                this.touchStartY = e.data.global.y;
                // console.log("touchStartY : " + this.touchStartY);

            }
        });

        this.resultBoxContainer.on("touchend", (e : InteractionEvent) => {
            e.stopPropagation();

            console.log("touchend");
            if(this.isTouching && e.data.pointerId == 0)
            {
                this.isTouching = false;
                console.log("touchend inside");

            }
        });

        this.resultBoxContainer.on("touchendoutside", (e) => {
            e.stopPropagation();

            if(this.isTouching && e.data.pointerId == 0)
            {
                this.isTouching = false;
                // console.log("touchendoutside");
            }
        });

        this.resultBoxContainer.on("touchmove", (e) => {
            e.stopPropagation();

            console.log("touchmove");

            if(this.isTouching && e.data.pointerId == 0)
            {
                const touchY = e.data.global.y;
                // console.log("touchY : " + touchY);
                const diff =  touchY - this.touchStartY;

                this.touchStartY = touchY;

                // console.log("diff : " + diff);

                this.resultBoxContainer.y += diff * config.minScaleFactor;

                // console.log("resultBoxContainer.y : " + this.resultBoxContainer.y);

                if(this.resultBoxContainer.y > 0)
                    this.resultBoxContainer.y = 0;
                else if (this.resultBoxContainer.y < -230)
                    this.resultBoxContainer.y = -230;


                // this.resultBoxContainer.x += diff.x;

            }
        });

        this.resultBoxContainer.interactive = true;
        

    }


    update(dt: number): void {
        // throw new Error("Method not implemented.");
    }
    recievedMessage(msgType: string, data: any): void {

        if(msgType == "onWaitTimer")
        {
            if(!this.isRestarted)
            {   
                this.isRestarted = true;

                // gameData.leftList.forEach(leftId => {
                //     console.log("Clearing Left Players : " + leftId);
                //     delete gameData.players[leftId];
                // });

                this.crossBtn.setActive(true);
            }
        

            {
                if(Object.keys(PlayersList).length == 1)
                    this.waitingResultBox.text = "Waiting for Others.. " + data;
                else
                    this.waitingResultBox.text = "Game starting in.. " + data;
            }
        } else if(msgType == "onGameStart")
        {
            console.log("GAME STARTED");
            SceneManager.instance.start(new GameScene(true, true));

        } else if (msgType == "onPlayerLeftInMatchmaking")
        {
            console.log(data);

            removePlayerFromList(data.plId);
        }
    }

    closeResultBoard()
    {
        this.crossBtn.setActive(false);
        this.resultContainer.destroy();

        SceneManager.instance.start(new GameScene(true));
    }

    createResultBoard()
    {
        const BG = new Sprite(Globals.resources.resultBG.texture);
        BG.anchor.set(0.5, 1);
        BG.x = config.logicalWidth/2;
        BG.y = config.logicalHeight;
        this.resultContainer.addChild(BG);

        const mask = new Graphics();
        mask.beginFill(0x0b60bc, 1);
        mask.drawRect(-BG.width/2, -BG.height, BG.width, BG.height);
        mask.x = BG.x ;
        mask.y = BG.y;


        this.resultContainer.addChild(this.resultBoxContainer);
        this.resultContainer.addChild(mask);
        this.resultBoxContainer.mask = mask;



        const upHead = new Sprite(Globals.resources.scoreHeader.texture);
        upHead.anchor.set(0.5, 0);
        upHead.x = config.logicalWidth/2;
        upHead.y = BG.y - BG.height * 0.9;
        this.resultBoxContainer.addChild(upHead);


        this.waitingResultBox = new TextLabel(0, 0, 0.5, "",28, 0xffffff, "Roboto Condensed");
        this.waitingResultBox.x = config.logicalWidth/2;
        this.waitingResultBox.y = BG.y - BG.height + 60;
        this.resultBoxContainer.addChild(this.waitingResultBox);
       
        // waitingResultBox.style.fontWeight = "Bold";

        console.log(ResultDataList);
        //sort it like win, lost, fold

        const sortedResultDataList = ResultDataList.sort((a, b) => {
            if(a.result == "win")
                return -1;
            else if (a.result == "folded")
                return 1;
            else if (a.result == "lost")
            {
                if(b.result == "win")
                    return 1;
                else if (b.result == "folded")
                    return -1;
                else
                    return 0;
            }
            else
                return 0;
        });

        console.log(sortedResultDataList);

        for(let i = 0; i < sortedResultDataList.length; i++)
        {
            console.log(ResultDataList[i]);

            this.addResultBox(sortedResultDataList[i]);
        }

        // ResultDataList.forEach((resultData, index) => {
        //     console.log("Result Data adding : " + resultData.plID);
        //     // if(PlayersList[resultData.plID].state != 2)
        //     {
                   
        //     }
        // });

    }

    

    addResultBox(result: ResultData)
    {
        console.log(result);

        let resultSprite = "resultBox0";

        if(result.result == "win")
        {
            resultSprite = "resultBox1";
        } else if(result.result == "lost")
        {
            resultSprite = "resultBox2";
        }

        const resultBox = new Sprite(Globals.resources[resultSprite].texture);
        resultBox.anchor.set(0.5, 0);
        resultBox.x = config.logicalWidth/2;
        resultBox.y = 340 + (Object.keys(this.resultBoxes).length) * resultBox.height * 0.9;
        this.resultBoxContainer.addChild(resultBox);

        this.resultBoxes[result.plID] = resultBox;

        let nameStr = result.name;
        let splitArr = nameStr.split(" ");

        if(nameStr.length > 16)
        {
            nameStr = nameStr.substring(0, 13);
            nameStr = nameStr.trim();
            nameStr += "..."
        } else if(splitArr.length == 1 && nameStr.length >= 13)
        {
            nameStr = nameStr.substring(0, 10);
            nameStr = nameStr.trim();
            nameStr += "..."
        }

        nameStr = nameStr.trim();
        
        //Player Image
        GetResizedTexture(result.avatar).then((playerImg)=>{
            this.resizeImage(playerImg, resultBox, nameStr) 
         })
        
        const colorData : {[index : string] : number} = {
            "win" : 0xFFDA3F,
            "lost" : 0xFF557E,
            "fold" : 0xFFFFFF,
            "submiting" : 0xFFFFFF,
            "left" : 0xFFFFFF
        }

        if(result.result == "folded")
        {
            result.result = "fold";
        }

            // title case
        const resultStr = result.result.charAt(0).toUpperCase() + result.result.slice(1);



        const resultText = new TextLabel(0, 0, 0, resultStr.toUpperCase(), 36, colorData[result.result.toLowerCase()], "Nunito Sans BLACK");
        resultText.anchor.set(0.5, 0);
        resultText.x += resultBox.width/2 - resultText.width/2 - 60;
        resultText.y += resultBox.height/2 - resultText.height/2 - 20;
        resultBox.addChild(resultText);
        if(result.result == "win")
        {
            resultText.text = "WON!";
        }

        // const scoreText = new TextLabel(0, 0, 0, result.points + "",32, 0xffffff);
        // scoreText.x += 70;
        // scoreText.y += 20;
        // resultBox.addChild(scoreText);


        const amountText = new TextLabel(0, 0, 0.5,(result.amount < 0 ? "- " : "") + "\u20B9" + Math.abs(result.amount).toString(), 32, 0xffffff);
        amountText.x =  resultText.x
        amountText.y = resultText.y + resultText.height + 20; 
        resultBox.addChild(amountText);


     

        if(result.cards && result.cards.length > 0)
            this.addCards(result.cards, resultBox);

        let resultBG = "resultLabel0";

        if(result.result == "win")
        {
            resultBG = "resultLabel2";
        } else if(result.result == "lost")
        {
            resultBG = "resultLabel1";
        }



        const reasonLabel = new Sprite(Globals.resources[resultBG].texture);
        reasonLabel.anchor.set(0.5);
        reasonLabel.x = 0;
        reasonLabel.y = resultBox.height/2 + 30;
        resultBox.addChild(reasonLabel);

        const reasonText = new TextLabel(0, 0, 0.5, toTitleCase(result.result == "fold" ? "FOLD" : result.reason), 28, 0);
        reasonText.x = reasonLabel.x;
        reasonText.y = reasonLabel.y;
        resultBox.addChild(reasonText);

    }

    resizeImage(texture:Texture, resultBox:Sprite, nameStr:string){
        const avatar = Sprite.from(texture);
        avatar.anchor.set(0.5, 0.5);
        avatar.x = -resultBox.width/2 + 100;
        avatar.y = resultBox.height/2 - 20;
        let aspectRatio = avatar.width/avatar.height;
        avatar.width = 90;
        avatar.height = avatar.width/aspectRatio;
        resultBox.addChild(avatar);

        const mask = new Graphics();
        mask.beginFill(0x000000);
        mask.drawRoundedRect(-45, -45, 90, 90, 10);
        mask.endFill();
        mask.x = avatar.x;
        mask.y = avatar.y;
        resultBox.addChild(mask);
        avatar.mask = mask;

        const name = new TextLabel(0, 0, 0, nameStr, 20, 0xffffff, "Nunito Sans Black");
        name.x = -resultBox.width/2 + 58;
        name.y = mask.y + mask.height/2 + 5;
        name.style.wordWrap = true;
        name.style.wordWrapWidth = 90; 
        resultBox.addChild(name);
    }

    addCards(cards: string[], resultBox: Sprite)
    {
        // if(resultBox.submitWaitText) 
        // resultBox.submitWaitText.destroy();

        let x =0// -resultBox.width/2 + 100;
        const y = 0;

        const cardsContainer = new Container();
        let cardWidth = 0;

        if(cards == null)
        {
            const emptySlot = new Sprite(Globals.resources.emptyDeck.texture);
            emptySlot.x = x;
            emptySlot.y = y;

            resultBox.addChild(emptySlot);
        } else
        {


            for(let i = 0; i < cards.length; i++)
            {
                const subCard = cards[i];

                {
                    console.log(ConvertToCard(subCard));
                    const card = new Card(subCard, {x : 0, y : 0}, cardsContainer, 0.4);
                    card.visual.x = x;
                    card.visual.y = y;
                    x += (card.width * 0.8);
                    cardWidth = card.width;
                }
                

                
            }
        }
        // const compareWidth = resultBox.width - 100;

        cardsContainer.x = -cardsContainer.width/2 + cardWidth/2;
        cardsContainer.y = resultBox.height/2 - 20;


        // if(cardsContainer.width > compareWidth)
        // {
        //     cardsContainer.scale.set(compareWidth/cardsContainer.width);
        // } 
        
        // cardsContainer.x += (compareWidth - cardsContainer.width)/2;

        resultBox.addChild(cardsContainer);
    }
}