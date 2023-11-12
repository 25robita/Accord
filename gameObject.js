import { AccordObject } from './base.js';
import { Component, Renderer } from './components.js';
import { ObjectReference } from './main.js';
import { Vector2 } from './utilities.js';


export class GameObject extends AccordObject {
    /** @type {Vector2} */
    localPosition;
    /** @type {Vector2} */
    get position() {
        if (this.parent)
            return this.localPosition.sum(this.parent.position);
        return this.localPosition;
    }
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
    /** @type {Set<string>} */
    tags = new Set();

    /** @type {() => {}} */
    hierarchyChangeListeners = [];

    /** @type {GameObject | null} */
    parent = null;

    /**
     * @returns {object} Object serialization for this object
     */
    serialize() {
        return {
            type: "GameObject",
            uuid: this.uuid,
            localPosition: this.localPosition.serialize(),
            radius: this.radius,
            children: this.children.map(i => i.serialize()),
            components: this.components.map(i => i.serialize()),
            name: this.name,
            tags: [...this.tags],
            parentUUID: this.parent?.uuid,
        }
    }


    /**
     * 
     * @param {Vec2Arg} position Starting position of the GameObject
     * @param {number} radius Radius of rendered circle
     */
    constructor(position, radius) {
        super();
        this.localPosition = new Vector2(position ?? [0, 0]);
        this.#previousPosition = this.localPosition.copy();

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
        /** @type {Renderer} */
        let renderer;
        for (renderer of this.getComponents(Renderer)) {
            surface.beginPath();
            renderer.render(surface);
        }

        this.children.forEach(i => i.render(surface));
    }

    handleChildHierarchyChange() {
        this.hierarchyChangeListeners.forEach(i => i());
    }

    /**
     * @param {GameObject} gameObject 
     */
    addChild(gameObject) {
        if (gameObject.parent) { // move from current parent
            const idx = gameObject.parent.children.indexOf(gameObject);
            if (idx == -1) return console.error("Could not remove gameobject from current parent")

            gameObject.parent.children.splice(idx, 1);
        }

        this.children.push(gameObject);
        gameObject.hierarchyChangeListeners.push(this.handleChildHierarchyChange.bind(this));
        this.hierarchyChangeListeners.forEach(i => i())

        gameObject.parent = this;
    }

    /**
     * Must be called in lateUpdate. Undoes any movement done this frame.
     */
    undoMovement() {
        this.localPosition.copyFrom(this.#previousPosition);
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

        this.#previousPosition.copyFrom(this.localPosition);
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

    /**
     * Retrieves a GameObject by name
     * @param {string} name Name property of GameObject
     * @returns {GameObject | undefined}
     */
    static get(name) {
        for (let o of ObjectReference.values()) {
            if (!(o instanceof GameObject)) continue;
            if (o.name == name) return o;
        }
    }

    /**
     * Retrieves GameObjects by their tag
     * @param {string} tag Tag name
     */
    static *getByTag(tag) {
        for (let o of ObjectReference.values()) {
            if (!(o instanceof GameObject)) continue;
            if (o.tags.has(tag)) yield o;
        }
    }
}