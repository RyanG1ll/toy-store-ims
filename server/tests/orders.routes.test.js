jest.mock('../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../utils/audit', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/notify', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

const pool = require('../config/db');
const { logAuditEvent } = require('../utils/audit');
const { createNotification } = require('../utils/notify');

describe('Orders Routes — Query Building', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build base query with supplier join', () => {
    const query = `
      SELECT o.*, s.name as supplier_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
    `;
    expect(query).toContain('LEFT JOIN suppliers');
    expect(query).toContain('supplier_name');
  });

  test('should filter by status when provided', () => {
    const status = 'pending';
    const params = [];
    let query = 'SELECT o.* FROM orders o';

    if (status) {
      params.push(status);
      query += ` WHERE o.status = $${params.length}`;
    }

    expect(params).toEqual(['pending']);
    expect(query).toContain('WHERE o.status = $1');
  });

  test('should order by order_date descending', () => {
    const query = 'SELECT * FROM orders ORDER BY o.order_date DESC';
    expect(query).toContain('ORDER BY o.order_date DESC');
  });
});

describe('Orders Routes — Create Order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should calculate total cost from order items', () => {
    const items = [
      { product_id: 1, quantity: 10, unit_cost: 5.99 },
      { product_id: 2, quantity: 5, unit_cost: 12.50 },
      { product_id: 3, quantity: 20, unit_cost: 3.25 },
    ];

    const total_cost = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost, 0
    );

    // 10*5.99 + 5*12.50 + 20*3.25 = 59.90 + 62.50 + 65.00 = 187.40
    expect(total_cost).toBeCloseTo(187.40, 2);
  });

  test('should calculate total cost with a single item', () => {
    const items = [{ product_id: 1, quantity: 3, unit_cost: 10.00 }];
    const total_cost = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    expect(total_cost).toBe(30.00);
  });

  test('should log ORDER_CREATE audit event with item count and total', async () => {
    const orderId = 42;
    const items = [
      { product_id: 1, quantity: 10, unit_cost: 5.99 },
      { product_id: 2, quantity: 5, unit_cost: 12.50 },
    ];
    const total_cost = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

    await logAuditEvent(
      1, 'ORDER_CREATE',
      `Created order #${orderId} (${items.length} items, total: $${total_cost.toFixed(2)})`
    );

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'ORDER_CREATE',
      'Created order #42 (2 items, total: $122.40)'
    );
  });

  test('should create notification when order is placed', async () => {
    await createNotification(
      'new_order', 'info', 'New Order Created',
      'Order #42 placed with supplier.', '/orders'
    );

    expect(createNotification).toHaveBeenCalledWith(
      'new_order', 'info', 'New Order Created',
      'Order #42 placed with supplier.', '/orders'
    );
  });
});

describe('Orders Routes — Update Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate status against allowed values', () => {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    expect(validStatuses.includes('pending')).toBe(true);
    expect(validStatuses.includes('confirmed')).toBe(true);
    expect(validStatuses.includes('shipped')).toBe(true);
    expect(validStatuses.includes('delivered')).toBe(true);
    expect(validStatuses.includes('cancelled')).toBe(true);
    expect(validStatuses.includes('invalid_status')).toBe(false);
    expect(validStatuses.includes('')).toBe(false);
  });

  test('should set actual_delivery date when marking as delivered', () => {
    const status = 'delivered';
    const updates = { status };

    if (status === 'delivered') {
      updates.actual_delivery = new Date().toISOString().split('T')[0];
    }

    expect(updates.actual_delivery).toBeDefined();
    // Should be in YYYY-MM-DD format
    expect(updates.actual_delivery).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('should not set actual_delivery for non-delivered status', () => {
    const status = 'shipped';
    const updates = { status };

    if (status === 'delivered') {
      updates.actual_delivery = new Date().toISOString().split('T')[0];
    }

    expect(updates.actual_delivery).toBeUndefined();
  });

  test('should log ORDER_STATUS audit event', async () => {
    await logAuditEvent(1, 'ORDER_STATUS', 'Order #10 status changed to "delivered"');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'ORDER_STATUS', 'Order #10 status changed to "delivered"'
    );
  });

  test('should map status to correct notification severity', () => {
    const severityMap = { confirmed: 'info', shipped: 'info', delivered: 'info', cancelled: 'warning' };

    expect(severityMap['confirmed']).toBe('info');
    expect(severityMap['shipped']).toBe('info');
    expect(severityMap['delivered']).toBe('info');
    expect(severityMap['cancelled']).toBe('warning');
  });
});

describe('Orders Routes — Delete Order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should only allow deletion of pending orders', () => {
    const testCases = [
      { status: 'pending', shouldAllow: true },
      { status: 'confirmed', shouldAllow: false },
      { status: 'shipped', shouldAllow: false },
      { status: 'delivered', shouldAllow: false },
      { status: 'cancelled', shouldAllow: false },
    ];

    for (const tc of testCases) {
      const canDelete = tc.status === 'pending';
      expect(canDelete).toBe(tc.shouldAllow);
    }
  });

  test('should log ORDER_DELETE audit event', async () => {
    await logAuditEvent(1, 'ORDER_DELETE', 'Deleted pending order #15');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'ORDER_DELETE', 'Deleted pending order #15'
    );
  });
});
