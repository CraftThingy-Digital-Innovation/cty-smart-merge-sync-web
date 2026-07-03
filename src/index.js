/**
 * cty-smart-merge-sync-web
 * Smart Merge Collaboration Engine
 * Public-Source Corporate Royalty License (PSCRL)
 * Copyright (c) 2026 CraftThingy Digital Innovation & Alif Nurhidayat
 */

export class SmartSyncEngine extends EventTarget {
  constructor(options = {}) {
    super();
    this.fetchData = options.fetchData || null; // Async function returning remote list
    this.interval = options.interval || 4000;
    this.isPendingLocal = options.isPendingLocal || (() => false); // Check if field has pending outbox updates
    this.fields = options.fields || []; // Array of field names to merge
    
    this.timer = null;
  }

  /**
   * Starts the collaboration sync polling
   */
  start() {
    if (this.timer) return;
    
    this.timer = setInterval(async () => {
      if (typeof this.fetchData !== 'function') return;
      try {
        const remoteList = await this.fetchData();
        this.dispatchEvent(new CustomEvent('sync', { detail: remoteList }));
      } catch (err) {
        this.dispatchEvent(new CustomEvent('error', { detail: err }));
      }
    }, this.interval);
  }

  /**
   * Stops the polling
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Merges remote data changes into a local data list while protecting user input focus
   * @param {Array} localList The current local state array
   * @param {Array} remoteList The remote state array fetched from server
   * @param {object} callbacks Event handlers: { onAdd(item), onDelete(uuid), onUpdateField(uuid, field, val) }
   */
  merge(localList, remoteList, callbacks = {}) {
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const remoteUuids = remoteList.map(item => item.uuid);

    // 1. Process Deletions
    for (let i = localList.length - 1; i >= 0; i--) {
      const local = localList[i];
      // If it is saved on server, but not in remote list, and not pending local save, it was deleted
      const isSaved = local.id !== null && local.id !== undefined;
      const inRemote = remoteUuids.includes(local.uuid);
      const hasPending = this.isPendingLocal(local.uuid);

      if (isSaved && !inRemote && !hasPending) {
        localList.splice(i, 1);
        if (typeof callbacks.onDelete === 'function') {
          callbacks.onDelete(local.uuid);
        }
      }
    }

    // 2. Process Additions and Updates
    remoteList.forEach((remote) => {
      const localIdx = localList.findIndex(e => e.uuid === remote.uuid);

      if (localIdx === -1) {
        // New record added by another client
        localList.push(remote);
        if (typeof callbacks.onAdd === 'function') {
          callbacks.onAdd(remote, localList.length);
        }
      } else {
        const local = localList[localIdx];

        // Merge fields
        this.fields.forEach((field) => {
          const remoteVal = remote[field];
          
          // Focus and outbox pending check
          const isFocused = activeEl && 
                            activeEl.classList.contains(`field-${field}`) && 
                            activeEl.closest(`[data-uuid="${remote.uuid}"]`);
          const isPending = this.isPendingLocal(remote.uuid, field);

          if (!isFocused && !isPending) {
            const oldVal = local[field];
            if (oldVal !== remoteVal) {
              local[field] = remoteVal;
              if (typeof callbacks.onUpdateField === 'function') {
                callbacks.onUpdateField(remote.uuid, field, remoteVal, remote);
              }
            }
          } else {
            // Keep remote state updated in background cache but don't overwrite user's typing
            local[field] = remoteVal;
          }
        });

        // Merge non-input attributes (e.g. ID, created time, signature files)
        const metaFields = ['id', 'tanggal_input', 'foto_ttd'];
        metaFields.forEach(field => {
          if (remote.hasOwnProperty(field) && local[field] !== remote[field]) {
            local[field] = remote[field];
            if (typeof callbacks.onUpdateMeta === 'function') {
              callbacks.onUpdateMeta(remote.uuid, field, remote[field], remote);
            }
          }
        });
      }
    });

    this.dispatchEvent(new CustomEvent('merged', { detail: { localList } }));
    return localList;
  }
}

if (typeof window !== 'undefined') {
  window.SmartSyncEngine = SmartSyncEngine;
}
