type ViteImportMeta = ImportMeta & {
  env?: {
    VITE_MAD_API_BASE_URL?: string;
  };
};

const configuredBase =
  (import.meta as ViteImportMeta).env
    ?.VITE_MAD_API_BASE_URL?.trim();

export const MAD_API_BASE_URL =
  (
    configuredBase ||
    "http://127.0.0.1:3000"
  ).replace(/\/+$/, "");
