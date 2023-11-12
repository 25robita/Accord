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
    acceleration = new Vector2(0, 0);

    /** @type {number} */
    mass = 1;

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "PhysicsComponent",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            velocity: this.velocity.serialize(),
            acceleration: this.acceleration.serialize(),
            mass: this.mass
        }
    }

    /**
     * 
     * @param {GameObject} object 
     * @param {number} [mass] 
     */
    constructor(object, mass) {
        super(object);
        this.mass = mass ?? 1;
    }

    start() {
    }

    update() {
        this.velocity.add(this.acceleration.product(Time.deltaTime))
        this.#earlyVelocity.copyFrom(this.velocity);

        this.gameObject.localPosition.add(this.velocity.product(Time.deltaTime));
    }
}

/** @typedef {(other: Collider, point:Vector2) => void} ColliderCallback */

export class Collider extends Component {
    /** @type {boolean} */
    trigger = false;
    /** @type {ColliderCallback[]} */
    #collisionListeners = [];

    /**
     * Registers a callback called whenever this object collides with another
     * @param {ColliderCallback} callback 
     */
    registerCollisionListener(callback) {
        this.#collisionListeners.push(callback);
    }

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
                let collisionPoint = this.collisionPoint(other);
                if (this.trigger || other.trigger) {
                    this.#collisionListeners.forEach((callback) => {
                        callback(other, collisionPoint);
                    });
                    continue;
                }
                // console.log(`${this.gameObject.name} vs ${other.gameObject.name} start`);
                /** @type {PhysicsComponent | null} */
                let thisPhysics;
                /** @type {PhysicsComponent | null} */
                const otherPhysics = other.gameObject.getComponent(PhysicsComponent);

                if (!(thisPhysics = this.gameObject.getComponent(PhysicsComponent))) {
                    this.gameObject.undoMovement();
                    this.#collisionListeners.forEach((callback) => {
                        callback(other, collisionPoint);
                    });
                    continue;
                }

                const otherMass = otherPhysics?.mass ?? Infinity;
                const otherVelocity = otherPhysics?.earlyVelocity ?? new Vector2();

                const thisMass = thisPhysics.mass;
                const thisVelocity = thisPhysics.earlyVelocity;

                let thisCenter = new Vector2();

                /** @type {number} */
                let thisRadius;

                if (this instanceof CircleCollider) {
                    thisCenter.copyFrom(this.Position);
                    thisRadius = this.radius;
                } else if (this instanceof BoxCollider) { // fix
                    let direction = new Vector2();

                    const d = collisionPoint.difference(this.Center)

                    if (d.x > Math.abs(d.y)) { direction.copyFrom([-1, 0]); thisRadius = this.Width / 2; }
                    else if (-d.x > Math.abs(d.y)) { direction.copyFrom([1, 0]); thisRadius = this.Width / 2; }
                    else if (d.y > Math.abs(d.x)) { direction.copyFrom([0, -1]); thisRadius = this.Height / 2; }
                    else if (-d.y > Math.abs(d.x)) { direction.copyFrom([0, 1]); thisRadius = this.Height / 2; }
                    else { thisRadius = this.TopRight.difference(this.Center).magnitude(); direction.copyFrom(d.normalised()); }
                    thisCenter.copyFrom(collisionPoint.sum(direction.product(thisRadius)));
                    // console.log(thisCenter, this.TopRight, this.BottomRight, this.TopLeft, this.BottomLeft, direction);
                } else if (this instanceof LineCollider) { // implement thisRadius and thisCenter

                }

                /** @type {Vector2} */
                let otherCenter = new Vector2();

                if (other instanceof CircleCollider) {
                    otherCenter.copyFrom(
                        thisCenter.sum(other.Position.difference(thisCenter).normalised().product(2 * thisRadius))
                    );
                } else if (other instanceof BoxCollider || other instanceof LineCollider) {
                    otherCenter.copyFrom(
                        thisCenter.difference(collisionPoint).normalised().product(-2 * thisRadius).sum(thisCenter)
                    );
                }



                // ensure objects are going towards eachother (relativistically)
                const dV = thisVelocity.difference(otherVelocity);
                const dP = otherCenter.difference(thisCenter);

                const dTheta = 180 * Math.acos(dV.dot(dP) / (dV.magnitude() * dP.magnitude())) / Math.PI;

                // console.log(dTheta);

                if (dTheta > 90) return;




                const centerDifference = thisCenter.difference(otherCenter);

                // const marker = new GameObject(otherCenter, thisRadius);
                // (new CircleRenderer(marker, thisRadius)).color = '#0000ff10';
                // main.root.addChild(marker);

                // const marker2 = new GameObject(thisCenter, thisRadius);
                // (new CircleRenderer(marker2, thisRadius)).color = '#ff000010';
                // main.root.addChild(marker2);

                // const marker3 = new GameObject(collisionPoint, 5);
                // (new CircleRenderer(marker3, 5)).color = '#00ff0030';
                // main.root.addChild(marker3);

                /**
                 * Based on – maths-wise and whatnot
                 * https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
                 * Date: 12/10/23
                 */

                let newVel = thisVelocity.difference(
                    centerDifference.product(
                        (otherMass == Infinity ? 2 : (2 * otherMass / (thisMass + otherMass)))
                        * thisVelocity.difference(otherVelocity).dot(centerDifference)
                        / (centerDifference.dot(centerDifference)) // same as cD.magnitude() ** 2s
                    )
                );

                thisPhysics.velocity = newVel;
                this.#collisionListeners.forEach((callback) => {
                    callback(other, collisionPoint);
                })

                break;
            }
        }
    }
}

