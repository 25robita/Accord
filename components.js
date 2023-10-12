import { AccordObject } from './base.js';
import { GameObject } from './gameobject.js';
import { ObjectReference, Time } from './main.js';
import { Vector2 } from './utilities.js';

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
    #earlyVelocity = new Vector2();

    /** @type {Vector2} */
    get earlyVelocity() {
        return this.#earlyVelocity;
    }

    /** @type {Vector2} */
    acceleration = new Vector2();

    /** @type {number} */
    mass = 1;

    /**
     * 
     * @param {GameObject} object 
     * @param {number} [mass] 
     */
    constructor(object, mass) {
        super(object);
        this.mass = mass ?? 1;
    }

    /** @type  */
    addForce(force) {

    }

    start() {
        // this.acceleration = new Vector2(0, 0);
        // this.velocity = new Vector2(0, 0);
        // this.mass = 1;
    }

    update() {
        // console.log(this.velocity);
        this.velocity.add(this.acceleration.product(Time.deltaTime))
        this.#earlyVelocity.copyFrom(this.velocity);

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

    /**
     * @param {Collider} other
     * @returns {Vector2}
     */
    collisionPoint(other) { }

    lateUpdate() {
        /** @template {Collider} anycollider */
        /** @type {Generator<anycollider, void, never>} */
        const allColliders = ObjectReference.getOfType(Collider);
        for (let other of allColliders) {
            if (this.uuid == other.uuid) continue;
            if (this.checkCollision(other)) {
                /** @type {PhysicsComponent | null} */
                let thisPhysics;
                /** @type {PhysicsComponent | null} */
                const otherPhysics = other.gameObject.getComponent(PhysicsComponent);

                if (!(thisPhysics = this.gameObject.getComponent(PhysicsComponent)))
                    return this.gameObject.undoMovement();

                const otherMass = otherPhysics?.mass ?? Infinity; // this causes issues; it makes sense as to why, but still interesting.
                const otherVelocity = otherPhysics?.earlyVelocity ?? new Vector2();

                const thisMass = thisPhysics.mass;
                const thisVelocity = thisPhysics.velocity;

                /** @type {Vector2} */
                let thisCenter = new Vector2();

                if (this instanceof CircleCollider) {
                    thisCenter.copyFrom(this.Position);
                } else if (this instanceof BoxCollider) {
                    thisCenter.copyFrom(this.Center);
                }


                let thisRadius;

                if (this instanceof CircleCollider) {
                    thisRadius = this.radius;
                } else if (this instanceof BoxCollider) {
                    thisRadius = this.collisionPoint(other).distanceTo(this.Center);
                }

                /** @type {Vector2} */
                let otherCenter = new Vector2();

                if (other instanceof CircleCollider) {
                    otherCenter.copyFrom(
                        thisCenter.sum(other.Position.difference(thisCenter).normalised().product(2 * thisRadius))
                    );
                } else if (other instanceof BoxCollider) {
                    otherCenter.copyFrom(
                        thisCenter.sum(this.collisionPoint(other).difference(thisCenter).product(2))
                    );
                }

                [thisMass, thisVelocity, thisCenter]

                const centerDifference = thisCenter.difference(otherCenter);

                /**
                 * Based on – maths-wise and whatnot
                 * https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
                 * Date: 12/10/23
                 */

                let newVel = thisVelocity.difference(
                    centerDifference.product(
                        (2 * otherMass / (thisMass + otherMass))
                        * thisVelocity.difference(otherVelocity).dot(centerDifference)
                        / (centerDifference.dot(centerDifference))
                    )
                );

                thisPhysics.velocity = newVel;

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
            this.CenterX,
            this.CenterY
        );
    }

    /** @type {number} */
    get CenterX() {
        return (this.Left + this.Right) / 2;
    }
    /** @type {number} */
    get CenterY() {
        return (this.Top + this.Bottom) / 2
    }

    /** @type {Vector2} */
    get TopLeft() {
        return this.topLeft.sum(this.gameObject.position);
    }

    /** @type {Vector2} */
    get TopMiddle() {
        return new Vector2(this.CenterX, this.Top);
    }

    /** @type {Vector2} */
    get TopRight() {
        return new Vector2(this.Right, this.Top);
    }

    /** @type {Vector2} */
    get MiddleLeft() {
        return new Vector2(this.Left, this.CenterY);
    }

    /** @type {Vector2} */
    get MiddleRight() {
        return new Vector2(this.Right, this.CenterY);
    }

    /** @type {Vector2} */
    get BottomLeft() {
        return new Vector2(this.Left, this.Bottom);
    }

    /** @type {Vector2} */
    get BottomMiddle() {
        return new Vector2(this.CenterX, this.Bottom);
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

    /**
     * @param {Collider} other 
     * @returns {Vector2}
     */
    collisionPoint(other) {
        if (other instanceof BoxCollider) {
            const otherCenter = other.Center;

            const distanceToTopLeft = otherCenter.distanceTo(this.TopLeft),
                distanceToBottomRight = otherCenter.distanceTo(this.BottomRight);

            if (distanceToTopLeft < distanceToBottomRight) {
                const distanceToTopRight = otherCenter.distanceTo(this.TopRight);
                if (distanceToTopRight < distanceToTopLeft) {
                    const distanceToTopMiddle = otherCenter.distanceTo(this.TopMiddle);
                    if (distanceToTopMiddle < distanceToTopRight)
                        return this.TopMiddle;
                    return this.TopRight;
                }

                const distanceToMiddleLeft = otherCenter.distanceTo(this.MiddleLeft);

                if (distanceToMiddleLeft < distanceToTopLeft) {
                    const distanceToBottomLeft = otherCenter.distanceTo(this.BottomLeft);
                    if (distanceToBottomLeft < distanceToMiddleLeft)
                        return this.BottomLeft;
                    return this.MiddleLeft;
                }

                const distanceToTopMiddle = otherCenter.distanceTo(this.TopMiddle);

                if (distanceToTopMiddle < distanceToTopLeft)
                    return this.TopMiddle;
                return this.topLeft;

            } else {
                const distanceToBottomLeft = otherCenter.distanceTo(this.BottomLeft);
                if (distanceToBottomLeft < distanceToBottomRight) {
                    // bottomleft, bottommiddle

                    const distanceToBottomMiddle = otherCenter.distanceTo(this.BottomMiddle);

                    if (distanceToBottomMiddle < distanceToBottomLeft)
                        return this.BottomMiddle;
                    return this.BottomLeft;
                }

                const distanceToMiddleRight = otherCenter.distanceTo(this.MiddleRight);

                if (distanceToMiddleRight < distanceToBottomRight) {
                    const distanceToTopRight = otherCenter.distanceTo(this.TopRight);

                    if (distanceToTopRight < distanceToMiddleRight)
                        return this.TopRight;
                    return this.MiddleRight;
                }

                const distanceToBottomMiddle = otherCenter.distanceTo(this.BottomMiddle);

                if (distanceToBottomMiddle < distanceToBottomRight)
                    return this.BottomMiddle;
                return this.BottomRight;
            }
        }

        return other.collisionPoint(this);
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
        } else if (other instanceof BoxCollider) {
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

    /** 
    * @param {Collider} other 
    * @returns {Vector2}
    */
    collisionPoint(other) {
        if (other instanceof CircleCollider) {
            return this.Position.sum(other.Position.difference(this.Position).normalised().product(this.radius))
        } else if (other instanceof BoxCollider) {
            // TODO: this should probably find a point *between* the two surfaces; 
            // currently it finds a point on the circle which is leading to collision
            // issues. problematically, this should probably make the calculations far more difficult.
            // i might just be able to get an intercept point from the difference line at x = whatever
            // and then take the average. anyway im tired

            // on second thought, this code is entirely f***ed (i will censor it as it is a school project)
            // and i need to rethink it on a fundamental level. that being said, the method above 
            // oh wait nevermind there is no difference line. I might have to look through the circle x box
            // collision code to establish the collision point. fun.

            return other.Center.difference(this.Position).normalised().product(this.radius).sum(this.Position)
        }
    }
}

export class Renderer extends Component {
    /**
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) { }
}

export class CircleRenderer extends Renderer {
    /** @type {number} */
    radius = 0;

    /** @type {string} */
    color = "black";

    /**
     * 
     * @param {GameObject} gameObject parent
     * @param {number} [radius] Radius of the rendered circle
     */
    constructor(object, radius) {
        super(object);
        this.radius = radius ?? 0;
    }

    /**
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) {
        if (!this.radius) return;

        surface.fillStyle = this.color;
        surface.ellipse(...this.gameObject.position, this.radius, this.radius, 0, 0, 180);
        surface.fill();
    }
}


export class PolygonRenderer extends Renderer {
    /** @type {Vector2[]} */
    points = [];

    /** @type {string} */
    color = "black";

    /** 
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) {
        surface.fillStyle = this.color;
        surface.beginPath();
        surface.moveTo(...(this.points[0].sum(this.gameObject.position)));
        for (let point of this.points.slice(1)) {
            surface.lineTo(...(point.sum(this.gameObject.position)));
        }
        surface.closePath();
        surface.fill();
    }
}

export class BoxRenderer extends PolygonRenderer {
    /** @type {number} */
    #top = 0;
    /** @type {number} */
    #bottom = 0;
    /** @type {number} */
    #left = 0;
    /** @type {number} */
    #right = 0;


    /**
     * Wrapper for PolygonRenderer making it easier to render boxes
     * @param {GameObject} object
     * @param {[number, number, number, number]} [rect] top, bottom, left, right of initial rect.
     */
    constructor(object, rect) {
        super(object);

        /** @type {BoxCollider} */
        let thisBox;

        if (rect) {
            [this.#top, this.#bottom, this.#left, this.#right] = rect;
        } else if (thisBox = this.gameObject.getComponent(BoxCollider)) {
            [this.#top, this.#bottom, this.#left, this.#right] = [thisBox.topLeft.y, thisBox.bottomRight.y, thisBox.topLeft.x, thisBox.bottomRight.x];
        }
        this.points = [
            new Vector2(),
            new Vector2(),
            new Vector2(),
            new Vector2()
        ]

        this.#updatePoints();
    }

    #updatePoints() {
        this.points[0].copyFrom([this.#left, this.#top]);
        this.points[1].copyFrom([this.#right, this.#top]);
        this.points[2].copyFrom([this.#right, this.#bottom]);
        this.points[3].copyFrom([this.#left, this.#bottom]);
    }

    /** 
     * The local Top value of the box
     * @type {number} 
     */
    set Top(value) {
        this.#top = value;
        this.#updatePoints();
    }

    /** 
     * The local Top value of the box
     * @type {number} 
     */
    get Top() {
        return this.#top;
    }

    /** 
     * The local Bottom value of the box
     * @type {number} 
     */
    set Bottom(value) {
        this.#bottom = value;
        this.#updatePoints();
    }

    /** 
     * The local Bottom value of the box
     * @type {number} 
     */
    get Bottom() {
        return this.#bottom;
    }

    /** 
     * The local left value of the box
     * @type {number} 
     */
    set Left(value) {
        this.#left = value;
        this.#updatePoints();
    }

    /** 
     * The local left value of the box
     * @type {number} 
     */
    get Left() {
        return this.#left;
    }

    /** 
     * The local Right value of the box
     * @type {number} 
     */
    set Right(value) {
        this.#right = value;
        this.#updatePoints();
    }

    /** 
     * The local Right value of the box
     * @type {number} 
     */
    get Right() {
        return this.#right;
    }

}