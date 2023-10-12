
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
        this.divide(Math.sqrt(this.x ** 2 + this.y ** 2));
    }

    /**
     * Returns a normalised vector of this
     * @returns {Vector2}
     */
    normalised() {
        return Vector2.normalised(this);
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