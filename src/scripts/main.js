import { Globals } from "./Globals";
import { SocketManager } from "./SocketManager";



export function gameStartAlert() {
    try {
        if (JSBridge != undefined) {

            JSBridge.showMessageInNative("loadSuccess");
        }
    } catch {
        console.log("JS Bridge Not Found!");
    }
}

export function leaveGameAlert()
{
    try {
        if (JSBridge != undefined) {

            JSBridge.sendMessageToNative(JSON.stringify({"t" :"Exit"}));
        }
    } catch {
        console.log("JS Bridge Not Found!");
    }
}

export function setupUpdateFromNative()
{
    global.updateFromNative = function updateFromNative(message)
    {
        const jsonData = JSON.parse(message);


        if(SocketManager.instance == undefined)
        {
            new SocketManager(parseInt(jsonData.token.playerID), jsonData.username, parseInt(jsonData.token.tableTypeID), jsonData.useravatar, parseFloat(jsonData.entryFee));
            Globals.emitter.Call("matchmakingStart");

        }

    }
}


export function openProfile(id)
{
    console.log("CLICKED PROFILE :"  + id);
    try {
        if (JSBridge != undefined) {
            JSBridge.sendMessageToNative(JSON.stringify({"t" :"pClicked", "data":id}));
        }
    } catch {
        console.log("JS Bridge Not Found!");
    }
}



