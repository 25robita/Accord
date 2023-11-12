import { AccordObject } from "./base.js";
import { BoxCollider, BoxRenderer, CircleCollider, CircleRenderer, Collider, Component, LineCollider, LineRenderer, PhysicsComponent, PolygonRenderer, Script, TextRenderer } from "./components.js";
import { GameObject } from "./gameobject.js";
import { DebugManager, InputManager, TimeManager, Vector2 } from "./utilities.js";

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

export const Debug = new DebugManager();

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

    /** @type {string} */
    #background;

    /** @type {GameObject} */
    root;
    /** @type {HTMLCanvasElement} */
    canvasElement

    /** @type {string} */
    get background() {
        return this.#background
    }

    set background(value) {
        this.#background = value;

        this.canvasElement.style.backgroundColor = value;
    }

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "Scene",
            uuid: this.uuid,
            paused: this.paused,
            background: this.#background,
            root: this.root.serialize()
        }
    }


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

const gameController = new GameObject([0, 0]);
gameController.name = "GameController"
const mainScript = new Script(gameController, `
this.vars.set("scoreText", GameObject.get("Text").getComponent(TextRenderer));
this.vars.set("right", 0);
this.vars.set("left", 0);
`, ``);
mainScript.register("score", `
if (player == "left") this.vars.set("left", this.vars.get("left") + 1);
if (player == "right") this.vars.set("right", this.vars.get("right") + 1);

this.vars.get("scoreText").text = this.vars.get("left") + " – " + this.vars.get("right");
`, "player")
main.root.addChild(gameController);

const boundaries = new GameObject([0, 0], 1);
boundaries.name = "Boundaries"
new BoxRenderer(boundaries, [10, 600, 10, 1000], true, false).color = "white";
new LineCollider(boundaries, [10, 10], [10, 600]);
new LineCollider(boundaries, [10, 10], [1000, 10]);
new LineCollider(boundaries, [1000, 600], [0, 600]);
new LineCollider(boundaries, [1000, 600], [1000, 10]);

main.root.addChild(boundaries);
main.background = "black"

const ball = new GameObject([500, 300], 15);
ball.name = "Ball";
new CircleRenderer(ball, 15).color = "lime";
new CircleCollider(ball, 15);
new PhysicsComponent(ball);
const ballScript = new Script(ball, `
this.vars.set("speed", 600);
this.vars.set("v", new Vector2(0, 0));
this.vars.set("physics", this.gameObject.getComponent(PhysicsComponent))

this.invoke("reset");
`, `
const maxMagnitude = 1000;

if (this.vars.get("physics").velocity.magnitude() > maxMagnitude) {
    this.vars.get("physics").velocity.normalise();
    this.vars.get("physics").velocity.multiply(maxMagnitude);
    
}
`);

ballScript.registerListener("collider", `
if (Math.random() < 0.1)
    this.gameObject.getComponent(PhysicsComponent).acceleration.multiply([1,-1]);

`)

ballScript.register("reset", `

this.gameObject.localPosition.copyFrom([500, 300]);

this.vars.get("physics").velocity.copyFrom(
    new Vector2(
        Math.random() > 0.5 ? 1 : -1, 
        Math.random()-.5
    ).normalised().product(this.vars.get("speed"))
)

this.vars.get("physics").acceleration.copyFrom([0, 1000])
`)
main.root.addChild(ball);

const sideAcceleration = 100;

const paddles = new GameObject();
paddles.name = "Paddles";

const paddleLeft = new GameObject([100, 300]);
paddleLeft.name = "Paddle Left";
paddleLeft.tags.add("Paddle");
new BoxRenderer(paddleLeft, [50, -50, 10, -10]).color = "white";
new BoxCollider(paddleLeft, 50, -50, 10, -10);
const paddleLeftScript = new Script(paddleLeft, "", `
if (Input.getKey("s")) this.gameObject.localPosition.add([0, 750 * Time.deltaTime]);
if (Input.getKey("w")) this.gameObject.localPosition.add([0, -750 * Time.deltaTime]);
`);
const leftSideListener = `if (other.gameObject.name != "Ball") return; other.gameObject.getComponent(PhysicsComponent).acceleration.x = ${sideAcceleration};`;
paddleLeftScript.registerListener("collider", leftSideListener)
main.root.addChild(paddleLeft);

