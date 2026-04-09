const educationalContent = {
  eoq: {
    term: 'Economic Order Quantity (EOQ)',
    short: 'The ideal order size that minimises total inventory costs.',
    detailed: 'EOQ balances two competing costs: ordering costs (admin, shipping, processing) and holding costs (storage, insurance, depreciation). Order too often and you waste money on shipping; order too rarely and you waste money storing excess stock. The formula is: EOQ = √(2DS/H) where D = annual demand, S = cost per order, and H = holding cost per unit per year.',
    example: 'If a toy sells 1,200 units/year, costs £15 per order, and £2/year to store each unit, the EOQ = √(2 × 1200 × 15 / 2) = √18,000 ≈ 134 units per order.',
    realWorld: 'Large retailers like Argos use EOQ models to decide how much stock to order from suppliers, adjusting for seasonal demand spikes like Christmas.'
  },
  reorderQuantity: {
    term: 'Reorder Quantity',
    short: 'The amount of stock to order when reordering.',
    detailed: 'Reorder quantity is the number of units you decide to order when your stock hits the reorder point. It can be based on EOQ, a fixed quantity, or a variable amount depending on current demand and supplier constraints. The goal is to balance ordering costs with holding costs while ensuring you have enough stock to meet demand until the next order arrives.',
    example: 'If your EOQ for a popular toy is 134 units, you might set your reorder quantity to 150 to account for potential demand spikes.',
    realWorld: 'Some retailers use dynamic reorder quantities that adjust based on real-time sales data and supplier lead times, rather than a fixed number.'
  },
  reorderPoint: {
    term: 'Reorder Point (ROP)',
    short: 'The stock level at which you should place a new order.',
    detailed: 'The reorder point ensures you never run out of stock by accounting for how long it takes to receive new inventory (lead time) and how fast you sell (demand rate). It includes safety stock as a buffer against unexpected demand or delays. Formula: ROP = (Average Daily Demand × Lead Time) + Safety Stock.',
    example: 'If you sell 5 toys per day and it takes 7 days to receive an order, with safety stock of 8 units: ROP = (5 × 7) + 8 = 43 units. When stock drops to 43, place a new order.',
    realWorld: 'Supermarkets use automated reorder points — when the system detects shelf stock below the ROP, it automatically generates a purchase order.'
  },
  safetyStock: {
    term: 'Safety Stock',
    short: 'Extra inventory kept as a buffer against uncertainty.',
    detailed: 'Safety stock protects against two types of uncertainty: demand variability (customers buying more than expected) and supply variability (suppliers delivering late). Too little safety stock risks stockouts and lost sales; too much ties up cash and storage space.',
    example: 'If daily demand varies between 3–7 units with an average of 5, keeping safety stock of 8 units (about 1.5 days extra) provides a cushion against busy days.',
    realWorld: 'During COVID-19, many businesses increased their safety stock levels due to unpredictable supply chains.'
  },
  leadTime: {
    term: 'Lead Time',
    short: 'The time between placing an order and receiving it.',
    detailed: 'Lead time includes processing time (supplier prepares the order), manufacturing time (if made to order), shipping time, and receiving/inspection time. Longer or more variable lead times require higher safety stock and earlier reorder points.',
    example: 'If a toy supplier takes 2 days to process, 3 days to ship, and 1 day for you to inspect = 6 days total lead time.',
    realWorld: 'Importing toys from overseas manufacturers can have lead times of 6–12 weeks, which is why Christmas stock is ordered in summer.'
  },
  stockTurnover: {
    term: 'Stock Turnover Rate',
    short: 'How many times inventory is sold and replaced in a period.',
    detailed: 'A high turnover rate means stock sells quickly (good for perishables, trending toys). A low rate means stock sits longer (ties up cash, risks obsolescence). Formula: Turnover = Cost of Goods Sold / Average Inventory Value. Most retail businesses aim for 4–6 turns per year.',
    example: 'If annual cost of goods sold is £50,000 and average inventory is £10,000, turnover = 5 times per year, meaning stock is completely replaced roughly every 2.4 months.',
    realWorld: 'Fast-fashion retailers like Primark have turnover rates of 10+ times per year, while luxury goods stores might only turn over 2–3 times.'
  },
  abcAnalysis: {
    term: 'ABC Analysis',
    short: 'Categorising inventory by value and importance.',
    detailed: 'ABC Analysis applies the Pareto Principle (80/20 rule) to inventory: A items (top 20% of products = ~80% of revenue) get the most attention and tighter controls. B items (next 30% = ~15% of revenue) get moderate attention. C items (bottom 50% = ~5% of revenue) get minimal controls. This helps prioritise where to focus management effort.',
    example: 'In a toy store: A items might be popular LEGO sets and gaming consoles. B items might be board games and craft kits. C items might be stickers, small figurines, and party bag fillers.',
    realWorld: 'Amazon uses sophisticated ABC analysis to decide which products to stock in which warehouses and how much safety stock each needs.'
  },
  demandForecasting: {
    term: 'Demand Forecasting',
    short: 'Predicting future customer demand based on historical data.',
    detailed: 'Demand forecasting uses past sales data, trends, and seasonal patterns to estimate future demand. Methods range from simple (moving averages) to complex (machine learning). Accurate forecasts reduce both stockouts (lost sales) and overstock (wasted money). For a toy store, seasonality is critical — demand spikes massively at Christmas.',
    example: 'If LEGO City sets sold 50, 55, 60 units in Jan-Mar, a simple trend forecast might predict 65 for April. But if Easter is in April, you might adjust upward to 80.',
    realWorld: 'Toys "R" Us famously struggled with demand forecasting, often overstocking on predicted hits that flopped while understocking surprise bestsellers.'
  },
  holdingCost: {
    term: 'Holding Cost',
    short: 'The total cost of storing unsold inventory.',
    detailed: 'Holding costs typically run 20–30% of inventory value per year and include: storage space (rent, utilities), insurance, depreciation/obsolescence, opportunity cost (money tied up in stock could be invested elsewhere), and handling costs. Minimising holding costs without risking stockouts is a core IMS challenge.',
    example: 'If you hold £10,000 of toy inventory at a 25% holding cost rate, it costs £2,500/year just to store it — that is rent, insurance, and the risk of toys going out of fashion.',
    realWorld: 'This is why "just-in-time" (JIT) inventory management, pioneered by Toyota, aims to minimise holding costs by receiving goods only when needed.'
  },
  softDelete: {
    term: 'Soft Delete',
    short: 'Hiding a record instead of permanently removing it.',
    detailed: 'In database management, a soft delete marks a record as inactive (is_active = FALSE) rather than using DELETE. This preserves data integrity — existing orders that reference a discontinued product still work. It also allows recovery if something is deactivated by mistake. Hard deletes can break foreign key relationships and lose historical data.',
    example: 'When you discontinue a toy, soft deleting it keeps the product in the database for order history, but hides it from the active product list.',
    realWorld: 'Most e-commerce platforms use soft deletes — when a seller removes a listing, the data is retained for order history, analytics, and potential relisting.'
  },
  stockMovement: {
    term: 'Stock Movement',
    short: 'A record of stock coming in or going out.',
    detailed: 'Stock movements create an audit trail of every change to inventory levels. Each movement records: which product, direction (in/out), quantity, reason, and timestamp. This is essential for accountability, spotting discrepancies, and understanding stock flow patterns. Types include: purchases received, sales, returns, adjustments, and transfers.',
    example: 'When Order #15 is delivered with 100 LEGO sets, a stock movement is logged: product=LEGO City, type=in, quantity=100, reason="Order #15 delivered".',
    realWorld: 'Warehouse Management Systems (WMS) track thousands of stock movements daily, using barcode scanners to log every item picked, packed, or shelved.'
  }

};

export default educationalContent;