const educationalContent = {
  reorderPoint: {
    title: "What is a Reorder Point?",
    short: "The stock level at which you should place a new order.",
    detail: "Reorder Point = (Average Daily Sales × Supplier Lead Time) + Safety Stock. "
          + "This ensures you never run out of stock while waiting for a delivery.",
    example: "If you sell 5 toys/day and your supplier takes 7 days to deliver, "
           + "with 3 days of safety stock: ROP = (5 × 7) + (5 × 3) = 50 units."
  },
  eoq: {
    title: "Economic Order Quantity (EOQ)",
    short: "The ideal number of units to order each time.",
    detail: "EOQ balances two costs: the cost of placing orders vs. the cost of holding "
          + "stock in your warehouse. Ordering too often is expensive, but so is storing too much.",
    example: "If you sell 1,000 toys/year, each order costs £25, and storing one toy costs "
           + "£2/year: EOQ = √((2 × 1000 × 25) / 2) = 158 units per order."
  },
  stockLevel: {
    title: "Stock Levels",
    short: "How many units of a product you currently have.",
    detail: "Keeping track of stock levels helps prevent two problems: stockouts (losing "
          + "sales because items are unavailable) and overstocking (tying up cash in unsold goods).",
  },
  leadTime: {
    title: "Lead Time",
    short: "How long it takes for an order to arrive from your supplier.",
    detail: "Lead time includes processing, manufacturing, and shipping. Longer lead times "
          + "mean you need to order earlier and keep more safety stock.",
  },
};

export default educationalContent;