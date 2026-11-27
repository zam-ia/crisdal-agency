import "server-only";

export function getFinanceIssuer() {
  const value = process.env.CRISDAL_ISSUER_RUC?.trim() || null;
  return {
    ruc: value && /^\d{11}$/.test(value) ? value : null,
    invalid: Boolean(value && !/^\d{11}$/.test(value)),
  };
}
