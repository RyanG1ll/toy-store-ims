-- Categories
INSERT INTO categories (name, description) VALUES
('Action Figures', 'Superhero and character figurines'),
('Board Games', 'Family and strategy board games'),
('Building Sets', 'LEGO, blocks, and construction toys'),
('Dolls', 'Fashion dolls and accessories'),
('Educational', 'Learning and STEM toys'),
('Outdoor', 'Garden and outdoor play equipment'),
('Puzzles', 'Jigsaw and brain teasers'),
('Vehicles', 'Cars, trains, and remote control');

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
