import {
    BoxCollider,
    BoxRenderer,
    CircleCollider,
    CircleRenderer,
    Component,
    GameObject,
    LineCollider,
    LineRenderer,
    ObjectReference,
    PhysicsComponent,
    Script,
    TextRenderer,
    Vector2
} from './main.js';

/******* Utilities ********/

/**
 * 
 * @param  {...string} classes to add to the div
 * @returns {HTMLDivElement}
 */
function div(...classes) {
    const a = document.createElement("div");
    a.classList.add(...classes);
    return a;
}

/**
 * 
 * @param {string} tag 
 * @param  {...string} classes 
 * @returns {HTMLElement}
 */
function elem(tag, ...classes) {
    const a = document.createElement(tag);
    a.classList.add(...classes);
    return a;
}

/******* Hierarchy ********/

export class UI {
    /** @type {string} UUID */
    static selection;

    /** @type {((selection: string) => void)[]} */
    static selectionListeners = [];
}

/**
 * Sets the given row as the selected row
 * @param {HTMLDivElement} row 
 */
function select(row) {
    document.querySelectorAll(".row[data-selected]").forEach(i => i.removeAttribute('data-selected'));
    row.setAttribute("data-selected", "");
    UI.selection = row.closest("[data-uuid]").getAttribute("data-uuid");
    UI.selectionListeners.forEach(f => f(UI.selection));
}


function renderGameObject(uuid) {
    /** @type {GameObject} */
    const gameObject = ObjectReference.get(uuid);

    if (!gameObject)
        return null;

    const li = elem("li", "game-object", "collapsible");
    li.setAttribute("data-uuid", uuid);

    const row = div("row");
    row.draggable = true;
    const collapserParent = div("collapser-parent");
    const checkbox = elem("input", "collapser");
    checkbox.type = "checkbox";
    collapserParent.appendChild(checkbox);
    row.appendChild(collapserParent);

    const nameTag = div("name");
    nameTag.textContent = gameObject.name ?? "[unnamed GameObject]";
    console.log(gameObject.name);

    row.appendChild(nameTag);

    li.appendChild(row);

    const children = elem("ul", "game-objects", "children", "collapsible-body");
    for (let child of gameObject.children) {
        children.appendChild(renderGameObject(child.uuid));
    }

    li.appendChild(children);

    return li;
}

/**** Main ****/



/******** Inspector *********/
/**** Param utilities ****/

/**
 * 
 * @param {string} dataName 
 * @param {string} displayName 
 * @param {string} defaultValue 
 * @param {(newValue: string) => void} changeCallback
 * @returns {HTMLLIElement}
 */
function textParam(dataName, displayName, defaultValue, changeCallback) {
    const param = elem("li", "param");
    const name = div("name");
    name.setAttribute("data-name", dataName);
    name.textContent = displayName;
    param.appendChild(name);

    const value = elem("input", "value");
    value.type = "text";
    value.name = dataName;
    value.value = defaultValue;
    param.appendChild(value);

    value.addEventListener("input", () => changeCallback(value.value))

    return param;
}

/**
 * 
 * @param {string} dataName 
 * @param {string} displayName 
 * @param {number} defaultValue 
 * @param {(newValue: number) => void} changeCallback
 * @returns {HTMLLIElement}
 */
function numberParam(dataName, displayName, defaultValue, changeCallback) {
    const param = elem("li", "param");
    const name = div("name");
    name.setAttribute("data-name", dataName);
    name.textContent = displayName;
    param.appendChild(name);

    /** @type {HTMLInputElement} */
    const value = elem("input", "value");
    value.type = "number";
    value.name = dataName;
    value.valueAsNumber = defaultValue;
    param.appendChild(value);

    value.addEventListener("input", () => changeCallback(value.valueAsNumber))

    return param;
}

/**
 * 
 * @param {string} dataName 
 * @param {string} displayName 
 * @param {Vector2} defaultValue 
 * @param {(newValue: Vector2) => void} changeCallback
 * @returns {HTMLLIElement}
 */
