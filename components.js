import { AccordObject } from './base';
import { Vector2 } from './utilities';

export class Component extends AccordObject {
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


export class PhysicsComponent extends Component {
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

export class Collider extends Component {
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

export class BoxCollider extends Collider {
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

export class CircleCollider extends Collider {
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