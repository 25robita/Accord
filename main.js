/****** Types ******/

/** @typedef {[number, number]} Vec2Array Represents a two-dimensional vector*/

/** @typedef {Vec2Array | Vector2} Vec2Arg Represents a point on the plane of the game */

/** @typedef {Vec2Array} Point Represents a point on the plane of the game */

/****** Utilities ******/
/**
 * Can be used in insecure contexts, unlike crypto.randomUUID()
 * @returns {string} UUID
 */
function generateUUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

class TimeManager {
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

/** 
 * @template T
 * @type {Map<string, AccordObject> & {getOfType: (type: T) => Generator<T, void, never>}} 
 * */
const ObjectReference = new Map();

ObjectReference.getOfType = function* (type) {
    for (let [uuid, object] of this) {
        if (object instanceof type) yield object;
    }
}

class Vector2 {
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
     * Returns the sum of two Vector2
     * @param {Vec2Arg} a 
     * @param {Vec2Arg} b 
     * @returns {Vector2}
     */
    static sum(a, b) {
        return new Vector2(
            a[0] + b[0],
            a[1] + b[1]
        );
    }

    /**
     * @param {Vec2Arg} other 
     * @returns {Vector2}
     */
    sum(other) {
        return Vector2.sum(this, other);
    }


    /**
     * @param {Vec2Arg} a 
     * @param {Vec2Arg} b 
     * @returns {Vector2}
     */
    static difference(a, b) {
        return new Vector2(
            a[0] - b[0],
            a[1] - b[1]
        );
    }

    /**
     * @param {Vec2Arg} other 
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


/****** Accord Objects *******/
class AccordObject {  // going to be serializable
    /** @type {string} */
    uuid;
    constructor() {
        this.uuid = generateUUID();
        ObjectReference.set(this.uuid, this);
    }
}

class Component extends AccordObject {
    /** @type {boolean} */
    started = false;
    /** @type {GameObject} */
    gameObject;
    /** @type {boolean} */
    enabled = true;

    /**
     * 
     * @param {GameObject} gameObject Parent GameObject
     */
    constructor(gameObject) {
        super();
        this.gameObject = gameObject;
        this.gameObject.attachComponent(this);

        this.start();
    }

    update() { }

    lateUpdate() { }

    start() { }
}


class PhysicsComponent extends Component {
    /** @type {Vector2} */
    velocity = new Vector2();

    /** @type {Vector2} */
    acceleration = new Vector2();

    start() {
        this.acceleration = new Vector2(0, 100);
        this.velocity = new Vector2();
    }

    update() {
        this.velocity.add(this.acceleration.product(Time.deltaTime))
        // this.velocity[0] += this.acceleration[0] * Time.deltaTime;
        // this.velocity[1] += this.acceleration[1] * Time.deltaTime;

        this.gameObject.position.add(this.velocity.product(Time.deltaTime));

        // this.gameObject.position[0] += this.velocity[0] * Time.deltaTime;
        // this.gameObject.position[1] += this.velocity[1] * Time.deltaTime;
    }

    lateUpdate() {
        // this.gameObject.undoMovement();
    }
}

class Collider extends Component {
    /**
     * @param {Collider} other
     * @returns {boolean}
     */
    checkCollision(other) { }

    lateUpdate() {
        for (let other of ObjectReference.getOfType(Collider)) {
            if (this.uuid == other.uuid) continue;
            if (this.checkCollision(other)) {
                // console.log(`${this.gameObject.name} collides with ${other.gameObject.name}`)
                this.gameObject.undoMovement();
                break;
            }
        }
    }
}

class BoxCollider extends Collider {
    /** @type {Vector2} */
    topLeft = new Vector2(100, 100);
    /** @type {Vector2} */
    bottomRight = new Vector2(100, 100);

    /**
     * @param {GameObject} object Parent object
     * @param  {...([Vec2Arg, Vec2Arg] | [number, number, number, number] | [])} rect Either in the form of (topLeft, bottomRight) or (top, bottom, left, right)
     */
    constructor(object, ...rect) {
        super(object);

        if (rect.length == 2) {
            this.topLeft = new Vector2(rect[0]);
            this.bottomRight = new Vector2(rect[1]);
        } else if (rect.length == 4) {
            this.topLeft = new Vector2(Math.min(rect[2], rect[3]), Math.min(rect[0], rect[1]));
            this.bottomRight = new Vector2(Math.max(rect[2], rect[3]), Math.max(rect[0], rect[1]));
        } else if (rect.length == 0) {
            this.topLeft = new Vector2(-this.gameObject.radius, -this.gameObject.radius);
            this.bottomRight = new Vector2(this.gameObject.radius, this.gameObject.radius);
        } else {
            throw TypeError(`Rect configuration '${rect}' does not match pattern`);
        }
    }

    /** @type {number} */
    get Top() {
        return this.TopLeft.y;
    }
    /** @type {number} */
    get Left() {
        return this.TopLeft.x;
    }
    /** @type {number} */
    get Bottom() {
        return this.BottomRight.y;
    }
    /** @type {number} */
    get Right() {
        return this.BottomRight.x;
    }

    /** @type {number} */
    get Width() {
        return this.Right - this.Left;
    }
    /** @type {number} */
    get Height() {
        return this.Bottom - this.Top;
    }

    /** @type {Vector2} */
    get Center() {
        return new Vector2(
            (this.Left + this.Right) / 2,
            (this.Top + this.Bottom) / 2
        );
    }

    /** @type {Vector2} */
    get TopLeft() {
        return this.topLeft.sum(this.gameObject.position);
    }

