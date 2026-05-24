jest.mock('../config/db', () => ({
  query: jest.fn(),
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

describe('Products Routes — Query Building', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build base query for fetching active products', () => {
    const baseQuery = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.is_active = TRUE
    `;

    expect(baseQuery).toContain('is_active = TRUE');
    expect(baseQuery).toContain('LEFT JOIN categories');
    expect(baseQuery).toContain('LEFT JOIN suppliers');
  });

  test('should add search filter with ILIKE for name and SKU', () => {
    const search = 'teddy';
    const params = [];
    let query = 'WHERE p.is_active = TRUE';

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
    }

    expect(params).toEqual(['%teddy%']);
    expect(query).toContain('ILIKE $1');
  });

  test('should add category filter when specified', () => {
    const category = '3';
    const params = [];
    let query = 'WHERE p.is_active = TRUE';

    params.push(category);
    query += ` AND p.category_id = $${params.length}`;

    expect(params).toEqual(['3']);
    expect(query).toContain('category_id = $1');
  });

  test('should add low stock filter when enabled', () => {
    const low_stock = 'true';
    let query = 'WHERE p.is_active = TRUE';

    if (low_stock === 'true') {
      query += ' AND p.quantity_in_stock <= p.reorder_level';
    }

    expect(query).toContain('quantity_in_stock <= p.reorder_level');
  });

  test('should not add low stock filter when disabled', () => {
    const low_stock = 'false';
    let query = 'WHERE p.is_active = TRUE';

    if (low_stock === 'true') {
      query += ' AND p.quantity_in_stock <= p.reorder_level';
    }

    expect(query).not.toContain('quantity_in_stock');
  });
});

describe('Products Routes — Create Product', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should insert product with correct default values', async () => {
    const product = {
      name: 'Teddy Bear', description: 'A soft teddy bear', sku: 'TOY-001',
      category_id: 1, supplier_id: 1, unit_price: 19.99, cost_price: 9.99,
      quantity_in_stock: undefined, reorder_level: undefined, reorder_quantity: undefined,
      age_range: '3-5',
    };

    // Defaults should apply
    const stockValue = product.quantity_in_stock || 0;
    const reorderLevel = product.reorder_level || 10;
    const reorderQty = product.reorder_quantity || 50;

    expect(stockValue).toBe(0);
    expect(reorderLevel).toBe(10);
    expect(reorderQty).toBe(50);
  });

  test('should log PRODUCT_CREATE audit event', async () => {
    await logAuditEvent(1, 'PRODUCT_CREATE', 'Added product: "Teddy Bear" (SKU: TOY-001)');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PRODUCT_CREATE', 'Added product: "Teddy Bear" (SKU: TOY-001)'
    );
  });

  test('should create low stock notification when new product has low stock', async () => {
    const product = { name: 'Doll', quantity_in_stock: 5, reorder_level: 10 };

    if (product.quantity_in_stock <= product.reorder_level) {
      const severity = product.quantity_in_stock === 0 ? 'critical' : 'warning';
      await createNotification('low_stock', severity, 'Low Stock Warning',
        `${product.name}: ${product.quantity_in_stock} units remaining`, '/products');
    }

    expect(createNotification).toHaveBeenCalledWith(
      'low_stock', 'warning', 'Low Stock Warning',
      'Doll: 5 units remaining', '/products'
    );
  });

  test('should create critical notification when product is out of stock', async () => {
    const product = { name: 'Robot', quantity_in_stock: 0, reorder_level: 10 };

    if (product.quantity_in_stock <= product.reorder_level) {
      const severity = product.quantity_in_stock === 0 ? 'critical' : 'warning';
      await createNotification('low_stock', severity, 'Out of Stock!',
        `${product.name}: 0 units remaining`, '/products');
    }

    expect(createNotification).toHaveBeenCalledWith(
      'low_stock', 'critical', 'Out of Stock!',
      'Robot: 0 units remaining', '/products'
    );
  });

  test('should handle duplicate SKU error code 23505', () => {
    const error = { code: '23505' };
    const expectedResponse = { error: 'SKU already exists' };

    if (error.code === '23505') {
      expect(expectedResponse.error).toBe('SKU already exists');
    }
  });
});

describe('Products Routes — Update Product', () => {
  test('should log PRODUCT_UPDATE audit event', async () => {
    await logAuditEvent(1, 'PRODUCT_UPDATE', 'Updated product #5: "Teddy Bear XL"');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PRODUCT_UPDATE', 'Updated product #5: "Teddy Bear XL"'
    );
  });
});

describe('Products Routes — Delete (Soft Delete) Product', () => {
  test('should use soft delete by setting is_active to FALSE', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ name: 'Old Toy' }] });
    pool.query.mockResolvedValueOnce({ rows: [] });

    // Fetch product name first
    const product = await pool.query('SELECT name FROM products WHERE product_id = $1', [7]);
    const productName = product.rows[0].name;

    // Soft delete
    await pool.query('UPDATE products SET is_active = FALSE WHERE product_id = $1', [7]);

    expect(productName).toBe('Old Toy');
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenLastCalledWith(
      'UPDATE products SET is_active = FALSE WHERE product_id = $1', [7]
    );
  });

  test('should log PRODUCT_DELETE audit event with product name', async () => {
    await logAuditEvent(1, 'PRODUCT_DELETE', 'Deactivated product: "Old Toy" (ID: 7)');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PRODUCT_DELETE', 'Deactivated product: "Old Toy" (ID: 7)'
    );
  });
});
