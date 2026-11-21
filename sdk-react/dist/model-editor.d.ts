import { type AppModelQuantity, type AppModelRangeDistribution, type AppModelVersionCreateRequest } from "@haakco/custd-sdk/browser";
import { type CSSProperties } from "react";
export type ModelEditorLabels = {
    title: string;
    name: string;
    value: string;
    valueHint: string;
    unit: string;
    description: string;
    rangeShape: string;
    distributions: Record<AppModelRangeDistribution, string>;
    bound: (source: string) => string;
    add: string;
    remove: (name: string) => string;
    note: string;
    save: string;
    saving: string;
    saved: string;
    nameInvalid: string;
    nameTaken: string;
    saveFailed: string;
};
export type ModelEditorProps = {
    /** The version being edited. Remount with a new `key` to load another version. */
    quantities: AppModelQuantity[];
    /** Saves the edited list as a new version, e.g. `appItems.addModelVersion(ownerToken, request)`. */
    onSave: (request: AppModelVersionCreateRequest) => Promise<unknown>;
    labels?: Partial<ModelEditorLabels>;
    className?: string;
    style?: CSSProperties;
};
/**
 * Edits a model's quantities in one list: name, value shorthand, unit and a Markdown description
 * shown back safely. Saving sends the whole list as a new version; the server's validation
 * message is shown on the quantity it names, or above the save button.
 */
export declare function ModelEditor({ quantities, onSave, labels: overrides, className, style }: ModelEditorProps): import("react").JSX.Element;
