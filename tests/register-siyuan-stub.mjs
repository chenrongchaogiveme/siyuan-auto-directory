import {registerHooks} from "node:module";

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === "siyuan") {
            return {
                url: new URL("./siyuan-stub.js", import.meta.url).href,
                shortCircuit: true,
            };
        }
        return nextResolve(specifier, context);
    },
});