function vec2Param(dataName, displayName, defaultValue, changeCallback) {
    const param = elem("li", "param");
    const name = div("name");
    name.setAttribute("data-name", dataName);
    name.textContent = displayName;
    param.appendChild(name);

    const value = div("vector-2", "value");

    const changeListener = () => {
        const x = Number.isNaN(valueX.valueAsNumber) ? 0 : valueX.valueAsNumber;
        const y = Number.isNaN(valueY.valueAsNumber) ? 0 : valueY.valueAsNumber;
        changeCallback(new Vector2(x, y));
    }


    const parentX = div();
    const labelX = elem("label");
    labelX.textContent = "x: ";
    parentX.appendChild(labelX);

    const valueX = elem("input", "value", "short")
    valueX.type = "number";
    valueX.name = `${dataName}_x`;
    valueX.value = defaultValue.x;
    parentX.appendChild(valueX)

    value.appendChild(parentX);

    const parentY = div();
    const labelY = elem("label");
    labelY.textContent = "y: ";
    parentY.appendChild(labelY);

    const valueY = elem("input", "value", "short")
    valueY.type = "number";
    valueY.name = `${dataName}_y`;
    valueY.value = defaultValue.y;
    parentY.appendChild(valueY)

    value.appendChild(parentY);

    valueX.addEventListener("input", changeListener);
    valueY.addEventListener("input", changeListener);

    param.appendChild(value);

    return param
}

/**
 * 
 * @param {string} dataName 
 * @param {string} displayName 
 * @param {boolean} defaultValue 
 * @param {(newValue: boolean) => void} changeCallback
 * @returns {HTMLLIElement}
 */
function checkedParam(dataName, displayName, defaultValue, changeCallback) {
    const param = elem("li", "param");
    const name = div("name");
    name.setAttribute("data-name", dataName);
    name.textContent = displayName;
    param.appendChild(name);

    /** @type {HTMLInputElement} */
    const value = elem("input", "value");
    value.type = "checkbox";
    value.name = dataName;
    value.checked = defaultValue;
    param.appendChild(value);

    value.addEventListener("input", () => changeCallback(value.checked));

    return param;
}

/**
 * 
 * @param {string} dataName 
 * @param {string} displayName 
 * @param {string} defaultValue 
 * @param {(newValue: string) => void} changeCallback
 * @returns {HTMLLIElement}
 */
function textareaParam(dataName, displayName, defaultValue, changeCallback) {
    const param = elem("li", "param");
    const name = div("name");
    name.setAttribute("data-name", dataName);
    name.textContent = displayName;
    param.appendChild(name);

    /** Yoinked from https://github.com/RPGillespie6/codemirror-quickstart/blob/master/examples/example1.html
     * Date: 11/11
     */
    const editor = div("editor", "value", "language-js", "textarea");
    const state = cm6.createEditorState(defaultValue, { oneDark: true });
    const view = cm6.createEditorView(state, editor);
    param.appendChild(editor);
    editor.addEventListener("input", () => changeCallback(view.state.doc.toString()));

    return param;
}

/**
 * @param {string} dataName 
 * @param {string} displayName 
 * @param {string[]} defaultArgs 
 * @param {string} defaultText 
 * @param {(newArgs: string[], newText: string) => void} changeCallback
 * @returns {HTMLLIElementz}
 */
function functionParam(dataName, displayName, defaultArgs, defaultText, changeCallback) {
    const param = elem("li", "param", "function-name");

    const name = div("name");
    name.setAttribute("data-name", dataName);

    const nameName = elem("span");
    nameName.textContent = displayName;
    name.appendChild(nameName);

    const args = elem("span", "function-args");

    const createArg = (name) => {

        const arg = elem("span", "function-arg")
        arg.setAttribute("contenteditable", "");
        arg.textContent = name;
        return arg;
    }

    for (let argName of [...defaultArgs]) {
        args.appendChild(createArg(argName));
    }
    if ((defaultArgs[defaultArgs.length - 1]?.trim() ?? "not nothing") != "")
        args.appendChild(createArg(" "));

    name.appendChild(args);

    param.appendChild(name);

    /** Yoinked from https://github.com/RPGillespie6/codemirror-quickstart/blob/master/examples/example1.html
     * Date: 11/11
     */
    const editor = div("editor", "value", "language-js", "textarea");
    const state = cm6.createEditorState(defaultText, { oneDark: true });
    const view = cm6.createEditorView(state, editor);
    param.appendChild(editor);

    param.addEventListener("input", () => {
        // check for new args and add an empty arg at end, or clear empty args elsewhere (only after unfocus)
        const argNames = [...param.querySelectorAll(".function-arg")].map(i => i.textContent);

        console.log(argNames);
        console.log(args);
        if (argNames.at(-1).trim() != "")
            args.appendChild(createArg(" "));

        changeCallback(argNames, view.state.doc.toString());
    })

    args.addEventListener("focusout", () => {
        param.querySelectorAll(".function-arg:not(:last-of-type)").forEach(el => {
            if (el.textContent.trim() == "") el.remove();
        })
    })

    return param;
}

