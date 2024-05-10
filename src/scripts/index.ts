import { App } from "./App";
import { Globals} from "./Globals";
const MAIN = require("./main");


MAIN.setupUpdateFromNative();


// UpdateCONFIG();

Globals.App = new App();


//Example Request
//updateFromNative("{\"token\":{\"playerID\":\"226308\",\"tableTypeID\":\"23\"},\"username\":\"Player1\",\"entryFee\":\"200.00\",\"useravatar\":\"https://cccdn.b-cdn.net/1584464368856.png\"}");
