"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../../lib/api";
import { getAdminToken } from "./auth";
import AdminShell from "./admin-shell";
import styles from "./admin.module.css";

type FieldConfig = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "checkbox" | "select" | "json";
  options?: Array<{ value: string; label: string }>;
  fullWidth?: boolean;
  helper?: string;
};

type ContentPageProps<T extends Record<string, unknown>> = {
  title: string;
  resourcePath: string;
  publishEntityType: "package" | "testimonial" | "doctor" | "gallery" | "homepage-section";
  createEmpty: () => T;
  fields: FieldConfig[];
  getItemId: (item: T) => string | undefined;
  getItemLabel: (item: T) => string;
  initialItems?: T[];
};

export default function ContentPage<T extends Record<string, unknown>>({
  title,
  resourcePath,
  publishEntityType,
  createEmpty,
  fields,
  getItemId,
  getItemLabel,
  initialItems = []
}: ContentPageProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draft, setDraft] = useState<T>(initialItems[0] ?? createEmpty());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useMemo(() => getAdminToken(), []);

  useEffect(() => {
    if (!token) {
      return;
    }
    apiFetch<{ data: T[] }>(resourcePath, { token })
      .then((response) => {
        const nextItems = response.data.length ? response.data : initialItems;
        setItems(nextItems);
        setDraft(nextItems[0] ?? createEmpty());
        setSelectedIndex(0);
      })
      .catch((err: Error) => {
        setError(err.message);
        setItems(initialItems);
        setDraft(initialItems[0] ?? createEmpty());
      })
      .finally(() => setLoading(false));
  }, [createEmpty, initialItems, resourcePath, token]);

  const selectedItem = items[selectedIndex];

  return (
    <AdminShell title={title}>
      <div className={styles.layoutGrid}>
        <section className={styles.listCard}>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                const next = createEmpty();
                setDraft(next);
                setSelectedIndex(-1);
                setMessage(null);
                setError(null);
              }}
            >
              New item
            </button>
          </div>
          <div className={styles.listItems}>
            {loading ? <p className={styles.helperText}>Loading…</p> : null}
            {items.map((item, index) => (
              <button
                key={getItemId(item) || `${index}-${getItemLabel(item)}`}
                type="button"
                className={`${styles.listButton} ${selectedItem === item ? styles.listButtonActive : ""}`.trim()}
                onClick={() => {
                  setSelectedIndex(index);
                  setDraft(item);
                  setMessage(null);
                  setError(null);
                }}
              >
                <strong>{getItemLabel(item)}</strong>
                <span className={styles.listMeta}>{String(item.status ?? "DRAFT")}</span>
              </button>
            ))}
            {!items.length && !loading ? <div className={styles.emptyState}>No saved items yet. Start with a new draft.</div> : null}
          </div>
        </section>

        <section className={styles.editorCard}>
          <h3>{selectedIndex === -1 ? "Create draft" : `Edit: ${getItemLabel(draft)}`}</h3>
          <div className={styles.fieldGrid}>
            {fields.map((field) => {
              const value = draft[field.key];
              const className = field.fullWidth ? styles.fieldFull : styles.field;

              return (
                <div key={field.key} className={className}>
                  <label>{field.label}</label>
                  {field.kind === "textarea" || field.kind === "json" ? (
                    <textarea
                      className={styles.textarea}
                      value={field.kind === "json" ? JSON.stringify(value ?? {}, null, 2) : String(value ?? "")}
                      onChange={(event) => {
                        const nextValue =
                          field.kind === "json" ? JSON.parse(event.target.value || "{}") : event.target.value;
                        setDraft((current) => ({ ...current, [field.key]: nextValue }));
                      }}
                    />
                  ) : field.kind === "select" ? (
                    <select
                      className={styles.select}
                      value={String(value ?? "")}
                      onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    >
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.kind === "checkbox" ? (
                    <input
                      className={styles.input}
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.checked }))}
                    />
                  ) : (
                    <input
                      className={styles.input}
                      type={field.kind === "number" ? "number" : "text"}
                      value={field.kind === "number" ? Number(value ?? 0) : String(value ?? "")}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [field.key]: field.kind === "number" ? Number(event.target.value) : event.target.value
                        }))
                      }
                    />
                  )}
                  {field.helper ? <span className={styles.helperText}>{field.helper}</span> : null}
                </div>
              );
            })}
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.button}
              onClick={async () => {
                if (!token) {
                  return;
                }
                setError(null);
                setMessage(null);
                try {
                  const response = await apiFetch<{ data: T }>(resourcePath, {
                    method: "POST",
                    token,
                    body: draft
                  });
                  const nextItems = [...items.filter((item) => getItemId(item) !== getItemId(response.data)), response.data];
                  setItems(nextItems);
                  setDraft(response.data);
                  setSelectedIndex(Math.max(nextItems.findIndex((item) => getItemId(item) === getItemId(response.data)), 0));
                  setMessage("Draft saved.");
                } catch (err) {
                  const message = err instanceof ApiError ? err.message : "Save failed.";
                  setError(message);
                }
              }}
            >
              Save draft
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={async () => {
                if (!token || !getItemId(draft)) {
                  return;
                }
                setError(null);
                setMessage(null);
                try {
                  await apiFetch<{ data: unknown }>("/api/v1/internal/content/publish", {
                    method: "POST",
                    token,
                    body: {
                      entityType: publishEntityType,
                      entityId: getItemId(draft)
                    }
                  });
                  setDraft((current) => ({ ...current, status: "PUBLISHED" }));
                  setItems((current) =>
                    current.map((item) => (getItemId(item) === getItemId(draft) ? ({ ...item, status: "PUBLISHED" } as T) : item))
                  );
                  setMessage("Published to website.");
                } catch (err) {
                  const message = err instanceof ApiError ? err.message : "Publish failed.";
                  setError(message);
                }
              }}
              disabled={!getItemId(draft)}
            >
              Publish
            </button>
          </div>

          {message ? <p className={styles.successText}>{message}</p> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
        </section>
      </div>
    </AdminShell>
  );
}
