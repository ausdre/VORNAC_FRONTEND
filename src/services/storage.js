/**
 * Storage Abstraction Layer für Tenant-scoped localStorage
 */

const LEGACY_KEYS = {
  targets: 'pentest_targets',
  queue: 'pentest_queue'
};

const getTenantKey = (tenantId, key) => {
  return `tenant_${tenantId}_${key}`;
};

// Migration: Einmalig legacy keys zu tenant-scoped keys verschieben
export const migrateLegacyData = (tenantId) => {
  // Targets migrieren
  const legacyTargets = localStorage.getItem(LEGACY_KEYS.targets);
  if (legacyTargets) {
    const tenantKey = getTenantKey(tenantId, 'targets');
    if (!localStorage.getItem(tenantKey)) {
      localStorage.setItem(tenantKey, legacyTargets);
      console.log(`Migrated targets to ${tenantKey}`);
    }
    localStorage.removeItem(LEGACY_KEYS.targets);
  }

  // Queue migrieren
  const legacyQueue = localStorage.getItem(LEGACY_KEYS.queue);
  if (legacyQueue) {
    const tenantKey = getTenantKey(tenantId, 'queue');
    if (!localStorage.getItem(tenantKey)) {
      localStorage.setItem(tenantKey, legacyQueue);
      console.log(`Migrated queue to ${tenantKey}`);
    }
    localStorage.removeItem(LEGACY_KEYS.queue);
  }
};

export const getTargets = (tenantId) => {
  const key = getTenantKey(tenantId, 'targets');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setTargets = (tenantId, targets) => {
  const key = getTenantKey(tenantId, 'targets');
  localStorage.setItem(key, JSON.stringify(targets));
};

export const getQueue = (tenantId) => {
  const key = getTenantKey(tenantId, 'queue');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setQueue = (tenantId, queue) => {
  const key = getTenantKey(tenantId, 'queue');
  localStorage.setItem(key, JSON.stringify(queue));
};

export const clearTenantData = (tenantId) => {
  const keys = ['targets', 'queue'];
  keys.forEach(key => {
    localStorage.removeItem(getTenantKey(tenantId, key));
  });
};
