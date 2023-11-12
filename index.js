(async () => {
    const _main = import("./main.js");
    Object.assign(window, await _main);
    const _ui = import("./ui.js");
    Object.assign(window, await _ui);
})();