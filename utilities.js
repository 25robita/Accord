
/** @typedef {[number, number]} Vec2Array Represents a two-dimensional vector*/

/** @typedef {Vec2Array | Vector2} Vec2Arg Represents a point on the plane of the game */

/** @typedef {Vec2Array} Point Represents a point on the plane of the game */


/**
 * Can be used in insecure contexts, unlike crypto.randomUUID()
 * @returns {string} UUID
 */
export function generateUUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export class TimeManager {
    /** @type {Date} */
    #frame = new Date();

    /** @type {Date} */
    #lastFrame = new Date();

    /** @type {Number} */
    get deltaTime() {
        return Number(this.#frame - this.#lastFrame) / 1000
    }

    lap() {
        this.#lastFrame = this.#frame;
        this.#frame = new Date();
    }
}

export class InputManager {
    /** @type {Set<string>} */
    #keys = new Set();
    /** @type {Set<string>} */
    #activeKeys = new Set();
    /** @type {Set<string>} */
    #keysDown = new Set();
    /** @type {Set<string>} */
    #keysUp = new Set();

    /** @type {number[]} */
    #mouseButtons = [];
    /** @type {number[]} */
    #activeMouseButtons = [];
    /** @type {number[]} */
    #mouseButtonsUp = [];
    /** @type {number[]} */
    #mouseButtonsDown = [];

    constructor() {
        addEventListener("keydown", this.#handleKeyDown.bind(this));
        addEventListener("keyup", this.#handleKeyUp.bind(this));
        addEventListener("mousedown", this.#handleMouseDown.bind(this));
        addEventListener("mouseup", this.#handleMouseUp.bind(this));
    }

    /**
     * @param {KeyboardEvent} event 
     */
    #handleKeyDown(event) {
        this.#keys.add(event.key);
    }

    /**
     * @param {KeyboardEvent} event 
    */
    #handleKeyUp(event) {
        this.#keys.delete(event.key);
    }

    /**
     * @param {MouseEvent} event 
     */
    #handleMouseDown(event) {
        this.#mouseButtons[event.button] = true;
    }

    /**
     * @param {MouseEvent} event 
     */
    #handleMouseUp(event) {
        this.#mouseButtons[event.button] = false;
    }

    update() {
        this.#keysDown.clear();
        for (let k of this.#keys) {
            if (this.#activeKeys.has(k)) continue;
            this.#keysDown.add(k);
        }
        for (let k of this.#activeKeys) {
            if (this.#keys.has(k)) continue;
            this.#keysUp.add(k);
        }
        this.#activeKeys = new Set(this.#keys);

        this.#activeMouseButtons = Array.from(this.#mouseButtons);
    }

    /**
     * Returns whether or not the specified key was held down at the start of the frame
     * @param {string} name 
     * @returns {boolean}
     */
    getKey(name) {
        return this.#activeKeys.has(name);
    }

    /**
     * Returns whether or not the specified key was pressed in the last frame
     * @param {string} name 
     * @returns {boolean}
     */
    getKeyDown(name) {
        return this.#keysDown.has(name);
    }

    /**
     * Returns whether or not the specified key was released in the last frame
     * @param {string} name 
     * @returns {boolean}
     */
    getKeyDown(name) {
        return this.#keysUp.has(name);
    }

    getMouseButton(index) {

    }
    // getMouseButton
    // getMouseButtonDown
    // getMouseButtonUp
}

export class Vector2 {
    /** @type {number} */
    x = 0;
    /** @type {number} */
    y = 0;

    /**
     * 
     * @param  {...([number, number] | [[number, number]] | [])} value 
     */
    constructor(...value) {
        if (value.length == 0) {
            return;
        }
        if (value.length == 1) {
            this.x = value[0][0];
            this.y = value[0][1];
            return;
        }
        if (value.length == 2) {
            this.x = value[0];
            this.y = value[1];
            return;
        }

        throw TypeError("Invalid format for Vector2 initialisation")
    }

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "Vector2",
            value: [this.x, this.y]
        };
    }

    static Zero = new Vector2();
    static One = new Vector2(1, 1);

    /** @type {number} */
    get 0() {
        return this.x;
    }

    set 0(value) {
        this.x = value;
    }

    /** @type {number} */
    get 1() {
        return this.y;
    }

    set 1(value) {
        this.y = value;
    }

    toString() {
        return `(${this.x}, ${this.y})`
    }

    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }

    /**
     * Checks equality between two Vector2
     * @param {Vec2Arg} a 
     * @param {Vec2Arg} b 
     * @returns {boolean}
     */
    static equals(a, b) {
        return a[0] == b[0] && a[1] == b[1];
    }

    /**
     * Checks equality between two Vector2. Alias for Vector2.eq
     * @param {Vec2Arg} a 
     * @param {Vec2Arg} b 
     * @returns {boolean}
     */
    static eq = Vector2.equals;

    /**
     * Checks equality between this and another Vector2
     * @param {Vec2Arg} other
     * @returns {boolean}
     */
    equals(other) {
        return Vector2.equals(this, other);
    }

    /**
     * Checks equality between this and another Vector2. Alias for Vector2.prototype.equals
     * @param {Vec2Arg} other
     * @returns {boolean}
     */
    eq = this.equals;

    /**
     * @param {Vec2Arg} a 
     * @param {Vec2Arg} b 
     * @returns {number}
     */
    static distance(a, b) {
        return Math.sqrt(
            (a[0] - b[0]) ** 2 +
            (a[1] - b[1]) ** 2
        );
    }

    /**
     * @param {Vec2Arg} other 
     * @returns {number}
     */
    distanceTo(other) {
        return Vector2.distance(this, other);
    }

    /**
     * 
     * @param {Vec2Arg} a 
     * @returns {Vector2}
     */
    static normalised(a) {
        return Vector2.quotient(a, Math.sqrt(a[0] ** 2 + a[1] ** 2));
    }

    /**
     * Normalises this vector in place
     */
    normalise() {
        this.divide(this.magnitude());
    }

    /**
     * Returns a normalised vector of this
     * @returns {Vector2}
     */
    normalised() {
        return Vector2.normalised(this);
    }

    /**
     * @param {Vec2Arg} a 
     * @returns {number}
     */
    static magnitude(a) {
        return Math.sqrt(a[0] ** 2 + a[1] ** 2);
    }

    /**
     * @returns {number}
     */
    magnitude() {
        return Vector2.magnitude(this);
    }

    /**
     * Gives the normal vector to `a`
     * @param {Vec2Arg} a 
     * @returns {Vector2}
     */
    static normal(a) {
        return new Vector2(-a[1], a[0]);
    }

    /**
     * Gives the normal vector to this vector
     * @returns {Vector2}
     */
    normal() {
        return Vector2.normal(this);
    }

    /**
     * Returns the sum of two Vector2 or a Vector2 and a number
     * @param {Vec2Arg} a 
     * @param {Vec2Arg | number} b 
     * @returns {Vector2}
     */
    static sum(a, b) {
        if (typeof b == "number")
            return new Vector2(
                a[0] + b,
                a[1] + b
            );

        return new Vector2(
            a[0] + b[0],
            a[1] + b[1]
        );
    }

    /**
     * @param {Vec2Arg | number} other 
     * @returns {Vector2}
     */
    sum(other) {
        return Vector2.sum(this, other);
    }


    /**
     * @param {Vec2Arg} a 
     * @param {Vec2Arg | number} b 
     * @returns {Vector2}
     */
    static difference(a, b) {
        if (typeof b == "number")
            return new Vector2(
                a[0] - b,
                a[1] - b
            );

        return new Vector2(
            a[0] - b[0],
            a[1] - b[1]
        );
    }

    /**
     * @param {Vec2Arg | number} other 
     * @returns {Vector2}
     */
    difference(other) {
        return Vector2.difference(this, other);
    }

    /**
     * 
     * @param {Vec2Arg} a 
     * @param {Vec2Arg | number} b 
     * @returns {Vector2}
     */
    static product(a, b) {
        if (typeof b == "number")
            return new Vector2(
                a[0] * b,
                a[1] * b
            )


        return new Vector2(
            a[0] * b[0],
            a[1] * b[1]
        );
    }

    /**
     * @param {Vec2Arg | number} other 
     * @returns {Vector2}
     */
    product(other) {
        return Vector2.product(this, other);
    }

    /**
     * Calculates the dot/inner product of two vectors
     * @param {Vec2Arg} a
     * @param {Vec2Arg} b
     * @returns {number}
     */
    static dot(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }

    /**
     * Calculates the dot/inner product of this and another vector
     * @param {Vec2Arg} other 
     * @returns {number}
     */
    dot(other) {
        return Vector2.dot(this, other);
    }

    /**
     * Calculates the cross product of two vectors
     * @param {Vec2Arg} a
     * @param {Vec2Arg} b
     * @returns {number}
     */
    static cross(a, b) {
        return a[0] * b[1] - a[1] * b[0];
    }

    /**
     * Calculates the cross product of this and another vector
     * @param {Vec2Arg} other 
     * @returns {number}
     */
    cross(other) {
        return Vector2.cross(this, other);
    }

    /**
     * @param {Vec2Arg} a 
     * @param {Vec2Arg | number} b 
     * @returns {Vector2}
     */
    static quotient(a, b) {
        if (typeof b == 'number')
            return new Vector2(
                a[0] / b,
                a[1] / b
            );


        return new Vector2(
            a[0] / b[0],
            a[1] / b[1]
        );
    }

    /**
     * @param {Vec2Arg | number} other 
     * @returns {Vector2}
     */
    quotient(other) {
        return Vector2.quotient(this, other);
    }

    /**
     * In-place version of Vector2.prototype.sum
     * @param {Vec2Arg} other 
     */
    add(other) {
        this.x += other[0];
        this.y += other[1];
    }

    /**
     * In-place version of Vector2.prototype.difference
     * @param {Vec2Arg} other 
     */
    subtract(other) {
        this.x -= other[0];
        this.y -= other[1];
    }

    /**
     * In-place version of Vector2.prototype.product 
     * @param {Vec2Arg | number} other 
     */
    multiply(other) {
        if (typeof other == "number") {
            this.x *= other;
            this.y *= other;
            return;
        }

        this.x *= other[0];
        this.y *= other[1];
    }

    /**
     * In-place version of Vector2.prototype.quotient
     * @param {Vec2Arg | number} other 
     */
    divide(other) {
        if (typeof other == "number") {
            this.x /= other;
            this.y /= other;
            return;
        }

        this.x /= other[0];
        this.y /= other[1];
    }

    /**
     * Makes a copy of this
     * @returns {Vector2}
     */
    copy() {
        return new Vector2(this.x, this.y)
    }

    /**
     * Copy values from one Vec2Arg to this
     * @param {Vec2Arg} other 
     */
    copyFrom(other) {
        this.x = other[0];
        this.y = other[1];
    }
}

