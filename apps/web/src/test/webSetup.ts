import { parseHTML } from "linkedom";

const { window } = parseHTML("<!doctype html><html><body></body></html>");
Object.defineProperty(window, "location", { configurable: true, value: { protocol: "http:", host: "localhost", origin: "http://localhost", href: "http://localhost/", pathname: "/", search: "", hash: "" } });
Object.defineProperty(window, "history", { configurable: true, value: { state: null, pushState() {}, replaceState() {}, go() {} } });
Object.assign(globalThis, { window, document: window.document, HTMLElement: window.HTMLElement, Node: window.Node, Element: window.Element, Event: window.Event, CustomEvent: window.CustomEvent });
Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
