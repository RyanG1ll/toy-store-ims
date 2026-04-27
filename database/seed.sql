-- Categories
INSERT INTO categories (name, description) VALUES
('Action Figures', 'Superhero and character figurines'),
('Board Games', 'Family and strategy board games'),
('Building Sets', 'LEGO, blocks, and construction toys'),
('Dolls', 'Fashion dolls and accessories'),
('Educational', 'Learning and STEM toys'),
('Outdoor', 'Garden and outdoor play equipment'),
('Puzzles', 'Jigsaw and brain teasers'),
('Vehicles', 'Cars, trains, and remote control'),
('Other', 'Miscellaneous and uncategorised toys');

-- Suppliers
INSERT INTO suppliers (name, contact_name, email, phone, lead_time_days) VALUES
('ToyWorld Wholesale', 'Sarah Johnson', 'sarah@toyworld.com', '07928340328', 5),
('PlayTime Distributors', 'Mike Chen', 'mike@playtime.com', '07823091234', 7),
('EduToys Direct', 'Emma Wilson', 'emma@edutoys.com', '07927985576', 10);

-- Sample products
INSERT INTO products (name, description, sku, category_id, supplier_id, unit_price, cost_price, quantity_in_stock, reorder_level, reorder_quantity, age_range) VALUES
('Superhero Action Set', '4-piece superhero figure collection', 'ACT-001', 1, 1, 14.99, 7.50, 45, 15, 50, '5-10'),
('Family Quiz Night', 'Trivia board game for all ages', 'BRD-001', 2, 2, 24.99, 12.00, 30, 10, 40, '8+'),
('Creative Building Blocks 500pc', '500 piece multi-colour block set', 'BLD-001', 3, 1, 29.99, 15.00, 60, 20, 60, '4-8'),
('Learning Tablet', 'Interactive educational tablet for kids', 'EDU-001', 5, 3, 34.99, 18.00, 25, 10, 30, '3-7'),
('Wooden Train Set', 'Classic 40-piece wooden railway', 'VEH-001', 8, 2, 39.99, 20.00, 15, 8, 25, '3-6');

-- Orders (November 2025 through April 2026, mix of statuses)
INSERT INTO orders (supplier_id, order_date, expected_delivery, status, total_cost, notes) VALUES
-- November 2025
(1, '2025-11-03', '2025-11-08', 'delivered',  750.00, 'Pre-Christmas building blocks stock-up'),
(2, '2025-11-10', '2025-11-17', 'delivered',  480.00, 'Board games for Christmas season'),
(3, '2025-11-18', '2025-11-28', 'delivered',  540.00, 'Educational tablets — holiday gift range'),
-- December 2025
(1, '2025-12-01', '2025-12-06', 'delivered',  375.00, 'Urgent superhero restock for Christmas rush'),
(2, '2025-12-05', '2025-12-12', 'delivered',  600.00, 'Extra wooden train sets for gift wrapping service'),
(3, '2025-12-10', '2025-12-20', 'delivered',  360.00, 'Learning tablets last batch before Christmas'),
-- January 2026
(1, '2026-01-08', '2026-01-13', 'delivered',  450.00, 'Post-holiday building blocks replenishment'),
(2, '2026-01-15', '2026-01-22', 'delivered',  240.00, 'January sale board game restock'),
-- February 2026
(2, '2026-02-02', '2026-02-09', 'delivered',  400.00, 'Wooden train sets — spring catalogue'),
(1, '2026-02-14', '2026-02-19', 'delivered',  225.00, 'Valentine themed action figure display'),
(3, '2026-02-20', '2026-03-02', 'cancelled',  270.00, 'Cancelled — supplier delayed beyond window'),
-- March 2026
(1, '2026-03-05', '2026-03-10', 'delivered',  900.00, 'Bulk building blocks for school programme'),
(3, '2026-03-12', '2026-03-22', 'delivered',  360.00, 'March learning tablet order'),
(2, '2026-03-20', '2026-03-27', 'delivered',  480.00, 'Easter board game promotion stock'),
-- April 2026
(1, '2026-04-02', '2026-04-07', 'shipped',    375.00, 'Superhero sets for spring half-term'),
(2, '2026-04-08', '2026-04-15', 'confirmed',  240.00, 'Family quiz night reorder'),
(1, '2026-04-14', '2026-04-19', 'confirmed',  750.00, 'Building blocks — summer prep'),
(3, '2026-04-18', '2026-04-28', 'pending',    540.00, 'Educational tablets top-up for May'),
(2, '2026-04-22', '2026-05-01', 'pending',    400.00, 'Wooden train sets running low'),
(1, '2026-04-25', '2026-05-05', 'pending',    225.00, 'Extra superhero sets for summer display');

-- Order items (matching the 20 orders above)
INSERT INTO order_items (order_id, product_id, quantity, unit_cost) VALUES
-- Nov: Order 1 — Building Blocks
(1, 3, 50, 15.00),
-- Nov: Order 2 — Family Quiz Night
(2, 2, 40, 12.00),
-- Nov: Order 3 — Learning Tablets
(3, 4, 30, 18.00),
-- Dec: Order 4 — Superhero Action Sets
(4, 1, 50, 7.50),
-- Dec: Order 5 — Wooden Train Sets
(5, 5, 30, 20.00),
-- Dec: Order 6 — Learning Tablets
(6, 4, 20, 18.00),
-- Jan: Order 7 — Building Blocks
(7, 3, 30, 15.00),
-- Jan: Order 8 — Family Quiz Night
(8, 2, 20, 12.00),
-- Feb: Order 9 — Wooden Train Sets
(9, 5, 20, 20.00),
-- Feb: Order 10 — Superhero Action Sets
(10, 1, 30, 7.50),
-- Feb: Order 11 — Learning Tablets (cancelled)
(11, 4, 15, 18.00),
-- Mar: Order 12 — Building Blocks (bulk)
(12, 3, 60, 15.00),
-- Mar: Order 13 — Learning Tablets
(13, 4, 20, 18.00),
-- Mar: Order 14 — Family Quiz Night
(14, 2, 40, 12.00),
-- Apr: Order 15 — Superhero Action Sets
(15, 1, 50, 7.50),
-- Apr: Order 16 — Family Quiz Night
(16, 2, 20, 12.00),
-- Apr: Order 17 — Building Blocks
(17, 3, 50, 15.00),
-- Apr: Order 18 — Learning Tablets
(18, 4, 30, 18.00),
-- Apr: Order 19 — Wooden Train Sets
(19, 5, 20, 20.00),
-- Apr: Order 20 — Superhero Action Sets
(20, 1, 30, 7.50);