const paddleRight = new GameObject([900, 300]);
paddleRight.name = "Paddle Right";
paddleLeft.tags.add("Paddle");
new BoxRenderer(paddleRight, [50, -50, 10, -10]).color = "white";
new BoxCollider(paddleRight, 50, -50, 10, -10);
const paddleRightScript = new Script(paddleRight, "", `
if (Input.getKey("ArrowDown")) this.gameObject.localPosition.add([0, 750 * Time.deltaTime]);
if (Input.getKey("ArrowUp")) this.gameObject.localPosition.add([0, -750 * Time.deltaTime]);
`);


const rightSideListener = `if (other.gameObject.name != "Ball") return; other.gameObject.getComponent(PhysicsComponent).acceleration.x = -${sideAcceleration};`

paddleRightScript.registerListener("collider", rightSideListener)

main.root.addChild(paddleRight);

paddles.addChild(paddleLeft);
paddles.addChild(paddleRight);
main.root.addChild(paddles);
const sides = new GameObject();
sides.name = "Sides";

const leftSide = new GameObject([10, 305]);
leftSide.name = "Left Side";
leftSide.tags.add("Side");
new BoxCollider(leftSide, -295, 295, 10, 0).trigger = true;
new Script(leftSide).registerListener("collider", leftSideListener)
main.root.addChild(leftSide);

const rightSide = new GameObject([1000, 305]);
rightSide.name = "Right Side";
rightSide.tags.add("Side");
new BoxCollider(rightSide, -295, 295, -10, 0).trigger = true;
new Script(rightSide).registerListener("collider", rightSideListener);
main.root.addChild(rightSide);

sides.addChild(leftSide);
sides.addChild(rightSide);
main.root.addChild(sides);

const leftGoalListener = `
if (other.gameObject.name != "Ball") return;

other.gameObject.getComponent(Script).invoke("reset");

GameObject.get("GameController").getComponent(Script).invoke("score", "right");
`
const rightGoalListener = `
if (other.gameObject.name != "Ball") return;

other.gameObject.getComponent(Script).invoke("reset");

GameObject.get("GameController").getComponent(Script).invoke("score", "left");
`

const goals = new GameObject([0, 0]);
goals.name = "Goals";

const leftGoal = new GameObject([10, 305]);
leftGoal.name = "Left Goal";
leftGoal.tags.add("Side");
new BoxCollider(leftGoal, -100, 100, 10, 0).trigger = true;
new LineRenderer(leftGoal, [10, -100], [10, 100]).color = "red";
new Script(leftGoal).registerListener("collider", leftGoalListener)
main.root.addChild(leftGoal);

const rightGoal = new GameObject([1000, 305]);
rightGoal.name = "Right Goal"
rightGoal.tags.add("Side");
new BoxCollider(rightGoal, -100, 100, -10, 0).trigger = true;
new LineRenderer(rightGoal, [-10, -100], [-10, 100]).color = "red";
new Script(rightGoal).registerListener("collider", rightGoalListener);
main.root.addChild(rightGoal);

goals.addChild(leftGoal);
goals.addChild(rightGoal);
main.root.addChild(goals);

const text = new GameObject([500, 10]);
text.name = "Text";
const textRenderer = new TextRenderer(text, "Hello, world");
textRenderer.color = "white";
textRenderer.baseline = "top";
main.root.addChild(text);


const canvas = document.querySelector("canvas");

// function resize() {
//     const ctx = canvas.getContext("2d");
//     let image = ctx.getImageData(0, 0, canvas.width, canvas.height)
//     canvas.setAttribute("width", document.body.clientWidth.toString());
//     canvas.setAttribute("height", (document.body.clientHeight - 5).toString());
//     ctx.putImageData(image, 0, 0);

// }

// addEventListener("resize", resize);

// resize();


addEventListener("keypress", ({ key }) => {
    if (key == " ") main.paused ? main.play() : main.pause();
})

/** Export */
export {
    BoxCollider,
    BoxRenderer,
    CircleCollider,
    CircleRenderer,
    Collider,
    Component,
    GameObject,
    LineCollider,
    LineRenderer,
    PhysicsComponent,
    PolygonRenderer,
    Script,
    TextRenderer,
    Vector2
};

