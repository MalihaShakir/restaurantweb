// Rename the restaurant here — every page reads from this object.
export const BRAND = {
  name: "Maison Table",
  short: "Maison",
  tagline: "Seasonal kitchen & wine bar",
  phone: "+1 (415) 555-0142",
  email: "hello@maisontable.example",
  address: "218 Linden Street, San Francisco, CA",
  currency: "USD",
};

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: BRAND.currency }).format(n);
