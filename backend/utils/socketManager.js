/**
 * SIRABA ORGANIC — SOCKET.IO MANAGER
 * Centralized, multi-tenant scoped Socket.IO instance and emitter.
 * Guarantees that vendor notifications are strictly emitted to vendor-scoped rooms.
 */

'use strict';

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

/**
 * Emits a real-time event strictly to the designated vendor's private room.
 * @param {string|ObjectId} vendorId - Target vendor ID
 * @param {string} event - Event name (e.g., 'vendor:notification')
 * @param {object} payload - Notification payload
 * @returns {boolean} Whether emission succeeded
 */
const emitToVendor = (vendorId, event, payload) => {
  if (!ioInstance) {
    return false;
  }

  if (!vendorId) {
    console.warn('[SocketManager] emitToVendor called without vendorId');
    return false;
  }

  const room = `vendor:${String(vendorId)}`;
  try {
    ioInstance.to(room).emit(event, payload);
    return true;
  } catch (err) {
    console.error(`[SocketManager] Failed to emit to room ${room}:`, err.message);
    return false;
  }
};

module.exports = {
  setIO,
  getIO,
  emitToVendor,
};
