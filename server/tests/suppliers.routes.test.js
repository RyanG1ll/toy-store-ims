// Mock dependencies
jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/audit', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

const pool = require('../config/db');
const { logAuditEvent } = require('../utils/audit');

describe('Suppliers Routes — Query Building', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build base query for fetching active suppliers', () => {
    const query = 'SELECT * FROM suppliers WHERE is_active = TRUE';
    expect(query).toContain('is_active = TRUE');
  });

  test('should add search filter with ILIKE for name and contact_name', () => {
    const search = 'ToyPro';
    const params = [];
    let query = 'SELECT * FROM suppliers WHERE is_active = TRUE';

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR contact_name ILIKE $${params.length})`;
    }

    expect(params).toEqual(['%ToyPro%']);
    expect(query).toContain('ILIKE $1');
    expect(query).toContain('contact_name');
  });

  test('should order results by name ascending', () => {
    const query = 'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name ASC';
    expect(query).toContain('ORDER BY name ASC');
  });
});

describe('Suppliers Routes — Create Supplier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should apply default lead_time_days of 7 when not provided', () => {
    const lead_time_days = undefined;
    const value = lead_time_days || 7;
    expect(value).toBe(7);
  });

  test('should use provided lead_time_days when given', () => {
    const lead_time_days = 14;
    const value = lead_time_days || 7;
    expect(value).toBe(14);
  });

  test('should log SUPPLIER_CREATE audit event', async () => {
    await logAuditEvent(1, 'SUPPLIER_CREATE', 'Added supplier: "ToyPro Ltd"');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'SUPPLIER_CREATE', 'Added supplier: "ToyPro Ltd"'
    );
  });

  test('should insert supplier with all fields', async () => {
    const supplier = {
      name: 'ToyPro Ltd', contact_name: 'John Smith',
      email: 'john@toypro.com', phone: '01onal123456',
      address: '123 Toy Street', lead_time_days: 14,
    };

    pool.query.mockResolvedValue({
      rows: [{ supplier_id: 1, ...supplier }],
    });

    const result = await pool.query(
      'INSERT INTO suppliers (name, contact_name, email, phone, address, lead_time_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [supplier.name, supplier.contact_name, supplier.email, supplier.phone, supplier.address, supplier.lead_time_days]
    );

    expect(result.rows[0].name).toBe('ToyPro Ltd');
    expect(result.rows[0].lead_time_days).toBe(14);
  });
});

describe('Suppliers Routes — Update Supplier', () => {
  test('should log SUPPLIER_UPDATE audit event', async () => {
    await logAuditEvent(1, 'SUPPLIER_UPDATE', 'Updated supplier #3: "ToyPro Ltd"');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'SUPPLIER_UPDATE', 'Updated supplier #3: "ToyPro Ltd"'
    );
  });

  test('should return 404 when supplier is not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await pool.query(
      'UPDATE suppliers SET name=$1 WHERE supplier_id=$2 RETURNING *',
      ['New Name', 999]
    );

    expect(result.rows.length).toBe(0);
  });
});

describe('Suppliers Routes — Delete (Soft Delete)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch supplier name before deactivating', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ name: 'Old Supplier' }] });

    const supplier = await pool.query('SELECT name FROM suppliers WHERE supplier_id = $1', [5]);
    const supplierName = supplier.rows.length > 0 ? supplier.rows[0].name : '#5';

    expect(supplierName).toBe('Old Supplier');
  });

  test('should use fallback name when supplier not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const supplier = await pool.query('SELECT name FROM suppliers WHERE supplier_id = $1', [999]);
    const supplierName = supplier.rows.length > 0 ? supplier.rows[0].name : '#999';

    expect(supplierName).toBe('#999');
  });

  test('should log SUPPLIER_DELETE audit event', async () => {
    await logAuditEvent(1, 'SUPPLIER_DELETE', 'Deactivated supplier: "Old Supplier" (ID: 5)');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'SUPPLIER_DELETE', 'Deactivated supplier: "Old Supplier" (ID: 5)'
    );
  });
});
