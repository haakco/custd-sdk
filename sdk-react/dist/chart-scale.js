import { useEffect, useRef, useState } from "react";
export const DAY_MS = 86400000;
export function parseTime(value) {
    return Date.parse(value);
}
export function scaleLinear(domain, rangeStart, rangeEnd) {
    const span = domain.end - domain.start || 1;
    return (value) => rangeStart + ((value - domain.start) / span) * (rangeEnd - rangeStart);
}
/** The extent of the finite values, padded to at least `minSpan` so a single value stays visible. */
export function domainOf(values, minSpan) {
    const finite = values.filter(Number.isFinite);
    if (finite.length === 0)
        return undefined;
    const start = Math.min(...finite);
    const end = Math.max(...finite);
    if (end - start >= minSpan)
        return { start, end };
    const centre = (start + end) / 2;
    return { start: centre - minSpan / 2, end: centre + minSpan / 2 };
}
/** Scales the span around its centre by `factor` (below 1 zooms in), kept inside `bounds`. */
export function zoomDomain(view, factor, bounds, minSpan) {
    const maxSpan = bounds.end - bounds.start;
    const span = Math.min(maxSpan, Math.max(Math.min(minSpan, maxSpan), (view.end - view.start) * factor));
    const centre = (view.start + view.end) / 2;
    return clampDomain({ start: centre - span / 2, end: centre + span / 2 }, bounds);
}
/** Moves the view by `fraction` of its span (negative is earlier), kept inside `bounds`. */
export function panDomain(view, fraction, bounds) {
    const shift = (view.end - view.start) * fraction;
    return clampDomain({ start: view.start + shift, end: view.end + shift }, bounds);
}
function clampDomain(view, bounds) {
    if (view.start < bounds.start)
        return { start: bounds.start, end: bounds.start + (view.end - view.start) };
    if (view.end > bounds.end)
        return { start: bounds.end - (view.end - view.start), end: bounds.end };
    return view;
}
export function sameDomain(left, right) {
    return left.start === right.start && left.end === right.end;
}
export function ticksOf(domain, count) {
    const step = (domain.end - domain.start) / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, index) => domain.start + step * index);
}
export function formatUtcDate(value) {
    return new Date(value).toISOString().slice(0, 10);
}
export function formatNumber(value) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function")
            return;
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);
    return reduced;
}
const TWEEN_MS = 180;
/** Eases the drawn domain towards `target`; jumps straight there when motion is reduced. */
export function useTweenedDomain(target, reducedMotion) {
    const [shown, setShown] = useState(target);
    const shownRef = useRef(target);
    shownRef.current = shown;
    const { start, end } = target;
    useEffect(() => {
        const goal = { start, end };
        if (reducedMotion || typeof requestAnimationFrame !== "function") {
            setShown(goal);
            return;
        }
        const from = shownRef.current;
        const began = performance.now();
        let frame = requestAnimationFrame(function step(now) {
            const progress = Math.min(1, (now - began) / TWEEN_MS);
            setShown({
                start: from.start + (goal.start - from.start) * progress,
                end: from.end + (goal.end - from.end) * progress,
            });
            if (progress < 1)
                frame = requestAnimationFrame(step);
        });
        return () => cancelAnimationFrame(frame);
    }, [start, end, reducedMotion]);
    return shown;
}