/**
 * 
 * @param {string} text 
 * @param {(this: HTMLElement, ev: MouseEvent) => void} callback 
 * @returns 
 */
function paramButton(text, callback) {
    const parent = div("center");
    const button = elem("button", "inspector-button")
    button.textContent = text;
    button.addEventListener("click", callback);
    parent.appendChild(button);
    return parent;
}

/**** Render ****/

function renderComponent(uuid) {
    /** @type {Component} */
    const component = ObjectReference.get(uuid);

    const li = elem("li", "component", "collapsible");
    li.setAttribute("data-uuid", uuid);

    const titleBar = div("component-title-bar", "row");

    const collapserParent = div("collapser-parent");
    /** @type {HTMLInputElement} */
    const checkbox = elem("input", "collapser");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    collapserParent.appendChild(checkbox);

    titleBar.appendChild(collapserParent);

    const title = div("title"); // gets set below;
    title.textContent = component.constructor.name//.replace(/(?=[A-Z][a-z])/g, " ").trim();
    titleBar.appendChild(title);

    const destructor = elem("button", "flex-end", "icon");
    destructor.innerHTML = `<svg width="6" height="6" style="stroke: currentColor; stroke-width: 1.5px;"><line x1="0" x2="100%" y1="0" y2="100%"></line><line x1="0" x2="100%" y1="100%" y2="0"></line></svg>`;
    titleBar.appendChild(destructor);

    destructor.addEventListener("click", () => {
        const gameObject = component.gameObject;
        gameObject.components.splice(gameObject.components.indexOf(component), 1);
        removeComponent(component);
        li.remove();
    })

    li.appendChild(titleBar);


    const _body = div("collapsible-body", "details");

    const params = elem("ul", "params");

    _body.appendChild(params);

    li.appendChild(_body);

    if (component instanceof GameObject) {
        // title.textContent = "GameObject";

        name: {
            const param = textParam("name", "Name", component.name, n => component.name = n)
            params.appendChild(param);
        }

        position: {
            const param = vec2Param("position", "Position", component.localPosition, p => component.localPosition.copyFrom(p));
            params.appendChild(param);
        }

    } else if (component instanceof PhysicsComponent) {
        // title.textContent = "PhysicsComponent";

        mass: {
            const param = numberParam("mass", "Mass", component.mass, m => component.mass = m);
            params.appendChild(param);
        }

        velocity: {
            const param = vec2Param("velocity", "Velocity", component.velocity, v => component.velocity.copyFrom(v));
            params.appendChild(param);
        }

        acceleration: {
            const param = vec2Param("acceleration", "Acceleration", component.acceleration, a => component.acceleration.copyFrom(a));
            params.appendChild(param);
        }
    } else if (component instanceof CircleCollider) {
        // title.textContent = "CircleCollider";
        trigger: {
            const param = checkedParam("trigger", "Trigger", component.trigger, t => component.trigger = t);
            params.appendChild(param);
        }

        radius: {
            const param = numberParam("radius", "Radius", component.radius, r => component.radius = r);
            params.appendChild(param);
        }

        offset: {
            const param = vec2Param("offset", "Offset", component.offset, o => component.offset.copyFrom(o));
            params.appendChild(param);
        }
    } else if (component instanceof CircleRenderer) {
        // title.textContent = "CircleRenderer";
        radius: {
            const param = numberParam("radius", "Radius", component.radius, r => component.radius = r);
            params.appendChild(param);
        }

        color: {
            const param = textParam("color", "Color", component.color, c => component.color = c);
            params.appendChild(param);
        }
    } else if (component instanceof BoxCollider) {
        trigger: {
            const param = checkedParam("trigger", "Trigger", component.trigger, t => component.trigger = t);
            params.appendChild(param);
        }
        topLeft: {
            const param = vec2Param("topleft", "Top Left", component.topLeft, x => component.topLeft.copyFrom(x));
            params.appendChild(param);
        }
        bottomRight: {
            const param = vec2Param("bottomright", "Bottom Right", component.bottomRight, x => component.bottomRight.copyFrom(x));
            params.appendChild(param);
        }
    } else if (component instanceof BoxRenderer) {
        // title.textContent = "BoxRenderer";
        topLeft: {
            const param = vec2Param("topleft", "Top Left", new Vector2(component.Top, component.Left), ([x, y]) => { component.Top = y; component.Left = x });
            params.appendChild(param);
        }
        bottomRight: {
            const param = vec2Param("bottomright", "Bottom Right", new Vector2(component.Bottom, component.Right), ([x, y]) => { component.Bottom = y; component.Right = x });
            params.appendChild(param);
        }
        fill: {
            const param = checkedParam("fill", "Draw Fill", component.fill, f => component.fill = f)
        }
        color: {
            const param = textParam("color", "Color", component.color, c => component.color = c);
            params.appendChild(param);
        }
        edge: {
            const param = checkedParam("edge", "Draw Edge", component.edge, e => component.edge = e)
        }
        edgeColor: {
            const param = textParam("edgecolor", "Edge Color", component.edgeColor, c => component.edgeColor = c);
            params.appendChild(param);
        }
        lineWidth: {
            const param = numberParam("linewidth", "Line Width", component.lineWidth, w => component.lineWidth = w);
            params.appendChild(param);
        }
    } else if (component instanceof LineRenderer) {
        // title.textContent = "LineRenderer"
        start: {
            const param = vec2Param("start", "Start", component.startPoint, s => component.startPoint.copyFrom(s));
            params.appendChild(param);
        }
        end: {
            const param = vec2Param("finish", "Finish", component.finishPoint, f => component.finishPoint.copyFrom(f));
            params.appendChild(param);
        }
        lineWidth: {
            const param = numberParam("linewidth", "Line Width", component.width, w => component.width = w);
            params.appendChild(param);
        }
        color: {
            const param = textParam("color", "Color", component.color, c => component.color = c);
            params.appendChild(param);
        }
    } else if (component instanceof LineCollider) {
        trigger: {
            const param = checkedParam("trigger", "Trigger", component.trigger, t => component.trigger = t);
            params.appendChild(param);
        }
        start: {
            const param = vec2Param("start", "Start", component.localStartPoint, s => component.startPoint = s);
            params.appendChild(param);
        }
        end: {
            const param = vec2Param("finish", "Finish", component.localEndPoint, e => component.endPoint = e);
            params.appendChild(param);
        }
    } else if (component instanceof TextRenderer) {
        text: {
            const param = textParam("text", "Text", component.text, t => component.text = t)
            params.appendChild(param);
        }
        size: {
            const param = numberParam("size", "Size", component.size, s => component.size = s);
            params.appendChild(param);
        }
        fontFamily: {
            const param = textParam("fontfamily", "Font Family", component.fontFamily, f => component.fontFamily = f);
            params.appendChild(param);

        }
        offset: {
            const param = vec2Param("offset", "Offset", component.offset, o => component.offset.copyFrom(o));
            params.appendChild(param);

        }
        color: {
            const param = textParam("color", "Color", component.color, c => component.color = c);
            params.appendChild(param);

        }
        align: {
            const param = textParam("align", "Align", component.align, a => component.a = a);
            params.appendChild(param);

        }
        baseline: {
            const param = textParam("baseline", "Baseline", component.baseline, b => component.b = b);
            params.appendChild(param);
        }
    } else if (component instanceof Script) {
        // title.textContent = "Script";
        start: {
            const param = textareaParam("startfunction", "start()", component.functions.get("start").text, t => {
                component.functions.get('start').setText(t);
            })
            params.appendChild(param);
        }
        update: {
            const param = textareaParam("updatefunction", "update()", component.functions.get("update").text, t => {
                component.functions.get('update').setText(t);
            })
            params.appendChild(param);
        }
        // TODO: arg names
        for (let i of component.functions.entries()) {
            const [name, f] = i;
            if (name == "update" || name == "start") continue;
            const param = functionParam(`${name.toLowerCase()}function`, `${name}`, f.argNames, f.text, (a, t) => {
                f.setText(t, ...a)
            });
            params.appendChild(param);
        }

        params.after(paramButton("Add Function", () => {
            const name = prompt("Function name:");
            component.register(name, "");
            li.replaceWith(renderComponent(uuid));
        }))
    } else {
        const error = div("error")
        error.textContent = "Cannot edit component in Inspector"
        params.before(error)
    }

    return li;
}

