import { installBrowserTrackerFromScript } from "./browser-tracker.js";
const script = Array.from(document.scripts).find((candidate) => candidate.src === import.meta.url);
void installBrowserTrackerFromScript(script);
