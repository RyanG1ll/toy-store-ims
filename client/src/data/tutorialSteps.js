const tutorialSteps = [
  {
    title: 'Welcome to Toy Store IMS!',
    icon: '👋',
    route: '/',
    content:
      'This is your Inventory Management System — a tool designed to help you track stock, manage suppliers, place orders, and make smarter decisions for your toy store.',
    details: [
      'Monitor stock levels in real time',
      'Get alerts when items are running low',
      'View forecasting recommendations based on your order history',
      'Learn inventory concepts through helpful tooltips throughout the app',
    ],
  },
  {
    title: 'Dashboard',
    icon: '📊',
    route: '/',
    content:
      'The Dashboard is your home page. It gives you a quick snapshot of how your store is doing at a glance.',
    details: [
      'See total products, suppliers, and low-stock items at the top',
      'View charts showing stock distribution by category and orders over time',
      'Use the chart filter buttons to switch between Stock, Orders, or All charts',
      'The Low Stock Alerts table shows products that need reordering',
      'Recent Orders shows your latest supplier orders and their status',
    ],
  },
  {
    title: 'Products',
    icon: '🧸',
    route: '/products',
    content:
      'The Products page is where you manage all the items in your store. You can add new toys, edit existing ones, and keep track of what you have in stock.',
    details: [
      'Click "Add Product" to create a new product with name, SKU, price, quantity, and category',
      'Use the search bar to find products by name or SKU',
      'Filter products by category using the filter buttons',
      'Click "Edit" on any product to update its details',
      'Click "Delete" to remove a product (this cannot be undone)',
      'Products highlighted in yellow are below their reorder level',
    ],
  },
  {
    title: 'Suppliers',
    icon: '🚚',
    route: '/suppliers',
    content:
      'The Suppliers page lets you manage the companies you order stock from. Each supplier can have contact details and a lead time.',
    details: [
      'Click "Add Supplier" to register a new supplier',
      'Fill in their name, contact person, email, phone, and lead time in days',
      'Lead time is how long it typically takes for their deliveries to arrive',
      'Click "Edit" to update a supplier\'s information',
      'Suppliers are linked to your orders so you can track who supplies what',
    ],
  },
  {
    title: 'Orders',
    icon: '📦',
    route: '/orders',
    content:
      'The Orders page is where you create and track purchase orders to your suppliers. This is how you restock your shelves.',
    details: [
      'Click "New Order" to create a purchase order',
      'Select a supplier, then add one or more products with quantities',
      'The cost auto-fills based on the product\'s cost price',
      'The total updates automatically as you add items',
      'Track order status: Pending → Confirmed → Shipped → Delivered',
      'Use the filter buttons to view orders by status',
    ],
  },
  {
    title: 'Forecasting',
    icon: '🔮',
    route: '/forecasting',
    content:
      'The Forecasting page uses your order history to give you smart recommendations about when and how much to reorder.',
    details: [
      'Each product card shows its current stock level and health status',
      'See monthly demand charts for the last 6 months',
      'EOQ (Economic Order Quantity) tells you the ideal order size to minimise costs',
      'Reorder Point tells you when stock is low enough to place a new order',
      'Safety Stock is extra buffer stock to prevent stockouts',
      'Look for the "?" tooltips to learn what each metric means',
    ],
  },
  {
    title: 'Messages & Notifications',
    icon: '✉️',
    route: '/notifications',
    content:
      'The Messages page shows system alerts and notifications — like low stock warnings and order updates.',
    details: [
      'Unread messages appear with a blue highlight',
      'The number badge in the navbar shows how many unread messages you have',
      'Click a notification to mark it as read',
      'Use "Mark All Read" to clear all unread notifications at once',
      'Notifications are created automatically when stock is low or orders change status',
    ],
  },
  {
    title: 'Settings',
    icon: '⚙️',
    route: '/settings',
    content:
      'The Settings page lets you personalise the app to suit your needs. All changes save automatically.',
    details: [
      'Font Size — choose from Small, Medium, Large, or Extra Large',
      'Page Zoom — shrink or enlarge the whole page layout',
      'Colour Theme — switch between Light, Dark, or High Contrast mode',
      'Reduce Motion — turn off animations if you prefer a calmer interface',
      'Underline Links — make all links visually distinct',
      'You can restart this tutorial from Settings at any time',
    ],
  },
  {
    title: 'Navigation & Signing Out',
    icon: '🧭',
    route: '/',
    content:
      'Use the navigation bar at the top to move between pages. Your username is shown in the top right.',
    details: [
      'Click any page name in the navbar to navigate there',
      'The active page is highlighted in the navbar',
      'Click "Sign Out" in the top right to log out securely',
      'Use the keyboard: press Tab to move through the navbar and Enter to select',
      'A skip link is available — press Tab on any page to skip straight to the main content',
    ],
  },
  {
    title: 'You\'re All Set!',
    icon: '🎉',
    route: '/',
    content:
      'That\'s everything you need to get started. Remember, you can always restart this tutorial from the Settings page if you need a refresher.',
    details: [
      'Look for the "?" tooltip icons throughout the app to learn about inventory concepts',
      'Check the Dashboard regularly to keep an eye on stock health',
      'Use Forecasting to make data-driven reorder decisions',
      'Explore the Settings page to make the app comfortable for you',
    ],
  },
];

export default tutorialSteps;