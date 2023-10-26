import { AccordObject } from "./base.js";
import { BoxCollider, BoxRenderer, CircleCollider, CircleRenderer, Collider, Component, LineCollider, LineRenderer, PhysicsComponent, PolygonRenderer, Script } from "./components.js";
import { GameObject } from "./gameobject.js";
import { InputManager, TimeManager, Vector2 } from "./utilities.js";

/** 
 * @template {AccordObject} T
 * @type {Map<string, AccordObject> & {getOfType: (type: T) => Generator<T, void, never>}} 
 * */
export const ObjectReference = new Map();

ObjectReference.getOfType = function* (type) {
    for (let [uuid, object] of this) {
        if (object instanceof type) yield object;
    }
}

window.x = ObjectReference;

/****** Accord Objects *******/


class Scene extends AccordObject {
    /** @type {CanvasRenderingContext2D} */
    #context;
    /** @type {number} */
    #updateInterval;
    /** @type {number} */
    #updaterId;

    /** @type {boolean} */
    paused;

    constructor() {
        super();
        this.root = new GameObject([0, 0], 0);
        this.canvasElement = document.querySelector("canvas");
        this.#context = this.canvasElement.getContext("2d")
        this.#updateInterval = 1; // 10fps

        this.play();
    }

    render() {
        this.#context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.#context.beginPath();
        this.root.render(this.#context);
    }

    update() {
        Time.lap();
        Input.update();

        // go through all game objects and update
        this.root.update();
        this.root.lateUpdate();

        // + render
        this.render();
    }

    pause() {
        clearInterval(this.#updaterId);
        this.paused = true;
    }

    play() {
        Time.lap();
        this.#updaterId = setInterval(this.update.bind(this), this.#updateInterval);
        this.paused = false;
    }
}

function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
}

export const Time = new TimeManager();
export const Input = new InputManager();
export const main = new Scene();

const boundaries = new GameObject([0, 0], 1);
boundaries.name = "Boundaries"
new BoxRenderer(boundaries, [10, 600, 10, 1000], true, false);
new LineCollider(boundaries, [10, 10], [10, 600]);
new LineCollider(boundaries, [10, 10], [1000, 10]);
new LineCollider(boundaries, [1000, 600], [0, 600]);
new LineCollider(boundaries, [1000, 600], [1000, 10]);

main.root.addChild(boundaries);

// const object = new GameObject([200, 300], 100);
// object.name = "Square";
// new BoxCollider(object);
// new PhysicsComponent(object);
// new BoxRenderer(object, undefined, true, false).color = randomColor();

// main.root.addChild(object);


// const object9 = new GameObject([100, 100], 10);
// object9.name = "Square";
// new BoxCollider(object9);
// new PhysicsComponent(object9);
// new BoxRenderer(object9, undefined, true, false).color = randomColor();
// // (new CircleRenderer(object, 10)).color = "black";

// main.root.addChild(object9);

// for (let i = 1; i < 3; i++) {
//     const object2 = new GameObject([300 + Math.random() * 250, 150 + Math.random() * 250], 15);
//     object2.name = `Little Ball ${i}`;
//     (new PhysicsComponent(object2, 1));//.velocity.copyFrom([-100, 0]);
//     (new CircleRenderer(object2, 15)).color = randomColor();
//     new CircleCollider(object2);
//     main.root.addChild(object2);
// }


// const object3 = new GameObject([570, 150], 100);
// object3.name = "Ball";
// (new PhysicsComponent(object3, 40));//.velocity.copyFrom([-100, 0]);
// (new CircleRenderer(object3, 100)).color = randomColor();
// new CircleCollider(object3);
// // new Script(object3, "this.gameObject.components[0].velocity.copyFrom([10,10])", "");
// main.root.addChild(object3);

// const colliderObject = new GameObject([0, 0], 0);
// colliderObject.name = "Floor";
// // new BoxCollider(colliderObject, 500, 600, 0, 1000);
// new LineCollider(colliderObject, [10, 400], [1000, 600])
// new LineRenderer(colliderObject, [10, 400], [1000, 600]).color = "black";
// main.root.addChild(colliderObject);

const ball = new GameObject([500, 300], 15);
new CircleRenderer(ball, 15).color = "blue";
new CircleCollider(ball, 15);
new PhysicsComponent(ball);
new Script(ball, `

this.vars.set("speed", 600);
this.vars.set("v", new Vector2(0, 0));
this.vars.set("physics", this.gameObject.getComponent(PhysicsComponent))

this.vars.get("physics").velocity.copyFrom(
    new Vector2(
        Math.random()-.5, 
        Math.random()-.5
    ).normalised().product(this.vars.get("speed"))
)

this.vars.get("physics").acceleration.copyFrom([0, 1000])


`, `

const v = this.vars.get("physics").velocity.normalised()

if (!v.equals(this.vars.get("v"))) {
    // console.log(v);
    this.vars.set("v", v);
}

`);
main.root.addChild(ball);

const paddleLeft = new GameObject([100, 300]);
new BoxRenderer(paddleLeft, [50, -50, 10, -10]);
new BoxCollider(paddleLeft, 50, -50, 10, -10);
new Script(paddleLeft, "", `
if (Input.getKey("s")) this.gameObject.position.add([0, 300 * Time.deltaTime])
if (Input.getKey("w")) this.gameObject.position.add([0, -300 * Time.deltaTime])
`);
main.root.addChild(paddleLeft);

const paddleRight = new GameObject([900, 300]);
new BoxRenderer(paddleRight, [50, -50, 10, -10]);
new BoxCollider(paddleRight, 50, -50, 10, -10);
new Script(paddleRight, "", `
if (Input.getKey("ArrowDown")) this.gameObject.position.add([0, 300 * Time.deltaTime])
if (Input.getKey("ArrowUp")) this.gameObject.position.add([0, -300 * Time.deltaTime])
`);
main.root.addChild(paddleRight);


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


addEventListener("keypress", ({ key }) => {
    if (key == " ") main.paused ? main.play() : main.pause();
})

/** Export */
export {
    BoxCollider, BoxRenderer, CircleCollider, CircleRenderer, Collider, Component, GameObject, LineCollider, LineRenderer, PhysicsComponent, PolygonRenderer, Script, Vector2
};