/******** Main ********/
addEventListener("click", (event) => {
    /** @type {Element} */
    const target = event.target;

    if (target.matches(".hierarchy .row")) {
        select(target);
    } else if (target.matches(".hierarchy .row > .name")) {
        select(target.closest(".row"));
    }
})

/** @type {GameObject | null} */
let draggedObject;

addEventListener("dragstart", (event) => {
    if (!event.target.closest(".row")) return;
    draggedObject = ObjectReference.get(event.target.closest("[data-uuid]").getAttribute("data-uuid"));
})

addEventListener("dragover", (event) => {
    if (event.target.closest(".hierarchy .row")) event.preventDefault();
    event.target.closest(".game-objects");
    event.preventDefault();
})

addEventListener("drop", (event) => {

    if (event.target.closest(".hierarchy .row")) {
        /** @type {HTMLLIElement} */
        const li = event.target.closest("[data-uuid]");

        const uuid = li.getAttribute("data-uuid");
        /** @type {GameObject} */
        const object = ObjectReference.get(uuid);
        if (uuid == draggedObject.uuid) return;
        console.log(draggedObject, object);
        object.addChild(draggedObject);

    } else {
        main.root.addChild(draggedObject);
        // console.log(event.target);
    }
    // } else return;


    event.preventDefault();
    updateHierarchy();
})

