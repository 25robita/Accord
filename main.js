import { AccordObject } from "./base.js";
import { BoxCollider, BoxRenderer, CircleCollider, CircleRenderer, PhysicsComponent } from "./components.js";
import { GameObject } from "./gameobject.js";
import { TimeManager } from "./utilities.js";

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

export const Time = new TimeManager();

const main = new Scene();

const object = new GameObject([200, 300], 100);
object.name = "Ball";
const object1Physics = new PhysicsComponent(object, 2);
object1Physics.velocity.copyFrom([100, 0]);
new BoxCollider(object);
new BoxRenderer(object).color = "blue";
(new CircleRenderer(object, 10)).color = "black";

main.root.addChild(object);

const object2 = new GameObject([400, 340], 30);
object2.name = "Ball 2";
(new PhysicsComponent(object2)).velocity.copyFrom([-100, 0]);
(new CircleRenderer(object2, 30)).color = "red";
new CircleCollider(object2);

main.root.addChild(object2);

const colliderObject = new GameObject([0, 0], 0);
colliderObject.name = "Floor";
new BoxCollider(colliderObject, 600, 800, 0, 1000);
new BoxRenderer(colliderObject).color = "saddlebrown";
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