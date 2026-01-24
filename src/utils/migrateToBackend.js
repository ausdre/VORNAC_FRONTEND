import { getTargets as getStorageTargets } from '../services/storage';
import { createTarget } from '../api/targets';
import { createQueueItem } from '../api/queue';
import { getQueue as getStorageQueue } from '../services/storage';

const MIGRATION_KEY = 'backend_migration_completed';

export const shouldMigrate = () => {
  return !localStorage.getItem(MIGRATION_KEY);
};

export const migrateLocalStorageToBackend = async (tenantId) => {
  if (!shouldMigrate()) {
    console.log('Migration already completed');
    return { success: true, alreadyMigrated: true };
  }

  console.log('Starting migration from localStorage to backend...');

  try {
    // Migrate Targets
    const targets = getStorageTargets(tenantId);
    const targetIdMap = {}; // Map old IDs to new backend IDs

    console.log(`Migrating ${targets.length} targets...`);
    for (const target of targets) {
      try {
        const newTarget = await createTarget({
          name: target.name,
          url: target.url,
          description: target.description || ''
        });
        targetIdMap[target.id] = newTarget.id;
        console.log(`Migrated target: ${target.name}`);
      } catch (error) {
        console.error(`Failed to migrate target ${target.name}:`, error);
      }
    }

    // Migrate Queue Items
    const queueItems = getStorageQueue(tenantId);
    console.log(`Migrating ${queueItems.length} queue items...`);

    for (const item of queueItems) {
      if (item.status !== 'pending') {
        continue; // Only migrate pending items
      }

      try {
        const newTargetId = targetIdMap[item.target.id];
        if (!newTargetId) {
          console.warn(`Skipping queue item - target not found: ${item.target.name}`);
          continue;
        }

        await createQueueItem({
          target_id: newTargetId,
          target_data: item.target,
          scheduled_for: item.scheduledFor,
          priority: item.priority || 999
        });
        console.log(`Migrated queue item for: ${item.target.name}`);
      } catch (error) {
        console.error(`Failed to migrate queue item for ${item.target?.name}:`, error);
      }
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Migration completed successfully!');

    return {
      success: true,
      migratedTargets: targets.length,
      migratedQueueItems: queueItems.filter(i => i.status === 'pending').length
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
