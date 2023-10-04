import { generateUUID } from './utilities';
export class AccordObject {  // going to be serializable
    /** @type {string} */
    uuid;
    constructor() {
        this.uuid = generateUUID();
        ObjectReference.set(this.uuid, this);
    }
}