const toSerializableFormValue = (key, value) => {
  if (value instanceof File) {
    return {
      kind: "file",
      name: value.name,
      type: value.type,
      size: value.size,
      lastModified: value.lastModified,
    };
  }

  if (typeof value === "string" && (key === "variations" || key === "variants")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

export const logProductSubmissionPayload = (label, formData) => {
  if (typeof console === "undefined" || !(formData instanceof FormData)) {
    return;
  }

  const entries = Array.from(formData.entries()).map(([key, value]) => [
    key,
    toSerializableFormValue(key, value),
  ]);

  const payload = Object.fromEntries(entries);

  console.groupCollapsed(`[Product Payload] ${label}`);
  console.log("payload", payload);
  console.log("entries", entries);
  console.groupEnd();
};
