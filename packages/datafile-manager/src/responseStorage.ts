import { AsyncStorage } from "./storage";
import { Response } from "./http";

export interface ResponseStorage extends AsyncStorage<Response>{
}