export class BoxCollider extends Collider {
    /** @type {Vector2} */
    topLeft = new Vector2();
    /** @type {Vector2} */
    bottomRight = new Vector2();

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "BoxCollider",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            trigger: this.trigger,
            topLeft: this.topLeft.serialize(),
            bottomRight: this.bottomRight.serialize(),
        }
    }

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
     * Gives a unit vector in the orthogonal direction (or 45° angle) from the box to the given point. 
     * @param {Vec2Arg} point 
     * @returns {Vector2}
     */
    compareDirection(point) {
        const onHorizontal = point[1] > this.Top && point[1] < this.Bottom;
        const onVertical = point[0] > this.Left && point[0] < this.Right;

        if (onHorizontal) {
            return point[0] > this.CenterX ? new Vector2(1, 0) : new Vector2(-1, 0);
        } else if (onVertical) {
            return point[1] > this.CenterY ? new Vector2(0, 1) : new Vector2(0, -1);
        } else { // 45° angles
            const invDifference = this.Center.difference(point);
            return new Vector2(-Math.sign(invDifference.x) * Math.SQRT1_2, -Math.sign(invDifference.y) * Math.SQRT1_2)
        }
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
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "CircleCollider",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            trigger: this.trigger,
            offset: this.offset.serialize(),
            radius: this.radius
        }
    }

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

            const squaredDistance = (distanceY - other.Height / 2) ** 2 + (distanceX - other.Width / 2) ** 2;
            return squaredDistance <= this.radius ** 2;
        }

        return other.checkCollision(this);
    }

    /** 
    * @param {Collider} other 
    * @returns {Vector2}
    */
    collisionPoint(other) {
        if (other instanceof CircleCollider) {
            return this.Position.sum(other.Position.difference(this.Position).normalised().product(this.radius))
        } else if (other instanceof BoxCollider) {
            const onHorizontal = this.Position.y > other.Top && this.Position.y < other.Bottom;
            const onVertical = this.Position.x > other.Left && this.Position.x < other.Right;

            if (onHorizontal && this.Position.x > other.Right) return new Vector2(other.Right, this.Position.y);
            if (onHorizontal && this.Position.x < other.Left) return new Vector2(other.Left, this.Position.y);

            if (onVertical && this.Position.y > other.Bottom) return new Vector2(this.Position.x, other.Bottom);
            if (onVertical && this.Position.y < other.Top) return new Vector2(this.Position.x, other.Top);

            if (this.Position.x > other.Right && this.Position.y < other.Top) return other.TopRight;
            if (this.Position.x < other.Left && this.Position.y < other.Top) return other.TopLeft;
            if (this.Position.x > other.Right && this.Position.y > other.Bottom) return other.TopRight;
            if (this.Position.x < other.Left && this.Position.y > other.Bottom) return other.TopLeft;
            return this.Position;
        }
        return other.collisionPoint(this);
    }
}