/** @readonly */
/** @enum {number} */
export const LogLevel = {
    INFO: 1,
    WARN: 2,
    ERROR: 3,
}

// export class LogMessage {
//     /** @type {LogLevel} */
//     level = 1;
//     /** @type {string} */
//     message;
//     /** @type {Date} */
//     datetime;

//     /**
//      * 
//      * @param {string} message 
//      * @param {LogLevel} level 
//      * @param {Date} datetime 
//      */
//     constructor(message, level, datetime) {
//         this.message = message;
//         this.level = level;
//         this.datetime = datetime ?? new Date();
//     }
// }

export class DebugManager {
    #elem;
    constructor() {
        this.#elem = document.getElementById("log");
    }

    /**
     * 
     * @param {LogLevel} level 
     * @param  {...any} data 
     */
    message(level, ...data) {
        const text = data.reduce((ac, cur) => `${ac.toString()}\t${cur.toString}`);
        const li = document.createElement("li");
        li.classList.add("message");
        switch (level) {
            case LogLevel.INFO:
                li.classList.add("info");
                break;
            case LogLevel.WARN:
                li.classList.add("warn");
                break;
            case LogLevel.ERROR:
                li.classList.add("error");
                break;
        }

        const bar = document.createElement("div");
        li.appendChild(bar);
        bar.classList.add("bar");
        const content = document.createElement("div");
        content.textContent = text;
        content.classList.add("content");
        li.appendChild(content);
        const date = document.createElement("div");
        date.textContent = (new Date()).toLocaleString('en-AU', { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hourCycle: "h24" });
        date.classList.add("date");
        li.appendChild(date);

        this.#elem.prepend(li);
    }

    /**
     * @param {...any} data The text to log
     */
    log(...data) {
        this.message(LogLevel.INFO, ...data);
    }

    /**
     * @param {...any} data The text to warn
    */
    warn(...data) {
        this.message(LogLevel.WARN, ...data);

    }

    /**
     * @param {...any} data The text to error
    */
    error(...data) {
        this.message(LogLevel.ERROR, ...data);

    }
}