"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultOptions = {
    path: '/graphql',
};
function mergeDefaults(options, defaults = defaultOptions) {
    return Object.assign({}, defaults, options);
}
exports.mergeDefaults = mergeDefaults;