export class LineCollider extends Collider {
    /** @type {Vector2} */
    #startPoint;
    /** @type {Vector2} */
    #endPoint;

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "LineCollider",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            trigger: this.trigger,
            startPoint: this.#startPoint.serialize(),
            endPoint: this.#endPoint.serialize()
        }
    }

    /** @type {Vector2} */
    get startPoint() {
        return this.#startPoint.sum(this.gameObject.position);
    }

    /** @type {Vector2} */
    get localStartPoint() {
        return this.#startPoint;
    }


    set startPoint(value) {
        this.#startPoint = value;
        this.#calculateLength();
    }

    /** @type {Vector2} */
    get endPoint() {
        return this.#endPoint.sum(this.gameObject.position);
    }

    /** @type {Vector2} */
    get localEndPoint() {
        return this.#startPoint;
    }

    set endPoint(value) {
        this.#endPoint = value;
        this.#calculateLength();
    }

    /** @type {number} */
    #length;

    get length() {
        return this.#length;
    }

    #calculateLength() {
        this.#length = this.#endPoint.difference(this.#startPoint).magnitude();
    }

    /**
     * @param {GameObject} object 
     * @param {Vec2Arg} startPoint 
     * @param {Vec2Arg} endPoint 
     */
    constructor(object, startPoint, endPoint) {
        super(object);

        this.#startPoint = new Vector2(startPoint);
        this.#endPoint = new Vector2(endPoint);
        this.#calculateLength();
    }

    /**
     * @param {Vector2} startA 
     * @param {Vector2} endA 
     * @param {Vector2} startB 
     * @param {Vector2} endB 
     * @returns {boolean}
     */
    static checkLineCollision(startA, endA, startB, endB) {
        const differenceA = endA.difference(startA);
        const differenceB = endB.difference(startB);

        const gradientA = differenceA.x == 0 ? Infinity : differenceA.y / differenceA.x;
        const gradientB = differenceB.x == 0 ? Infinity : differenceB.y / differenceB.x;

        const cA = endA.y - gradientA * endA.x;
        const cB = endB.y - gradientB * endB.x;

        if (gradientA == Infinity || gradientB == Infinity) {
            if (gradientA == gradientB) return startA.x == startB.x;

            // one vertical, one not

            const interceptPointX = gradientA == Infinity ? startA.x : startB.x;

            const interceptPointY = gradientA == Infinity ? gradientB * interceptPointX + cB : gradientA * interceptPointX + cA;

            const topVert = gradientA == Infinity ? Math.min(startA.y, endA.y) : Math.min(startB.y, endB.y);
            const bottomVert = gradientA == Infinity ? Math.max(startA.y, endA.y) : Math.max(startB.y, endB.y);

            const leftNonVert = gradientB == Infinity ? Math.min(startA.x, endA.x) : Math.min(startB.x, endB.x);
            const rightNonVert = gradientB == Infinity ? Math.max(startA.x, endA.x) : Math.max(startB.x, endB.x);

            if (interceptPointX < leftNonVert || interceptPointX > rightNonVert) return false;

            return interceptPointY > topVert && interceptPointY < bottomVert;
        }


        const interceptPointX = (cB - cA) / (gradientA - gradientB);

        if (interceptPointX < Math.min(startA.x, endA.x) && interceptPointX > Math.max(startA.x, endA.x)
            && interceptPointX < Math.min(startB.x, endB.x) && interceptPointX > Math.max(startB.x, endB.x)) return true;


        if (endA == startB || endA == endB || startA == startB || startA == endB) return true;
        return false;
    }

    /**
     * @param {Vector2} startA 
     * @param {Vector2} endA 
     * @param {Vector2} startB 
     * @param {Vector2} endB 
     * @returns {Vector2}
     */
    static lineCollisionPoint(startA, endA, startB, endB) {
        if (startA == startB || startA == endB) return new Vector2(startA);
        if (endA == startB || endA == endB) return new Vector2(endA);

        const differenceA = endA.difference(startA);
        const differenceB = endB.difference(startB);

        const gradientA = differenceA.x == 0 ? Infinity : differenceA.y / differenceA.x;
        const gradientB = differenceB.x == 0 ? Infinity : differenceB.y / differenceB.x;

        const cA = endA.y - gradientA * endA.x;
        const cB = endB.y - gradientB * endB.x;

        if (gradientA == Infinity || gradientB == Infinity) {
            if (gradientA == gradientB) return startA.sum(endA).quotient(2);

            // one vertical, one not

            const interceptPointX = gradientA == Infinity ? startA.x : startB.x;

            const interceptPointY = gradientA == Infinity ? gradientB * interceptPointX + cB : gradientA * interceptPointX + cA;

            return new Vector2(interceptPointX, interceptPointY);
        }

        const interceptPointX = (cB - cA) / (gradientA - gradientB);

        return new Vector2(interceptPointX, gradientA * interceptPointX + cA);
    }

    /**
     * @param {Collider} other
     */
    checkCollision(other) {
        if (other instanceof CircleCollider) {
            /** Based on
             * URL: https://www.baeldung.com/cs/circle-line-segment-collision-detection
             * Date: 18/10/23
             */

            // gets area of triangle (otherCenter, startPoint, endPoint) with cross product magic
            // divides by length to get height of triangle (ignore doubling etc as it cancels out probably)
            // which just so happens to be the shortest distance from the line
            // to the center of the circle. Fun! (the rest is obvious)

            if (other.Position.difference(this.endPoint).dot(this.startPoint.difference(this.endPoint)) > 0
                && other.Position.difference(this.startPoint).dot(this.endPoint.difference(this.startPoint))) {
                const ab = this.startPoint.difference(other.Position);
                const ac = this.endPoint.difference(other.Position);

                const min_length = Math.abs(ab.cross(ac)) / this.#length; // (the height of the triangle)
                return min_length <= other.radius;
            }

            return other.Position.distanceTo(this.endPoint) <= other.radius || other.Position.distanceTo(this.startPoint) <= other.radius;

        } else if (other instanceof BoxCollider) {
            if (this.endPoint.x >= other.Left && this.endPoint.x <= other.Right && this.endPoint.y >= other.Top && this.endPoint.y <= other.Bottom) return true;
            if (this.startPoint.x >= other.Left && this.startPoint.x <= other.Right && this.startPoint.y >= other.Top && this.startPoint.y <= other.Bottom) return true;

            const edges = [
                [other.TopLeft, other.TopRight],
                [other.TopRight, other.BottomRight],
                [other.BottomRight, other.BottomLeft],
                [other.BottomLeft, other.TopLeft]
            ];

            for (let [start, end] of edges) {
                const col = LineCollider.checkLineCollision(this.startPoint, this.endPoint, start, end);

                // console.log(`${this.startPoint} -> ${this.endPoint}\n${start} -> ${end}`);

                if (col) return true;
            }

            // console.log('hi')

            return false;

        } else if (other instanceof LineCollider) {
            return LineCollider.checkLineCollision(this.startPoint, this.endPoint, other.startPoint, other.endPoint);
        }
    }
    /**
     * @param {Collider} other
     */
    collisionPoint(other) {
        if (other instanceof CircleCollider) {
            if (other.Position.difference(this.#endPoint).dot(this.startPoint.difference(this.endPoint)) > 0
                && other.Position.difference(this.startPoint).dot(this.endPoint.difference(this.startPoint)) > 0) {
                const ab = this.startPoint.difference(other.Position);
                const ac = this.endPoint.difference(other.Position);

                const min_length = Math.abs(ab.cross(ac)) / this.#length; // (the height of the triangle)
                return this.startPoint.difference(this.endPoint).normal().normalised().product([-min_length, min_length]).sum(other.Position)
            }

            if (other.Position.distanceTo(this.endPoint) <= other.radius) return new Vector2(this.endPoint);
            return new Vector2(this.startPoint)

        } else if (other instanceof BoxCollider) {
            if (this.endPoint.x >= other.Left && this.endPoint.x <= other.Right && this.endPoint.y >= other.Top && this.endPoint.y <= other.Bottom) return new Vector2(this.endPoint);
            if (this.startPoint.x >= other.Left && this.startPoint.x <= other.Right && this.startPoint.y >= other.Top && this.startPoint.y <= other.Bottom) return new Vector2(this.startPoint);

            const edges = [
                [other.TopLeft, other.TopRight], // top
                [other.TopRight, other.BottomRight], // right
                [other.BottomRight, other.BottomLeft], // bottom
                [other.BottomLeft, other.TopLeft] // left
            ];

            let p = new Vector2();
            let n = 0;
            for (let [start, end] of edges) {
                if (LineCollider.checkLineCollision(this.startPoint, this.endPoint, start, end)) {
                    p.add(LineCollider.lineCollisionPoint(this.startPoint, this.endPoint, start, end));
                    n++;
                }
            }

            if (n) return p.quotient(n);

            return new Vector2();
        } else if (other instanceof LineCollider) {
            return LineCollider.lineCollisionPoint(this.startPoint, this.endPoint, other.startPoint, other.endPoint);
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
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "CircleRenderer",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            radius: this.radius,
            color: this.color
        }
    }


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

    /** @type {string} – The fill colour and default edge colour */
    color = "black";

    /** @type {string | undefined} Defaults to PolygonRenderer.prototype.color*/
    edgeColor;

    /** @type {boolean} Draws edges – defaults to false */
    edge = false;
    /** @type {boolean} Draws fill – defaults to true */
    fill = true;

    /** @type {number} */
    lineWidth = 4;

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "PolygonRenderer",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            points: this.points.map(i => i.serialize()),
            color: this.color,
            edgeColor: this.edgeColor,
            edge: this.edge,
            fill: this.fill,
            lineWidth: this.lineWidth
        }
    }


    /** 
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) {
        surface.fillStyle = this.color;
        surface.strokeStyle = this.edgeColor ?? this.color;
        surface.lineWidth = this.lineWidth;
        surface.beginPath();
        surface.moveTo(...(this.points[0].sum(this.gameObject.position)));
        for (let point of this.points.slice(1)) {
            surface.lineTo(...(point.sum(this.gameObject.position)));
        }
        surface.closePath();
        if (this.fill) surface.fill();
        if (this.edge) surface.stroke();
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
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "BoxRenderer",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            top: this.#top,
            bottom: this.#bottom,
            left: this.#left,
            right: this.#right,
            color: this.color,
            edgeColor: this.edgeColor,
            edge: this.edge,
            fill: this.fill,
            lineWidth: this.lineWidth
        }
    }


    /**
     * Wrapper for PolygonRenderer making it easier to render boxes
     * @param {GameObject} object
     * @param {[number, number, number, number]} [rect] top, bottom, left, right of initial rect.
     * @param {boolean} [edge] Enables/disables edge drawing. Defaults to false
     * @param {boolean} [fill] Enables/disables fill drawing. Defaults to true
     */
    constructor(object, rect, edge = false, fill = true) {
        super(object);
        this.edge = edge;
        this.fill = fill;

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

export class LineRenderer extends Renderer {
    /** @type {Vector2} */
    startPoint;
    /** @type {Vector2} */
    finishPoint;

    /** @type {number} */
    width;

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "LineRenderer",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            startPoint: this.startPoint.serialize(),
            finishPoint: this.finishPoint.serialize(),
            width: this.width
        }
    }


    /**
     * 
     * @param {GameObject} object 
     * @param {Vec2Arg} startPoint 
     * @param {Vec2Arg} finishPoint 
     * @param {number} width 
     */
    constructor(object, startPoint, finishPoint, width = 4) {
        super(object)
        this.startPoint = new Vector2(startPoint);
        this.finishPoint = new Vector2(finishPoint);
        this.width = width;
    }

    /** 
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) {
        surface.strokeStyle = this.color;
        surface.lineWidth = this.width;
        surface.beginPath();
        surface.moveTo(this.startPoint.x + this.gameObject.position.x, this.startPoint.y + this.gameObject.position.y);
        surface.lineTo(this.finishPoint.x + this.gameObject.position.x, this.finishPoint.y + this.gameObject.position.y);
        surface.stroke();
    }
}

export class TextRenderer extends Renderer {
    /** @type {string} */
    text;
    /** @type {number} Text Size, in px */
    size;
    /** @type {string} */
    fontFamily;
    /** @type {Vector2} */
    offset;
    /** @type {string} */
    color = "black";
    /** @type {CanvasTextAlign} */
    align = "center";
    /** @type {CanvasTextBaseline} */
    baseline = "middle";

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "TextRenderer",
            uuid: this.uuid,
            gameObject: this.gameObject.uuid,
            enabled: this.enabled,
            text: this.text,
            size: this.size,
            fontFamily: this.fontFamily,
            offset: this.offset.serialize(),
            color: this.color,
            align: this.align,
            baseline: this.baseline
        }
    }


    /**
     * @param {GameObject} object 
     * @param {string} [text] Initial text
     * @param {number} [size] Text size, in px
     * @param {number} [fontFamily] Font family of text
     * @param {Vec2Arg} [offset] Offset of renderer
     */
    constructor(object, text, size, fontFamily, offset) {
        super(object);

        this.text = text ?? "";
        this.size = size ?? 30;
        this.fontFamily = fontFamily ?? "sans-serif";
        this.offset = offset == undefined ? new Vector2() : new Vector2(offset);
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} surface 
     */
    render(surface) {
        surface.fillStyle = this.color;
        surface.textAlign = this.align;
        surface.textBaseline = this.baseline;
        surface.font = `${this.size}px ${this.fontFamily}`
        const position = this.gameObject.position.sum(this.offset)
        surface.fillText(this.text, position.x, position.y);
    }
}

