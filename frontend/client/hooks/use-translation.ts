import { ru } from "@/translations/ru";

export function useTranslation() {
  const t = (key: string, defaults?: Record<string, string>) => {
    let value: any = ru;
    const keys = key.split(".");

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return the key if not found
      }
    }

    if (typeof value === "string" && defaults) {
      let result = value;
      for (const [k, v] of Object.entries(defaults)) {
        result = result.replace(`{${k}}`, v);
      }
      return result;
    }

    return value;
  };

  return { t };
}
