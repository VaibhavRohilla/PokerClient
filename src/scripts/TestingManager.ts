import { Container, Graphics } from "pixi.js";
import { config } from "./appConfig";
import { PlayerData, PLAYERSTATE, potType } from "./DataTypes";
import { CurrentGameData, Globals, PlayersList } from "./Globals";
import { SocketManager } from "./SocketManager";
import { TextLabel } from "./TextLabel";



export class TestingManager
{


    static Data : {
        pots : potType[]
    } = {
        pots : []
    };

    buttonContainer : Container;

    constructor(parentContainer : Container)
    {
        console.log("TestingManager Created!");

        this.buttonContainer = new Container();
        
        parentContainer.addChild(this.buttonContainer);
    }


    iniateButtons(noOfButtons : number)
    {
        let x = 100;
        let y = 50;    
        let connectionId = 226330;    
        for(let i = 0; i < noOfButtons; i++)
        {
            if(i != 0)
            {
                if(i % 2 == 0)
                {
                    x = 100;
                    y += 300;
                } else
                    x += config.logicalWidth * 0.6;
            }
            
                
            this.createButton(i, connectionId, x, y, 200, 200);

            connectionId++;
        }
    }

    createButton(i: number, connectionId : number, x : number, y : number, width : number, height : number)
    {
        const button = new Graphics();
        
        button.beginFill(0xDE3249);
        button.drawRect(0, 0, width, height);
        button.endFill();
        button.x = x;
        button.y = y;
        const textComponent = new TextLabel(x + width/2, y + height/2, 0.5, "Player "+i+"\n"+connectionId,24,0xffffff);

        button.interactive = true;

        button.on("pointerdown", () => {
            // Globals.soundResources.click.play();
            
            // new SocketManager(connectionId, "Player "+i, "23", "https://cccdn.b-cdn.net/1584464368856.png", "100.00");

            new SocketManager(connectionId, "Player "+i, 23, "https://cccdn.b-cdn.net/1584464368856.png",  2.00);
            
            Globals.emitter!.Call("matchmakingStart");
        }, this);

        this.buttonContainer.addChild(button);
        this.buttonContainer.addChild(textComponent);

    }

    static pushSampleData()
    {
        CurrentGameData.plID = 0;
        CurrentGameData.CardsInHand = ['K-3', 'A-2'];

        CurrentGameData.currentTurn = 0;

        const pList :  {[index:number] : PlayerData} = {
            0 : new PlayerData(0, "Player 1", "https://cccdn.b-cdn.net/1584464368856.png", "200000", 0, 0),
            1 : new PlayerData(1, "Player 2", "https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg", "45", PLAYERSTATE.FOLDED, 1),
            2 : new PlayerData(2, "Player 3", "https://cccdn.b-cdn.net/1584464368856.png", "21", PLAYERSTATE.WAITING, 2),
            4 : new PlayerData(4, "Player 5", "https://cccdn.b-cdn.net/1584464368856.png", "21", PLAYERSTATE.DISCONNECTED, 4),
            5 : new PlayerData(5, "Player 6", "https://cccdn.b-cdn.net/1584464368856.png", "21", PLAYERSTATE.LEFT, 5),
            3 : new PlayerData(3, "Player 4", "https://cccdn.b-cdn.net/1584464368856.png", "21", 0, 3),
          };


        //   for(let i=0; i < Object.keys(pList).length; i++)
        //   {
        //       PlayersList[i] = pList[i];
        //   }

          Object.keys(pList).forEach((key) => {
            let k = parseInt(key);
            PlayersList[k] = pList[k];
          });
          



    }

    static pushPotAmts()
    {
        this.Data.pots = [
            {
              "amount": 6,
              "winner": null,
              "players": [
                0,
                1,
                2
              ]
            },
            {
              "amount": 796,
              "winner": null,
              "players": [
                0,
                2
              ]
            },
            {
              "amount": 448,
              "winner": null,
              "players": [
                0
              ]
            }
          ]      


        CurrentGameData.potResult = [{"amount":6,"winners":[{"player":2,"amount":6,"cards":["1-2","12-1","10-1","9-4","8-3"],"type":"High Card"}],"isRefund":false},{"amount":796,"winners":[{"player":2,"amount":802,"cards":["1-2","12-1","10-1","9-4","8-3"],"type":"High Card"}],"isRefund":false},{"amount":448,"winners":[{"player":0,    "amount":448,"cards":[],"type":"refund"}],"isRefund":true}]
    }
}