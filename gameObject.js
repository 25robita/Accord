import { AccordObject } from './base.js';
import { Component, Renderer } from './components.js';
import { Vector2 } from './utilities.js';


export class GameObject extends AccordObject {
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
        // if (this.radius) {
        //     surface.fillStyle = "blue";
        //     surface.ellipse(this.position.x, this.position.y, this.radius, this.radius, 0, 0, 180);
        //     surface.fill();
        // }

        /** @type {Renderer} */
        let renderer;
        for (renderer of this.getComponents(Renderer)) {
            surface.beginPath();
            renderer.render(surface);
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
     * @returns {T | void}
     */
    getComponent(type) {
        return this.getComponents(type).next().value;
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