class ScriptFunction extends AccordObject {
    /** @type {Function} */
    #f;
    /** @type {string} */
    #t;
    /** @type {string[]} */
    #argNames;
    /** @type {Script} */
    #thisArg;

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "ScriptFunction",
            uuid: this.uuid,
            text: this.#t,
            argNames: this.#argNames,
            thisArgUUID: this.#thisArg.uuid
        }
    }

    /**
     * @param {Script} thisArg 
     * @param {string} text 
     * @param {...string} argNames 
     */
    constructor(thisArg, text, ...argNames) {
        super();
        this.#thisArg = thisArg;
        this.setText(text, ...argNames);
    }



    /**
     * @param  {...any} args 
     * @returns {any}
     */
    call(...args) {
        return this.#f.call(this.#thisArg, ...args);
    }

    get text() {
        return this.#t;
    }

    get argNames() {
        return this.#argNames;
    }

    /**
     * 
     * @param {string} text 
     * @param  {...string} argNames 
     */
    setText(text, ...argNames) {
        // console.log(argNames, text);
        this.#f = new Function(...argNames, text ?? "");
        // console.log("here");
        this.#t = text ?? "";

        this.#argNames = argNames ?? [];
    }

}

export class Script extends Component {
    /** @type {Map<string, ScriptFunction>} */
    functions = new Map()

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "Script",
            uuid: this.uuid,
            functions: [...this.functions.entries()].map(([n, f]) => [n, f.serialize()])
        }
    }


    /**
     * @param {GameObject} object 
     * @param {string} [startFunction] 
     * @param {string} [updateFunction] 
     */
    constructor(object, startFunction, updateFunction) {
        super(object);
        this.functions.set("start", new ScriptFunction(this, startFunction));
        this.functions.set("update", new ScriptFunction(this, updateFunction));
    }

    /**
     * 
     * @param {string} functionName 
     * @param  {...any} args 
     * @returns
     */
    invoke(functionName, ...args) {
        return this.functions.get(functionName).call(...args);
    }

    /**
     * 
     * @param {string} functionName 
     * @param {number} delay The delay in ms 
     * @param  {...any} args 
     * @returns
     */
    invokeAfter(functionName, delay, ...args) {
        return new Promise(resolve => {
            setTimeout(() => {
                this.functions.get(functionName).call(...args);
                resolve();
            }, delay);
        });
    }

    start() {
        return this.functions.get("start").call();
    }

    update() {
        return this.functions.get("update").call();
    }

    /**
     * @template {"collider"} ListenerType
     * @param {ListenerType} type 
     * @param {string} callback 
     */
    registerListener(type, callback) {
        switch (type) {
            case "collider":
                /** @type {Collider} */
                let collider;
                this.register("onCollision", callback, "other", "point");
                for (collider of this.gameObject.getComponents(Collider)) {
                    collider.registerCollisionListener((other, point) =>
                        this.invoke("onCollision", other, point)
                    );
                }
                break;
        }
    }

    /**
     * Adds a named function to this script
     * @param {string} functionName Name of the function
     * @param {string} callback Javascript text of the function
     * @param  {...string} argNames Names of the arguments to the function
     */
    register(functionName, callback, ...argNames) {
        this.functions.set(functionName, new ScriptFunction(this, callback, ...argNames));
    }

    vars = new Map();
}