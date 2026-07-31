export type SubscriptionProductSource = {
  product_name?: string | null;
  new_product_id?: string | null;
};

// Maps RevenueCat's new_product_id (App Store/Play Store product identifiers)
// to the short plan codes used across the app. Falls back to product_name
// when there's no new_product_id, or when it isn't in this map yet.
const NEW_PRODUCT_ID_LABEL_MAP: Record<string, string> = {
  starter: 'START1M',
  'puzzle_ai:default': 'START1M',
  startery: 'START1Y',
  'puzzle_ai:yearlystarter': 'START1Y',
  pro: 'PRO1M',
  'plan_pro:pro': 'PRO1M',
  proy: 'PRO1Y',
  'plan_pro:proyearly': 'PRO1Y',
};

export const getProductLabel = (
  subscriber: SubscriptionProductSource
): string => {
  const newId = subscriber.new_product_id;
  if (!newId) return subscriber.product_name ?? '';

  return NEW_PRODUCT_ID_LABEL_MAP[newId] ?? subscriber.product_name ?? '';
};

// PRO1M / PRO1Y both contain "PRO" — Starter plans and no-plan don't.
export const isProSubscription = (subscriptionProduct?: string | null) =>
  !!subscriptionProduct?.includes('PRO');