UI.selectionListeners.push((uuid) => {
    /** @type {GameObject} */
    const gameObject = ObjectReference.get(uuid);

    components.replaceChildren(...[renderComponent(gameObject.uuid), ...gameObject.components.map(i => renderComponent(i.uuid))]);
})



document.getElementById("add-component").addEventListener("click", ({ clientX, clientY }) => {
    console.log("hi");
    if (!UI.selection) return;
    console.log("hi fr");
    const el = document.getElementById("component-select");
    const left = clientX,
        right = document.body.clientWidth - left,
        top = clientY,
        bottom = document.body.clientHeight - top;

    el.style.top = "unset";
    el.style.bottom = "unset";
    el.style.left = "unset";
    el.style.right = "unset";

    el.style.right = `${right}px`;

    if (el.clientHeight + top > document.body.clientHeight)
        el.style.bottom = `${bottom}px`;
    else
        el.style.top = `${top}px`;

    el.style.visibility = "";

    const close = () => {
        el.style.visibility = "hidden";
        el.style.top = "-9999px";
        el.style.left = "-9999px";
        removeEventListener("click", l);
    }

    /**
     * @param {MouseEvent} a 
     */
    const l = (a) => {
        if (!a.target.closest("#component-select") && a.target.id != "add-component") {
            return close();
        }

        /** @type {HTMLElement} */
        let item;
        if (item = a.target.closest("li")) {
            close();
            /** @type {GameObject} */
            const s = ObjectReference.get(UI.selection);
            /** @type {Component} */
            const type = window[item.textContent];
            new type(s);

            components.replaceChildren(...[renderComponent(s.uuid), ...s.components.map(i => renderComponent(i.uuid))]);
            return;
        }

    }

    addEventListener("click", l)
})

const components = document.getElementById("components");

const updateHierarchy = () => {
    const hierarchy = document.getElementById("hierarchy");

    const checkedUUIDs = [...document.querySelectorAll(".hierarchy .row input.collapser:checked")].map(i => i.closest('[data-uuid]').getAttribute("data-uuid"));

    hierarchy.replaceChildren(...main.root.children.map(({ uuid }) => renderGameObject(uuid)));

    for (let uuid of checkedUUIDs) {
        document.querySelector(`.hierarchy [data-uuid="${uuid}"] input`).checked = true;
    }
}

document.getElementById("add-gameobject").addEventListener("click", () => {
    const n = new GameObject([0, 0]);
    n.name = "New GameObject";
    main.root.addChild(n);
})

/**
 * Does not clear this object from the parent's `children` attribute
 * @param {GameObject} object 
 */
function removeObject(object) {
    ObjectReference.delete(object.uuid);

    object.children.forEach(removeObject);
    object.components.forEach(removeComponent);
}

/**
 * 
 * @param {Component} component 
 */
function removeComponent(component) {
    ObjectReference.delete(component.uuid);
    if (component instanceof Script) {
        [...component.functions.values()].forEach(i => ObjectReference.delete(i.uuid));
    }
}

addEventListener("keypress", ({ key, shiftKey, metaKey, ctrlKey, altKey }) => {
    if (key != "Backspace" || !shiftKey) return;
    if (metaKey || ctrlKey || altKey) return;
    if (!UI.selection) return;

    /** @type {GameObject} */
    const obj = ObjectReference.get(UI.selection);
    if (!obj.parent) return;
    obj.parent.children.splice(obj.parent.children.indexOf(obj), 1);
    removeObject(obj);
    obj.parent.handleChildHierarchyChange();
})

updateHierarchy();

window.main.root.hierarchyChangeListeners.push(() => {
    updateHierarchy();
})
