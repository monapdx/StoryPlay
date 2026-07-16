import {
  useEffect,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import type { UseStoryStateResult } from "../../hooks/useStoryState";
import type {
  StoryVariables,
  VariableMetaMap,
  VariablePlayerMeta,
} from "../../types/storyCore";
import {
  deleteVariableMetaKey,
  getAuthoredPlayerLabel,
  normalizeVariableMeta,
  patchVariableMeta,
  renameVariableMetaKey,
} from "../../utils/storyVariables";

export type VariableValueType = "string" | "number" | "boolean";

export interface VariableEditorProps {
  variables?: StoryVariables;
  setVariables: UseStoryStateResult["setVariables"];
  variableMeta?: VariableMetaMap;
  setVariableMeta?: UseStoryStateResult["setVariableMeta"];
  showHeading?: boolean;
}

function detectType(value: unknown): VariableValueType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function coerceValue(type: VariableValueType, rawValue: unknown): unknown {
  if (type === "boolean") return rawValue === "true" || rawValue === true;

  if (type === "number") {
    const n = Number(rawValue);
    return Number.isNaN(n) ? 0 : n;
  }

  return rawValue;
}

export default function VariableEditor({
  variables = {},
  setVariables,
  variableMeta = {},
  setVariableMeta,
  showHeading = true,
}: VariableEditorProps) {
  const entries = Object.entries(variables || {});
  const [expandedVariableKey, setExpandedVariableKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!expandedVariableKey) return;
    if (!(expandedVariableKey in (variables || {}))) {
      setExpandedVariableKey(null);
    }
  }, [variables, expandedVariableKey]);

  function addVariable() {
    let name = "variable";
    let i = 1;

    while (variables[name + i] !== undefined) i++;

    const newKey = name + i;

    setVariables({
      ...variables,
      [newKey]: "",
    });
    setExpandedVariableKey(newKey);
  }

  function removeVariable(key: string) {
    const next = { ...variables };
    delete next[key];
    setVariables(next);
    if (setVariableMeta) {
      setVariableMeta(deleteVariableMetaKey(variableMeta, key));
    }
  }

  function renameVariable(oldKey: string, newKey: string) {
    const trimmed = newKey.trim();

    if (!trimmed || trimmed === oldKey) return;
    if (variables[trimmed] !== undefined) return;

    const next: StoryVariables = {};

    for (const [k, v] of Object.entries(variables)) {
      if (k === oldKey) next[trimmed] = v;
      else next[k] = v;
    }

    setVariables(next);

    if (setVariableMeta) {
      setVariableMeta(renameVariableMetaKey(variableMeta, oldKey, trimmed));
    }

    if (expandedVariableKey === oldKey) {
      setExpandedVariableKey(trimmed);
    }
  }

  function updateVariableMetaField(
    key: string,
    field: keyof VariablePlayerMeta,
    value: string
  ) {
    if (!setVariableMeta) return;
    setVariableMeta(patchVariableMeta(variableMeta, key, { [field]: value }));
  }

  function updateVariableValue(key: string, value: unknown) {
    setVariables({
      ...variables,
      [key]: value,
    });
  }

  function changeVariableType(key: string, type: string) {
    const value = variables[key];

    let newValue: unknown = "";

    if (type === "boolean") newValue = Boolean(value);
    else if (type === "number") newValue = Number(value) || 0;
    else newValue = value?.toString() ?? "";

    setVariables({
      ...variables,
      [key]: newValue,
    });
  }

  return (
    <div className="editor-section">
      <div
        className={`editor-section-header${showHeading ? "" : " editor-section-header--tools-only"}`}
      >
        {showHeading ? <h3>Variables</h3> : null}

        <button
          type="button"
          className="toolbar-button"
          onClick={addVariable}
        >
          + Add Variable
        </button>
      </div>

      {entries.length === 0 && (
        <p className="sidebar-hint">No variables yet.</p>
      )}

      <div className="choice-list">
        {entries.map(([key, value]) => {
          const type = detectType(value);
          const isExpanded = expandedVariableKey === key;
          const playerLabel = getAuthoredPlayerLabel(key, variableMeta);
          const meta: VariablePlayerMeta =
            normalizeVariableMeta(variableMeta)[key] || {};

          return (
            <div
              key={key}
              className={`choice-row ${isExpanded ? "is-expanded" : ""}`}
            >
              <button
                type="button"
                className="collapsible-row-header"
                onClick={() => setExpandedVariableKey(key)}
                aria-expanded={isExpanded}
              >
                <span>
                  <span className="collapsible-row-title">
                    {playerLabel || key}
                  </span>
                  <span className="collapsible-row-meta">
                    {playerLabel ? `${key} · ` : ""}
                    {type}: {String(value)}
                  </span>
                </span>
                <span
                  className={`collapsible-chevron ${isExpanded ? "is-open" : ""}`}
                >
                  ▾
                </span>
              </button>

              {isExpanded && (
                <>
                  <div className="form-group">
                    <label className="form-label">Variable id</label>
                    <input
                      className="form-input"
                      defaultValue={key}
                      placeholder="Internal key"
                      onFocus={() => setExpandedVariableKey(key)}
                      onBlur={(e: FocusEvent<HTMLInputElement>) =>
                        renameVariable(key, e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Player-facing name</label>
                    <input
                      className="form-input"
                      value={meta.playerLabel || ""}
                      placeholder={key}
                      onFocus={() => setExpandedVariableKey(key)}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateVariableMetaField(
                          key,
                          "playerLabel",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Player description</label>
                    <input
                      className="form-input"
                      value={meta.playerDescription || ""}
                      placeholder="Optional"
                      onFocus={() => setExpandedVariableKey(key)}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateVariableMetaField(
                          key,
                          "playerDescription",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type</label>

                    <select
                      className="form-select"
                      value={type}
                      onFocus={() => setExpandedVariableKey(key)}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        changeVariableType(key, e.target.value)
                      }
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Value</label>

                    {type === "boolean" ? (
                      <select
                        className="form-select"
                        value={String(value)}
                        onFocus={() => setExpandedVariableKey(key)}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          updateVariableValue(
                            key,
                            coerceValue("boolean", e.target.value)
                          )
                        }
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        type={type === "number" ? "number" : "text"}
                        value={value as string | number}
                        onFocus={() => setExpandedVariableKey(key)}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateVariableValue(
                            key,
                            coerceValue(type, e.target.value)
                          )
                        }
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => removeVariable(key)}
                  >
                    Delete Variable
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