    /** @type {Vector2} */
    get BottomRight() {
        return this.bottomRight.sum(this.gameObject.position);
    }

    /**
     * 
     * @param {Collider} other 
     * @returns {boolean}
     */
    checkCollision(other) {
        if (other instanceof BoxCollider) {
            return Math.max(this.Left, other.Left) < Math.min(this.Right, other.Right)
                && Math.max(this.Top, other.Top) < Math.min(this.Bottom, other.Bottom);
        }

        return other.checkCollision(this); // this shouldn't really be called but oh well

    }
}

class CircleCollider extends Collider {
    /** @type {Vector2} */
    offset = new Vector2()
    /** @type {number} */
    radius;

    /**
     * 
     * @param {GameObject} object Parent gameobject
     * @param {number} [radius] The radius of the collider
     * @param {Vec2Arg} [offset] The offset of the collider
     */
    constructor(object, radius, offset) {
        super(object);

        this.radius = radius ?? this.gameObject.radius;
        this.offset = new Vector2(offset ?? [0, 0]);
    }

    get Position() {
        return this.offset.sum(this.gameObject.position);
    }

    /**
     * @param {Collider} other
     */
    checkCollision(other) {
        if (other instanceof CircleCollider) {
            return this.Position.distanceTo(other.Position) < this.radius + other.radius;
        }

        if (other instanceof BoxCollider) {
            /**
             * Copied
             * https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
             * Date: 3rd Oct
             */
            const distanceX = Math.abs(this.Position.x - other.Center.x);
            const distanceY = Math.abs(this.Position.y - other.Center.y);

            if (distanceX > other.Width / 2 + this.radius) return false;
            if (distanceY > other.Height / 2 + this.radius) return false;

            if (distanceX <= other.Width / 2) return true;
            if (distanceY <= other.Height / 2) return true;

            return this.Position.distanceTo(other.Center) <= this.radius
        }
    }
}

class GameObject extends AccordObject {
    /** @type {Vector2} */
    position;
    /** @type {Vector2} */
    #previousPosition;
    /** @type {number} */
    radius;
    /** @type {GameObject[]} */
    children;
    /** @type {Component[]} */
    components;
    /** @type {string} */
    name;

    /**
     * 
     * @param {Vec2Arg} position Starting position of the GameObject
     * @param {number} radius Radius of rendered circle
     */
    constructor(position, radius) {
        super();
        this.position = new Vector2(position ?? [0, 0]);
        this.#previousPosition = this.position.copy();

        this.radius = radius ?? 100;
        this.children = [];
        this.components = []
    }

    /** @type {Vector2} */
    get PreviousPosition() {
        return this.#previousPosition;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) {
        if (this.radius) {
            surface.fillStyle = "blue";
            surface.ellipse(this.position.x, this.position.y, this.radius, this.radius, 0, 0, 180);
            surface.fill();
        }

        this.children.forEach(i => i.render(surface));
    }

    /**
     * @param {GameObject} gameObject 
     */
    addChild(gameObject) {
        this.children.push(gameObject);
    }

    /**
     * Must be called in lateUpdate. Undoes any movement done this frame.
     */
    undoMovement() {
        this.position.copyFrom(this.#previousPosition);
    }

    update() {
        this.components.forEach(component => {
            if (!component.enabled) return;

            if (!component.started) {
                component.started = true;
                component.start()
            }
            component.update();
        });

        this.children.forEach(child => {
            child.update();
        });
    }

    lateUpdate() {
        this.components.forEach(component => {
            component.lateUpdate();
        });

        this.children.forEach(child => {
            child.lateUpdate();
        });

        // console.log([this.position[0] - this.#previousPosition[0], this.position[1] - this.#previousPosition[1]]);

        this.#previousPosition.copyFrom(this.position);
    }

    /**
     * 
     * @param {Component} component 
     */
    attachComponent(component) {
        this.components.push(component);
    }
}

class Scene extends AccordObject {
    /** @type {CanvasRenderingContext2D} */
    #context;
    /** @type {number} */
    #updateInterval;
    /** @type {number} */
    #updaterId;

    constructor() {
        super();
        this.root = new GameObject([0, 0], 0);
        this.canvasElement = document.querySelector("canvas");
        this.#context = this.canvasElement.getContext("2d")
        this.#updateInterval = 1; // 10fps

        this.#updaterId = setInterval(this.update.bind(this), this.#updateInterval);
    }

    render() {
        this.#context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.#context.beginPath();
        this.root.render(this.#context);
    }

    update() {
        Time.lap();

        // go through all game objects and update
        this.root.update();
        this.root.lateUpdate();

        // + render
        this.render();
    }
}

const Time = new TimeManager();

const main = new Scene();

const object = new GameObject([300, 0], 100);
object.name = "Ball";
const physics = new PhysicsComponent(object);
const objectCollider = new CircleCollider(object);

main.root.addChild(object);

const object2 = new GameObject([400, -200], 30);
object2.name = "Ball 2";
const physics2 = new PhysicsComponent(object2);
const objectCollider2 = new CircleCollider(object2);

main.root.addChild(object2);

const colliderObject = new GameObject([0, 0], 0);
colliderObject.name = "Floor";
const floorCollider = new BoxCollider(colliderObject, 300, 600, 0, 1000);

main.root.addChild(colliderObject);


const canvas = document.querySelector("canvas");

function resize() {
    const ctx = canvas.getContext("2d");
    let image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    canvas.setAttribute("width", document.body.clientWidth.toString());
    canvas.setAttribute("height", (document.body.clientHeight - 5).toString());
    ctx.putImageData(image, 0, 0);

}

addEventListener("resize", resize);

resize();
//# sourceMappingURL=main.js.map