(async () => {
    const _main = import("./main.js");
    Object.assign(window, await _main);
})();