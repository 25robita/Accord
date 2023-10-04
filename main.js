import { AccordObject } from "./base";
import { TimeManager, Vector2 } from "./utilities";

import { BoxCollider, CircleCollider, Component, PhysicsComponent } from "./components";

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


/****** Accord Objects *******/

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

    /**
     * Returns the first component of specified type
     * @template {Component} T 
     * @param {T} type Component type
     * @returns {T}
     */
    getComponent(type) {
        return this.getComponent()
    }

    /**
     * Yields all components of specified type
     * @template {Component} T 
     * @param {T} type Component type
     * @returns {Generator<T, void, never>}
     */
    *getComponents(type) {
        for (let component of this.components)
            if (component instanceof type) yield component;
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
new PhysicsComponent(object);
new CircleCollider(object);

main.root.addChild(object);

const object2 = new GameObject([400, -200], 30);
object2.name = "Ball 2";
new PhysicsComponent(object2);
new CircleCollider(object2);

main.root.addChild(object2);

const colliderObject = new GameObject([0, 0], 0);
colliderObject.name = "Floor";
new BoxCollider(colliderObject, 300, 600, 0, 1000);

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