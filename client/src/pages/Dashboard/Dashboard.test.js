import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';

jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../context/AccessibilityContext', () => ({
  useAccessibility: () => ({ reducedMotion: false }),
}));

jest.mock('../../hooks/useDocumentTitle', () => jest.fn());

const mockAnnounce = jest.fn();
jest.mock('../../components/LiveAnnouncer', () => ({
  useAnnounce: () => mockAnnounce,
}));

const mockGet = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() } },
  },
}));

const mockDashboardData = {
  totalProducts: 15,
  totalSuppliers: 5,
  lowStockItems: [
    { product_id: 1, name: 'Teddy Bear', sku: 'TOY-001', quantity_in_stock: 3, reorder_level: 10 },
    { product_id: 2, name: 'Lego Set', sku: 'TOY-002', quantity_in_stock: 1, reorder_level: 5 },
  ],
  recentOrders: [
    { order_id: 1, supplier_name: 'Toy World', order_date: '2026-04-20', status: 'pending', total_cost: '150.00' },
    { order_id: 2, supplier_name: 'Fun Factory', order_date: '2026-04-18', status: 'delivered', total_cost: '320.50' },
  ],
  stockByCategory: [
    { category: 'Plush', total_stock: 50 },
    { category: 'Construction', total_stock: 30 },
  ],
  ordersOverTime: [
    { month: 'Jan', order_count: 5 },
    { month: 'Feb', order_count: 8 },
  ],
  stockStatusBreakdown: {
    healthy: 10,
    low_stock: 3,
    out_of_stock: 2,
  },
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading message while data is being fetched', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<Dashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  test('loading message has aria-live attribute', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<Dashboard />);
    const loading = screen.getByText(/loading dashboard/i);
    expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  // Error handling tests

  test('shows error message when API call fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load dashboard data/i);
    });
  });

  // Successful data display tests

  test('displays stat cards with correct values', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/15 total products/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/5 total suppliers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2 low stock items/i)).toBeInTheDocument();
    });
  });

  test('displays stat card headings', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('Total Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    });
  });

  test('displays low stock alerts table', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument();
      expect(screen.getByText('Teddy Bear')).toBeInTheDocument();
      expect(screen.getByText('Lego Set')).toBeInTheDocument();
      expect(screen.getByText('TOY-001')).toBeInTheDocument();
      expect(screen.getByText('TOY-002')).toBeInTheDocument();
    });
  });

  test('displays recent orders table', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
      expect(screen.getByText('Toy World')).toBeInTheDocument();
      expect(screen.getByText('Fun Factory')).toBeInTheDocument();
      expect(screen.getByText('£150.00')).toBeInTheDocument();
      expect(screen.getByText('£320.50')).toBeInTheDocument();
    });
  });

  test('shows "No orders yet" when there are no recent orders', async () => {
    mockGet.mockResolvedValue({
      data: { ...mockDashboardData, recentOrders: [] },
    });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No orders yet.')).toBeInTheDocument();
    });
  });

  // Chart filter tests

  test('renders chart filter buttons', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('All Charts')).toBeInTheDocument();
      expect(screen.getByText('Stock Charts')).toBeInTheDocument();
      expect(screen.getByText('Order Charts')).toBeInTheDocument();
    });
  });

  test('filter buttons use aria-pressed for accessibility', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      const allBtn = screen.getByText('All Charts');
      expect(allBtn).toHaveAttribute('aria-pressed', 'true');

      const stockBtn = screen.getByText('Stock Charts');
      expect(stockBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test('clicking a filter button updates active state and announces change', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Stock Charts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Stock Charts'));

    expect(screen.getByText('Stock Charts')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('All Charts')).toHaveAttribute('aria-pressed', 'false');
    expect(mockAnnounce).toHaveBeenCalledWith('Showing Stock charts only');
  });

  // Accessibility structure tests

  test('stats grid has region role with label', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /key statistics/i })).toBeInTheDocument();
    });
  });

  test('stat numbers have accessible labels', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/15 total products/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/5 total suppliers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2 low stock items/i)).toBeInTheDocument();
    });
  });

  test('tables have screen-reader-only captions', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/products that are at or below their reorder level/i)).toBeInTheDocument();
      expect(screen.getByText(/the 5 most recent supplier orders/i)).toBeInTheDocument();
    });
  });

  test('low stock section has aria-label', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /low stock alerts/i })).toBeInTheDocument();
    });
  });

  test('recent orders section has aria-label', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /recent orders/i })).toBeInTheDocument();
    });
  });

  test('chart filter toolbar has aria-label', async () => {
    mockGet.mockResolvedValue({ data: mockDashboardData });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: /chart filter options/i })).toBeInTheDocument();
    });
  });
});
