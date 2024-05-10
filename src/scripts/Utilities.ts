import { Globals } from "./Globals";
import * as PIXI from 'pixi.js';
import { SUIT } from "./DataTypes";
import { DisplayObject } from "pixi.js";


export const getMousePosition = () => Globals.App!.app.renderer.plugins.interaction.mouse.global;

export const utf8_to_b64 = (str : string) => window.btoa(encodeURIComponent(str));



export const clamp = (num : number, min : number, max : number) => Math.min(Math.max(num, min), max);

export const ConvertToCard = (cardId: string) : string => 
{
    let cardName = "";
    let suit = parseInt(cardId.split("-")[1]);
    cardName = cardId.substring(0, cardId.length-1) + SUIT[suit];
    return cardName;
};

export const fetchGlobalPosition = (component : DisplayObject) => {
    let point = new PIXI.Point();
    
    component.getGlobalPosition(point, false);
    return point;
};


export function onlyNumbers(str : string) {
    return /^[0-9.]+$/.test(str);
}

export function NumberToStringWithCommas(num : number) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

//to title case

export function toTitleCase(str : string) {
    return str.replace( /\w\S*/g, function(txt : string){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


// globalThis.logThis = (message, color = null) => {

//     const Style = {
//         base: [
//           "color: #fff",
//           "background-color: #444",
//           "padding: 2px 4px",
//           "border-radius: 2px"
//         ],
//         red: [
//           "color: #eee",
//           "background-color: red"
//         ],
//         green: [
//           "background-color: green"
//         ],
//         blue: [
//             "background-color: #0091F7"
//           ]
//       }



//     let extra = [];

//     if(color != null)
//     {
//         extra = Style[color];
//     }
    
//     let style = Style.base.join(';') + ';';
    
//     style += extra.join(';'); // Add any additional styles
    
//     console.log(`%c${message}`, style);
// };








