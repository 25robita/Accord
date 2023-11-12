import { ObjectReference } from './main.js';
import { generateUUID } from './utilities.js';

export class AccordObject {  // going to be serializable
    /** @type {string} */
    uuid;
    constructor() {
        this.uuid = generateUUID();
        ObjectReference.set(this.uuid, this);
    }

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            uuid: this.uuid
        }
    }
}