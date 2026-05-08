// Rich seed schema for the practice "warehouse". Snowflake-flavored, SQLite-compatible.
// Designed to support easy → expert challenges across joins, windows, CTEs,
// recursion, sessionization, cohorts, transformations.

export const SEED_SQL = `
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS campaign_attribution;
DROP TABLE IF EXISTS marketing_campaigns;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS web_events;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS customers;

------------------------------------------------------------------
-- CORE COMMERCE
------------------------------------------------------------------
CREATE TABLE customers (
  customer_id   INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  country       TEXT,           -- ISO 2-letter
  city          TEXT,
  signup_date   TEXT,           -- YYYY-MM-DD
  segment       TEXT,           -- Enterprise | SMB | Consumer
  channel       TEXT,           -- organic | paid | referral | partner
  lifetime_value NUMERIC
);

CREATE TABLE products (
  product_id  INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,
  subcategory TEXT,
  price       NUMERIC,
  cost        NUMERIC,
  supplier_id INTEGER,
  launched_on TEXT
);

CREATE TABLE suppliers (
  supplier_id INTEGER PRIMARY KEY,
  name        TEXT,
  country     TEXT,
  rating      NUMERIC          -- 0..5
);

CREATE TABLE inventory (
  product_id   INTEGER REFERENCES products(product_id),
  warehouse    TEXT,            -- 'US-EAST' | 'US-WEST' | 'EU' | 'APAC'
  on_hand      INTEGER,
  reorder_point INTEGER,
  PRIMARY KEY (product_id, warehouse)
);

CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  order_date  TEXT,
  status      TEXT,             -- completed | cancelled | refunded | pending
  channel     TEXT,             -- web | mobile | partner
  total       NUMERIC,
  discount    NUMERIC
);

CREATE TABLE order_items (
  order_item_id INTEGER PRIMARY KEY,
  order_id      INTEGER REFERENCES orders(order_id),
  product_id    INTEGER REFERENCES products(product_id),
  quantity      INTEGER,
  unit_price    NUMERIC
);

CREATE TABLE payments (
  payment_id  INTEGER PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(order_id),
  method      TEXT,             -- card | paypal | ach | gift
  amount      NUMERIC,
  paid_at     TEXT
);

CREATE TABLE refunds (
  refund_id   INTEGER PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(order_id),
  amount      NUMERIC,
  reason      TEXT,
  refunded_at TEXT
);

CREATE TABLE reviews (
  review_id   INTEGER PRIMARY KEY,
  product_id  INTEGER REFERENCES products(product_id),
  customer_id INTEGER REFERENCES customers(customer_id),
  rating      INTEGER,          -- 1..5
  body        TEXT,
  created_at  TEXT
);

------------------------------------------------------------------
-- ORG / HR
------------------------------------------------------------------
CREATE TABLE departments (
  department_id INTEGER PRIMARY KEY,
  name          TEXT,
  cost_center   TEXT
);

CREATE TABLE employees (
  employee_id   INTEGER PRIMARY KEY,
  name          TEXT,
  email         TEXT,
  department_id INTEGER REFERENCES departments(department_id),
  manager_id    INTEGER REFERENCES employees(employee_id),
  title         TEXT,
  hire_date     TEXT,
  salary        NUMERIC,
  is_active     INTEGER          -- 0/1
);

------------------------------------------------------------------
-- GROWTH / MARKETING / WEB
------------------------------------------------------------------
CREATE TABLE marketing_campaigns (
  campaign_id INTEGER PRIMARY KEY,
  name        TEXT,
  channel     TEXT,             -- google | meta | email | tiktok | partner
  start_date  TEXT,
  end_date    TEXT,
  spend       NUMERIC
);

CREATE TABLE campaign_attribution (
  attribution_id INTEGER PRIMARY KEY,
  customer_id    INTEGER REFERENCES customers(customer_id),
  campaign_id    INTEGER REFERENCES marketing_campaigns(campaign_id),
  touched_at     TEXT,
  position       TEXT             -- first | mid | last
);

CREATE TABLE subscriptions (
  subscription_id INTEGER PRIMARY KEY,
  customer_id     INTEGER REFERENCES customers(customer_id),
  plan            TEXT,            -- Free | Pro | Team | Enterprise
  mrr             NUMERIC,
  started_on      TEXT,
  cancelled_on    TEXT
);

CREATE TABLE web_events (
  event_id    INTEGER PRIMARY KEY,
  customer_id INTEGER,
  session_id  TEXT,
  event_type  TEXT,                -- page_view | add_to_cart | checkout | purchase | signup | login
  event_time  TEXT,
  page        TEXT,
  device      TEXT                 -- desktop | mobile | tablet
);

------------------------------------------------------------------
-- DATA
------------------------------------------------------------------
INSERT INTO suppliers VALUES
 (1,'Nordic Textiles','SE',4.7),
 (2,'Pacific Goods','JP',4.4),
 (3,'Andes Crafts','PE',4.1),
 (4,'Atlas Hardware','DE',4.6),
 (5,'Sahara Components','MA',3.9);

INSERT INTO customers VALUES
 (1,'Ada Lovelace','ada@example.com','UK','London','2023-01-15','Enterprise','organic',5400),
 (2,'Linus Torvalds','linus@example.com','FI','Helsinki','2023-02-08','SMB','organic',820),
 (3,'Grace Hopper','grace@example.com','US','Arlington','2023-03-20','Enterprise','referral',7200),
 (4,'Alan Turing','alan@example.com','UK','Manchester','2023-04-11','SMB','paid',310),
 (5,'Margaret Hamilton','margaret@example.com','US','Boston','2023-05-02','Consumer','paid',640),
 (6,'Dennis Ritchie','dennis@example.com','US','Murray Hill','2023-06-19','Consumer','organic',290),
 (7,'Barbara Liskov','barbara@example.com','US','Cambridge','2023-07-22','Enterprise','partner',9100),
 (8,'Ken Thompson','ken@example.com','US','Mountain View','2023-08-30','SMB','organic',1200),
 (9,'Donald Knuth','don@example.com','US','Stanford','2023-09-12','Enterprise','referral',6800),
 (10,'Edsger Dijkstra','ed@example.com','NL','Eindhoven','2023-10-05','SMB','paid',980),
 (11,'Tim Berners-Lee','tim@example.com','UK','Oxford','2023-11-02','Enterprise','partner',4400),
 (12,'Vint Cerf','vint@example.com','US','Reston','2023-11-18','Enterprise','organic',5100),
 (13,'Radia Perlman','radia@example.com','US','Seattle','2023-12-03','SMB','paid',720),
 (14,'Hedy Lamarr','hedy@example.com','AT','Vienna','2024-01-10','Consumer','paid',180),
 (15,'Claude Shannon','claude@example.com','US','Petoskey','2024-01-22','Enterprise','referral',6300),
 (16,'Katherine Johnson','katherine@example.com','US','Hampton','2024-02-14','Consumer','organic',410),
 (17,'Tony Hoare','tony@example.com','UK','Belfast','2024-02-28','SMB','paid',850),
 (18,'Niklaus Wirth','niklaus@example.com','CH','Zurich','2024-03-15','SMB','organic',940),
 (19,'Bjarne Stroustrup','bjarne@example.com','DK','Aarhus','2024-04-04','Enterprise','partner',5800),
 (20,'Yukihiro Matsumoto','matz@example.com','JP','Tokyo','2024-04-22','SMB','organic',1100),
 (21,'Guido van Rossum','guido@example.com','NL','Haarlem','2024-05-09','Enterprise','referral',6600),
 (22,'James Gosling','james@example.com','CA','Calgary','2024-05-26','SMB','paid',780),
 (23,'Anders Hejlsberg','anders@example.com','DK','Copenhagen','2024-06-12','Enterprise','organic',5200),
 (24,'Brendan Eich','brendan@example.com','US','Mountain View','2024-06-30','SMB','paid',690),
 (25,'Rasmus Lerdorf','rasmus@example.com','DK','Copenhagen','2024-07-15','Consumer','organic',230),
 (26,'Joe Armstrong','joe@example.com','SE','Stockholm','2024-08-04','SMB','referral',870),
 (27,'Rich Hickey','rich@example.com','US','Raleigh','2024-08-22','SMB','organic',910),
 (28,'Sophie Wilson','sophie@example.com','UK','Cambridge','2024-09-09','Enterprise','partner',4900),
 (29,'Adele Goldberg','adele@example.com','US','Palo Alto','2024-10-01','Enterprise','referral',5500),
 (30,'Frances Allen','frances@example.com','US','Peru NY','2024-10-19','Consumer','paid',360);

INSERT INTO products VALUES
 (1,'Snow Boots','Apparel','Footwear',120,55,1,'2023-01-01'),
 (2,'Data Mug','Merch','Drinkware',18,4,2,'2023-01-15'),
 (3,'Query Hoodie','Apparel','Tops',65,22,1,'2023-02-01'),
 (4,'Warehouse Backpack','Bags','Backpacks',95,40,3,'2023-02-20'),
 (5,'CTE Cap','Apparel','Headwear',28,9,1,'2023-03-05'),
 (6,'Lateral Lamp','Home','Lighting',75,30,4,'2023-03-22'),
 (7,'Window Frame','Home','Decor',210,90,4,'2023-04-10'),
 (8,'Join Journal','Stationery','Notebooks',22,6,2,'2023-05-01'),
 (9,'Index Pen','Stationery','Pens',9,2,2,'2023-05-15'),
 (10,'Pivot Plate','Home','Kitchen',45,18,4,'2023-06-02'),
 (11,'Schema Scarf','Apparel','Accessories',38,14,1,'2023-06-25'),
 (12,'Trigger Tee','Apparel','Tops',32,11,1,'2023-07-12'),
 (13,'Aggregate Apron','Apparel','Accessories',42,16,3,'2023-08-01'),
 (14,'Recursive Ring','Jewelry','Rings',180,70,5,'2023-08-20'),
 (15,'Cardinal Cup','Merch','Drinkware',14,3,2,'2023-09-08'),
 (16,'Histogram Hat','Apparel','Headwear',36,12,1,'2023-09-25'),
 (17,'Buffer Bag','Bags','Totes',55,22,3,'2023-10-12'),
 (18,'Rollup Rug','Home','Decor',260,110,4,'2023-11-01'),
 (19,'Sample Socks','Apparel','Footwear',16,5,1,'2023-11-22'),
 (20,'Clustered Clock','Home','Decor',140,55,4,'2023-12-15');

INSERT INTO inventory VALUES
 (1,'US-EAST',120,40),(1,'US-WEST',60,40),(1,'EU',45,30),(1,'APAC',20,20),
 (2,'US-EAST',300,100),(2,'EU',150,80),
 (3,'US-EAST',80,40),(3,'EU',55,30),(3,'APAC',12,20),
 (4,'US-EAST',55,30),(4,'US-WEST',40,30),(4,'EU',22,20),
 (5,'US-EAST',200,80),(5,'EU',95,50),
 (6,'US-EAST',35,20),(6,'EU',18,15),
 (7,'US-EAST',12,10),(7,'EU',9,10),
 (8,'US-EAST',180,80),(9,'US-EAST',420,150),
 (10,'US-EAST',60,30),(10,'EU',30,20),
 (11,'US-EAST',40,25),(12,'US-EAST',90,40),
 (13,'US-EAST',50,25),(14,'US-WEST',8,10),
 (15,'US-EAST',260,100),(16,'US-EAST',75,40),
 (17,'US-EAST',45,25),(18,'EU',6,10),
 (19,'US-EAST',300,120),(20,'US-EAST',18,15);

-- 60 orders spanning 2024-01..2024-10
INSERT INTO orders VALUES
 (1001,1,'2024-01-05','completed','web',183,0),
 (1002,2,'2024-01-12','completed','web',65,0),
 (1003,3,'2024-01-19','completed','partner',330,10),
 (1004,4,'2024-01-26','cancelled','web',95,0),
 (1005,1,'2024-02-02','completed','mobile',56,0),
 (1006,5,'2024-02-08','completed','web',120,5),
 (1007,7,'2024-02-15','completed','web',285,0),
 (1008,3,'2024-02-22','completed','partner',75,0),
 (1009,8,'2024-03-01','completed','web',46,0),
 (1010,9,'2024-03-08','completed','web',420,20),
 (1011,2,'2024-03-15','refunded','web',18,0),
 (1012,10,'2024-03-22','completed','mobile',155,0),
 (1013,1,'2024-03-29','completed','web',95,0),
 (1014,6,'2024-04-04','completed','web',28,0),
 (1015,11,'2024-04-09','completed','partner',260,10),
 (1016,12,'2024-04-14','completed','web',180,0),
 (1017,13,'2024-04-19','completed','mobile',42,0),
 (1018,7,'2024-04-25','completed','web',330,15),
 (1019,15,'2024-05-01','completed','web',140,0),
 (1020,4,'2024-05-06','completed','web',74,0),
 (1021,3,'2024-05-12','completed','partner',512,30),
 (1022,17,'2024-05-18','completed','web',60,0),
 (1023,1,'2024-05-24','completed','mobile',38,0),
 (1024,18,'2024-05-30','completed','web',155,0),
 (1025,9,'2024-06-04','completed','web',290,10),
 (1026,19,'2024-06-09','completed','partner',420,20),
 (1027,5,'2024-06-15','completed','mobile',56,0),
 (1028,21,'2024-06-21','completed','web',310,0),
 (1029,2,'2024-06-27','refunded','web',32,0),
 (1030,11,'2024-07-02','completed','web',95,0),
 (1031,7,'2024-07-08','completed','partner',225,5),
 (1032,22,'2024-07-13','completed','mobile',74,0),
 (1033,1,'2024-07-19','completed','web',120,0),
 (1034,23,'2024-07-25','completed','web',380,15),
 (1035,12,'2024-07-30','completed','web',45,0),
 (1036,15,'2024-08-04','completed','partner',260,10),
 (1037,8,'2024-08-09','completed','web',42,0),
 (1038,3,'2024-08-15','completed','mobile',95,0),
 (1039,24,'2024-08-21','completed','web',180,0),
 (1040,7,'2024-08-27','completed','partner',515,30),
 (1041,9,'2024-09-02','completed','web',140,0),
 (1042,1,'2024-09-08','completed','mobile',56,0),
 (1043,26,'2024-09-13','completed','web',88,0),
 (1044,10,'2024-09-19','cancelled','web',60,0),
 (1045,11,'2024-09-25','completed','partner',310,10),
 (1046,27,'2024-09-30','completed','web',74,0),
 (1047,15,'2024-10-05','completed','mobile',180,0),
 (1048,3,'2024-10-10','completed','partner',420,20),
 (1049,28,'2024-10-15','completed','web',145,0),
 (1050,2,'2024-10-19','completed','web',32,0),
 (1051,1,'2024-10-22','completed','web',95,0),
 (1052,7,'2024-10-25','completed','partner',280,10),
 (1053,29,'2024-10-27','completed','mobile',310,0),
 (1054,12,'2024-10-28','completed','web',56,0),
 (1055,17,'2024-10-29','completed','web',180,0),
 (1056,21,'2024-10-30','completed','web',420,15),
 (1057,9,'2024-10-30','completed','partner',95,0),
 (1058,4,'2024-10-30','refunded','web',45,0),
 (1059,30,'2024-10-31','completed','web',64,0),
 (1060,11,'2024-10-31','completed','mobile',290,10);

INSERT INTO order_items VALUES
 (1,1001,1,1,120),(2,1001,5,1,28),(3,1001,2,2,18),
 (4,1002,3,1,65),
 (5,1003,7,1,210),(6,1003,1,1,120),
 (7,1004,4,1,95),
 (8,1005,5,2,28),
 (9,1006,1,1,120),
 (10,1007,7,1,210),(11,1007,3,1,65),(12,1007,2,1,18),
 (13,1008,6,1,75),
 (14,1009,5,1,28),(15,1009,2,1,18),
 (16,1010,7,2,210),
 (17,1011,2,1,18),
 (18,1012,4,1,95),(19,1012,6,1,75),
 (20,1013,1,1,120),
 (21,1014,5,1,28),
 (22,1015,18,1,260),
 (23,1016,14,1,180),
 (24,1017,13,1,42),
 (25,1018,7,1,210),(26,1018,4,1,95),(27,1018,5,1,28),
 (28,1019,20,1,140),
 (29,1020,3,1,65),(30,1020,9,1,9),
 (31,1021,7,2,210),(32,1021,11,1,38),(33,1021,17,1,55),
 (34,1022,17,1,55),(35,1022,9,1,9),
 (36,1023,11,1,38),
 (37,1024,12,1,32),(38,1024,8,1,22),(39,1024,10,1,45),(40,1024,15,4,14),
 (41,1025,18,1,260),(42,1025,11,1,38),
 (43,1026,7,2,210),
 (44,1027,5,2,28),
 (45,1028,7,1,210),(46,1028,16,1,36),(47,1028,12,2,32),
 (48,1029,12,1,32),
 (49,1030,4,1,95),
 (50,1031,7,1,210),(51,1031,15,1,14),
 (52,1032,3,1,65),(53,1032,9,1,9),
 (54,1033,1,1,120),
 (55,1034,18,1,260),(56,1034,11,1,38),(57,1034,12,2,32),(58,1034,15,1,14),
 (59,1035,10,1,45),
 (60,1036,18,1,260),
 (61,1037,12,1,32),(62,1037,9,1,9),
 (63,1038,4,1,95),
 (64,1039,14,1,180),
 (65,1040,7,2,210),(66,1040,3,1,65),
 (67,1041,20,1,140),
 (68,1042,5,2,28),
 (69,1043,17,1,55),(70,1043,8,1,22),(71,1043,9,1,9),
 (72,1044,6,1,75),
 (73,1045,7,1,210),(74,1045,18,1,260) /* mixed */,
 (75,1046,3,1,65),(76,1046,9,1,9),
 (77,1047,14,1,180),
 (78,1048,7,2,210),
 (79,1049,20,1,140),
 (80,1050,12,1,32),
 (81,1051,4,1,95),
 (82,1052,7,1,210),(83,1052,16,2,36),
 (84,1053,7,1,210),(85,1053,4,1,95),
 (86,1054,5,2,28),
 (87,1055,14,1,180),
 (88,1056,7,2,210),
 (89,1057,4,1,95),
 (90,1058,10,1,45),
 (91,1059,17,1,55),
 (92,1060,18,1,260),(93,1060,15,2,14);

INSERT INTO payments VALUES
 (1,1001,'card',183,'2024-01-05'),(2,1002,'paypal',65,'2024-01-12'),
 (3,1003,'card',320,'2024-01-19'),(4,1005,'card',56,'2024-02-02'),
 (5,1006,'card',115,'2024-02-08'),(6,1007,'card',285,'2024-02-15'),
 (7,1008,'paypal',75,'2024-02-22'),(8,1009,'card',46,'2024-03-01'),
 (9,1010,'ach',400,'2024-03-08'),(10,1011,'card',18,'2024-03-15'),
 (11,1012,'card',155,'2024-03-22'),(12,1013,'card',95,'2024-03-29'),
 (13,1014,'card',28,'2024-04-04'),(14,1015,'ach',250,'2024-04-09'),
 (15,1016,'card',180,'2024-04-14'),(16,1017,'paypal',42,'2024-04-19'),
 (17,1018,'card',315,'2024-04-25'),(18,1019,'card',140,'2024-05-01'),
 (19,1020,'card',74,'2024-05-06'),(20,1021,'ach',482,'2024-05-12'),
 (21,1022,'card',60,'2024-05-18'),(22,1023,'gift',38,'2024-05-24'),
 (23,1024,'card',155,'2024-05-30'),(24,1025,'card',280,'2024-06-04'),
 (25,1026,'ach',400,'2024-06-09'),(26,1027,'card',56,'2024-06-15'),
 (27,1028,'card',310,'2024-06-21'),(28,1029,'paypal',32,'2024-06-27'),
 (29,1030,'card',95,'2024-07-02'),(30,1031,'card',220,'2024-07-08'),
 (31,1032,'paypal',74,'2024-07-13'),(32,1033,'card',120,'2024-07-19'),
 (33,1034,'ach',365,'2024-07-25'),(34,1035,'card',45,'2024-07-30'),
 (35,1036,'ach',250,'2024-08-04'),(36,1037,'card',42,'2024-08-09'),
 (37,1038,'card',95,'2024-08-15'),(38,1039,'card',180,'2024-08-21'),
 (39,1040,'ach',485,'2024-08-27'),(40,1041,'card',140,'2024-09-02'),
 (41,1042,'card',56,'2024-09-08'),(42,1043,'paypal',88,'2024-09-13'),
 (43,1045,'ach',300,'2024-09-25'),(44,1046,'card',74,'2024-09-30'),
 (45,1047,'card',180,'2024-10-05'),(46,1048,'ach',400,'2024-10-10'),
 (47,1049,'card',145,'2024-10-15'),(48,1050,'paypal',32,'2024-10-19'),
 (49,1051,'card',95,'2024-10-22'),(50,1052,'card',270,'2024-10-25'),
 (51,1053,'card',310,'2024-10-27'),(52,1054,'card',56,'2024-10-28'),
 (53,1055,'card',180,'2024-10-29'),(54,1056,'ach',405,'2024-10-30'),
 (55,1057,'card',95,'2024-10-30'),(56,1059,'card',64,'2024-10-31'),
 (57,1060,'ach',280,'2024-10-31');

INSERT INTO refunds VALUES
 (1,1011,18,'item not as described','2024-03-20'),
 (2,1029,32,'changed mind','2024-07-01'),
 (3,1058,45,'damaged','2024-11-02');

INSERT INTO reviews VALUES
 (1,1,1,5,'Warm and stylish','2024-01-20'),
 (2,3,2,4,'Comfy hoodie','2024-01-25'),
 (3,7,3,5,'Beautiful frame','2024-02-01'),
 (4,5,1,4,'Great cap','2024-02-12'),
 (5,4,4,2,'Strap broke','2024-02-20'),
 (6,7,7,5,'Stunning','2024-02-28'),
 (7,1,5,3,'Runs small','2024-03-10'),
 (8,18,11,5,'Beautiful rug','2024-04-12'),
 (9,14,12,4,'Elegant ring','2024-04-18'),
 (10,20,15,5,'Love the clock','2024-05-04'),
 (11,7,3,5,'Bought another','2024-05-18'),
 (12,11,1,3,'Color slightly off','2024-05-30'),
 (13,17,17,4,'Great tote','2024-05-22'),
 (14,12,18,4,'Nice tee','2024-06-02'),
 (15,18,9,5,'Worth it','2024-06-08'),
 (16,7,19,5,'Perfect','2024-06-12'),
 (17,5,21,4,'Cap fits well','2024-06-22'),
 (18,4,11,3,'Okay','2024-07-04'),
 (19,18,15,5,'Best rug','2024-08-06'),
 (20,7,29,5,'Wow','2024-10-28'),
 (21,14,3,2,'Loose','2024-10-12'),
 (22,18,3,5,'Stunning again','2024-10-12'),
 (23,20,17,4,'Sleek','2024-10-30');

INSERT INTO departments VALUES
 (1,'Engineering','CC-100'),
 (2,'Sales','CC-200'),
 (3,'Marketing','CC-300'),
 (4,'Data','CC-400'),
 (5,'Operations','CC-500');

INSERT INTO employees VALUES
 (1,'Sam Cole',NULL,NULL,NULL,'CEO','2020-01-01',250000,1),
 (2,'Alice Kim','alice@co','1',1,'Engineering Manager','2020-06-01',160000,1),
 (3,'Bob Patel','bob@co',1,2,'Senior Engineer','2021-03-10',135000,1),
 (4,'Carol Diaz','carol@co',1,2,'Senior Engineer','2021-09-22',128000,1),
 (5,'Dave Murphy','dave@co',2,1,'Sales Manager','2022-02-14',120000,1),
 (6,'Eve Nakamura','eve@co',2,5,'Account Executive','2022-08-30',92000,1),
 (7,'Frank Owusu','frank@co',3,1,'Marketing Director','2023-01-05',128000,1),
 (8,'Gina Rossi','gina@co',4,1,'Head of Data','2023-04-18',155000,1),
 (9,'Hank Lee','hank@co',4,8,'Data Engineer','2023-11-01',115000,1),
 (10,'Ivy Chen','ivy@co',1,3,'Engineer II','2024-02-12',105000,1),
 (11,'Jamal King','jamal@co',1,3,'Engineer II','2024-03-04',104000,1),
 (12,'Kara Singh','kara@co',2,5,'AE','2024-04-22',88000,1),
 (13,'Leo Park','leo@co',3,7,'Growth Marketer','2024-05-30',92000,1),
 (14,'Mia Brown','mia@co',4,8,'Analytics Engineer','2024-06-18',112000,1),
 (15,'Noah Singh','noah@co',5,1,'Ops Lead','2023-07-10',110000,1),
 (16,'Omar Hassan','omar@co',5,15,'Ops Analyst','2024-01-15',82000,1),
 (17,'Pia Larsen','pia@co',2,5,'SDR','2024-08-05',62000,1),
 (18,'Quinn Davis','quinn@co',3,7,'Content Manager','2023-09-22',86000,0),
 (19,'Rita Volkov','rita@co',1,2,'Staff Engineer','2022-11-04',175000,1),
 (20,'Sami Yusuf','sami@co',4,8,'Senior Analyst','2024-09-12',118000,1);

INSERT INTO marketing_campaigns VALUES
 (1,'Spring Boot Push','google','2024-02-01','2024-03-15',12000),
 (2,'Hoodie Season','meta','2024-09-01','2024-10-31',18000),
 (3,'Newsletter Q1','email','2024-01-10','2024-03-31',2000),
 (4,'Partner Push','partner','2024-04-01','2024-06-30',8000),
 (5,'Holiday Tease','tiktok','2024-10-15','2024-12-31',22000);

INSERT INTO campaign_attribution VALUES
 (1,4,1,'2024-02-08','first'),(2,5,1,'2024-02-12','last'),
 (3,11,4,'2024-04-02','first'),(4,11,4,'2024-04-08','last'),
 (5,13,3,'2024-01-25','first'),(6,17,1,'2024-02-20','mid'),
 (7,17,4,'2024-04-15','last'),(8,19,4,'2024-04-20','first'),
 (9,21,4,'2024-05-01','first'),(10,22,2,'2024-09-15','last'),
 (11,24,2,'2024-09-02','first'),(12,26,2,'2024-09-20','last'),
 (13,27,5,'2024-10-22','first'),(14,28,2,'2024-09-09','first'),
 (15,29,5,'2024-10-25','last'),(16,30,5,'2024-10-28','first');

INSERT INTO subscriptions VALUES
 (1,1,'Enterprise',1500,'2023-02-01',NULL),
 (2,3,'Enterprise',1500,'2023-04-01',NULL),
 (3,7,'Enterprise',2200,'2023-08-01',NULL),
 (4,9,'Enterprise',1500,'2023-10-01',NULL),
 (5,11,'Enterprise',1800,'2023-12-01',NULL),
 (6,12,'Enterprise',1500,'2024-01-01',NULL),
 (7,15,'Enterprise',1500,'2024-02-01',NULL),
 (8,19,'Enterprise',1800,'2024-05-01',NULL),
 (9,21,'Enterprise',1500,'2024-06-01',NULL),
 (10,2,'Pro',180,'2023-03-01',NULL),
 (11,8,'Pro',180,'2023-09-01','2024-08-01'),
 (12,10,'Pro',180,'2023-11-01',NULL),
 (13,13,'Pro',180,'2024-01-01',NULL),
 (14,17,'Pro',180,'2024-03-01',NULL),
 (15,18,'Pro',180,'2024-04-01',NULL),
 (16,20,'Pro',180,'2024-05-01',NULL),
 (17,22,'Pro',180,'2024-06-01','2024-09-01'),
 (18,23,'Team',420,'2024-07-01',NULL),
 (19,26,'Team',420,'2024-09-01',NULL),
 (20,28,'Enterprise',2200,'2024-10-01',NULL),
 (21,5,'Free',0,'2023-06-01',NULL),
 (22,6,'Free',0,'2023-07-01',NULL),
 (23,14,'Free',0,'2024-02-01',NULL),
 (24,16,'Free',0,'2024-03-01',NULL),
 (25,25,'Free',0,'2024-08-01',NULL);

-- Web events: 4 sessions for c1, plus various others
INSERT INTO web_events VALUES
 (1,1,'s_a','page_view','2024-07-01 09:01','/home','desktop'),
 (2,1,'s_a','page_view','2024-07-01 09:02','/products','desktop'),
 (3,1,'s_a','add_to_cart','2024-07-01 09:05','/products/1','desktop'),
 (4,1,'s_a','checkout','2024-07-01 09:09','/checkout','desktop'),
 (5,1,'s_a','purchase','2024-07-01 09:11','/thanks','desktop'),
 (6,2,'s_b','page_view','2024-07-02 10:00','/home','mobile'),
 (7,3,'s_c','page_view','2024-07-02 11:15','/home','desktop'),
 (8,3,'s_c','page_view','2024-07-02 11:16','/products','desktop'),
 (9,5,'s_d','page_view','2024-07-03 14:00','/home','mobile'),
 (10,5,'s_d','add_to_cart','2024-07-03 14:08','/products/3','mobile'),
 (11,7,'s_e','page_view','2024-07-04 08:00','/home','desktop'),
 (12,7,'s_e','checkout','2024-07-04 08:22','/checkout','desktop'),
 (13,1,'s_f','page_view','2024-08-10 09:00','/home','mobile'),
 (14,1,'s_f','page_view','2024-08-10 09:02','/products/7','mobile'),
 (15,1,'s_f','purchase','2024-08-10 09:08','/thanks','mobile'),
 (16,11,'s_g','page_view','2024-09-02 12:00','/home','desktop'),
 (17,11,'s_g','add_to_cart','2024-09-02 12:05','/products/18','desktop'),
 (18,11,'s_g','purchase','2024-09-02 12:09','/thanks','desktop'),
 (19,15,'s_h','page_view','2024-09-15 10:00','/home','mobile'),
 (20,15,'s_h','page_view','2024-09-15 10:02','/products/14','mobile'),
 (21,21,'s_i','page_view','2024-09-22 18:30','/home','desktop'),
 (22,21,'s_i','add_to_cart','2024-09-22 18:38','/products/7','desktop'),
 (23,21,'s_i','purchase','2024-09-22 18:42','/thanks','desktop'),
 (24,28,'s_j','page_view','2024-10-12 11:00','/home','tablet'),
 (25,28,'s_j','add_to_cart','2024-10-12 11:08','/products/14','tablet'),
 (26,28,'s_j','checkout','2024-10-12 11:14','/checkout','tablet'),
 (27,29,'s_k','page_view','2024-10-26 09:00','/home','desktop'),
 (28,29,'s_k','purchase','2024-10-26 09:10','/thanks','desktop'),
 (29,30,'s_l','page_view','2024-10-30 16:00','/home','mobile'),
 (30,30,'s_l','add_to_cart','2024-10-30 16:05','/products/17','mobile');
`;

// Rich human-readable schema details for AI prompts AND in-app docs
export type TableInfo = {
  name: string;
  description: string;
  columns: { name: string; type: string; description: string; pk?: boolean; fk?: string }[];
  example_questions?: string[];
};

export const TABLES: TableInfo[] = [
  {
    name: "customers",
    description: "Registered users / accounts. One row per customer.",
    columns: [
      { name: "customer_id", type: "INTEGER", description: "Primary key", pk: true },
      { name: "name", type: "TEXT", description: "Full name" },
      { name: "email", type: "TEXT", description: "Contact email" },
      { name: "country", type: "TEXT", description: "ISO 2-letter country code" },
      { name: "city", type: "TEXT", description: "City" },
      { name: "signup_date", type: "DATE", description: "When the customer registered" },
      { name: "segment", type: "TEXT", description: "Enterprise | SMB | Consumer" },
      { name: "channel", type: "TEXT", description: "Acquisition channel: organic | paid | referral | partner" },
      { name: "lifetime_value", type: "NUMERIC", description: "Cumulative revenue attributed to the customer" },
    ],
    example_questions: ["Top 10 customers by LTV", "Cohort retention by signup month"],
  },
  {
    name: "products",
    description: "Catalog of sellable items.",
    columns: [
      { name: "product_id", type: "INTEGER", description: "PK", pk: true },
      { name: "name", type: "TEXT", description: "Product name" },
      { name: "category", type: "TEXT", description: "Top-level category" },
      { name: "subcategory", type: "TEXT", description: "Finer grouping" },
      { name: "price", type: "NUMERIC", description: "List price" },
      { name: "cost", type: "NUMERIC", description: "Unit cost" },
      { name: "supplier_id", type: "INTEGER", description: "FK -> suppliers", fk: "suppliers.supplier_id" },
      { name: "launched_on", type: "DATE", description: "Launch date" },
    ],
  },
  {
    name: "suppliers",
    description: "Vendors that supply products.",
    columns: [
      { name: "supplier_id", type: "INTEGER", description: "PK", pk: true },
      { name: "name", type: "TEXT", description: "Supplier name" },
      { name: "country", type: "TEXT", description: "Country of origin" },
      { name: "rating", type: "NUMERIC", description: "0-5 internal quality rating" },
    ],
  },
  {
    name: "inventory",
    description: "Per-warehouse stock levels. Composite PK (product_id, warehouse).",
    columns: [
      { name: "product_id", type: "INTEGER", description: "FK -> products", pk: true, fk: "products.product_id" },
      { name: "warehouse", type: "TEXT", description: "US-EAST | US-WEST | EU | APAC", pk: true },
      { name: "on_hand", type: "INTEGER", description: "Units currently in stock" },
      { name: "reorder_point", type: "INTEGER", description: "Reorder threshold" },
    ],
  },
  {
    name: "orders",
    description: "Order header. One row per order.",
    columns: [
      { name: "order_id", type: "INTEGER", description: "PK", pk: true },
      { name: "customer_id", type: "INTEGER", description: "FK -> customers", fk: "customers.customer_id" },
      { name: "order_date", type: "DATE", description: "Date order was placed" },
      { name: "status", type: "TEXT", description: "completed | cancelled | refunded | pending" },
      { name: "channel", type: "TEXT", description: "web | mobile | partner" },
      { name: "total", type: "NUMERIC", description: "Order total after discount" },
      { name: "discount", type: "NUMERIC", description: "Discount applied" },
    ],
  },
  {
    name: "order_items",
    description: "Order line items. One row per product per order.",
    columns: [
      { name: "order_item_id", type: "INTEGER", description: "PK", pk: true },
      { name: "order_id", type: "INTEGER", description: "FK -> orders", fk: "orders.order_id" },
      { name: "product_id", type: "INTEGER", description: "FK -> products", fk: "products.product_id" },
      { name: "quantity", type: "INTEGER", description: "Units bought" },
      { name: "unit_price", type: "NUMERIC", description: "Price at time of sale" },
    ],
  },
  {
    name: "payments",
    description: "Payment events for orders.",
    columns: [
      { name: "payment_id", type: "INTEGER", description: "PK", pk: true },
      { name: "order_id", type: "INTEGER", description: "FK -> orders", fk: "orders.order_id" },
      { name: "method", type: "TEXT", description: "card | paypal | ach | gift" },
      { name: "amount", type: "NUMERIC", description: "Captured amount" },
      { name: "paid_at", type: "DATE", description: "When payment cleared" },
    ],
  },
  {
    name: "refunds",
    description: "Refund events for orders.",
    columns: [
      { name: "refund_id", type: "INTEGER", description: "PK", pk: true },
      { name: "order_id", type: "INTEGER", description: "FK -> orders", fk: "orders.order_id" },
      { name: "amount", type: "NUMERIC", description: "Refunded amount" },
      { name: "reason", type: "TEXT", description: "Reason category / note" },
      { name: "refunded_at", type: "DATE", description: "When refund processed" },
    ],
  },
  {
    name: "reviews",
    description: "Customer product reviews.",
    columns: [
      { name: "review_id", type: "INTEGER", description: "PK", pk: true },
      { name: "product_id", type: "INTEGER", description: "FK -> products", fk: "products.product_id" },
      { name: "customer_id", type: "INTEGER", description: "FK -> customers", fk: "customers.customer_id" },
      { name: "rating", type: "INTEGER", description: "1..5 stars" },
      { name: "body", type: "TEXT", description: "Review text" },
      { name: "created_at", type: "DATE", description: "When review was posted" },
    ],
  },
  {
    name: "departments",
    description: "Org departments.",
    columns: [
      { name: "department_id", type: "INTEGER", description: "PK", pk: true },
      { name: "name", type: "TEXT", description: "Department name" },
      { name: "cost_center", type: "TEXT", description: "Finance cost-center code" },
    ],
  },
  {
    name: "employees",
    description: "Employees. manager_id is a self-FK enabling org-tree / recursive CTE problems.",
    columns: [
      { name: "employee_id", type: "INTEGER", description: "PK", pk: true },
      { name: "name", type: "TEXT", description: "Full name" },
      { name: "email", type: "TEXT", description: "Email" },
      { name: "department_id", type: "INTEGER", description: "FK -> departments", fk: "departments.department_id" },
      { name: "manager_id", type: "INTEGER", description: "Self FK -> employees.employee_id (nullable for CEO)", fk: "employees.employee_id" },
      { name: "title", type: "TEXT", description: "Job title" },
      { name: "hire_date", type: "DATE", description: "Hire date" },
      { name: "salary", type: "NUMERIC", description: "Annual salary in USD" },
      { name: "is_active", type: "INTEGER", description: "1 if currently employed, 0 otherwise" },
    ],
    example_questions: ["Org chart with depth", "Salary vs department average"],
  },
  {
    name: "marketing_campaigns",
    description: "Paid + owned marketing campaigns and their spend.",
    columns: [
      { name: "campaign_id", type: "INTEGER", description: "PK", pk: true },
      { name: "name", type: "TEXT", description: "Campaign name" },
      { name: "channel", type: "TEXT", description: "google | meta | email | tiktok | partner" },
      { name: "start_date", type: "DATE", description: "Start" },
      { name: "end_date", type: "DATE", description: "End" },
      { name: "spend", type: "NUMERIC", description: "Total spend USD" },
    ],
  },
  {
    name: "campaign_attribution",
    description: "Touchpoints linking customers to campaigns. Useful for first/last/multi-touch attribution.",
    columns: [
      { name: "attribution_id", type: "INTEGER", description: "PK", pk: true },
      { name: "customer_id", type: "INTEGER", description: "FK -> customers", fk: "customers.customer_id" },
      { name: "campaign_id", type: "INTEGER", description: "FK -> marketing_campaigns", fk: "marketing_campaigns.campaign_id" },
      { name: "touched_at", type: "DATE", description: "Touchpoint timestamp" },
      { name: "position", type: "TEXT", description: "first | mid | last" },
    ],
  },
  {
    name: "subscriptions",
    description: "Recurring subscriptions. cancelled_on is null for active subs (great for MRR / churn).",
    columns: [
      { name: "subscription_id", type: "INTEGER", description: "PK", pk: true },
      { name: "customer_id", type: "INTEGER", description: "FK -> customers", fk: "customers.customer_id" },
      { name: "plan", type: "TEXT", description: "Free | Pro | Team | Enterprise" },
      { name: "mrr", type: "NUMERIC", description: "Monthly recurring revenue" },
      { name: "started_on", type: "DATE", description: "Subscription start" },
      { name: "cancelled_on", type: "DATE", description: "NULL if still active" },
    ],
    example_questions: ["Active MRR by plan", "Logo churn by month"],
  },
  {
    name: "web_events",
    description: "Clickstream. Use session_id for sessionization, event_type for funnels.",
    columns: [
      { name: "event_id", type: "INTEGER", description: "PK", pk: true },
      { name: "customer_id", type: "INTEGER", description: "Customer (nullable for anon)" },
      { name: "session_id", type: "TEXT", description: "Session identifier" },
      { name: "event_type", type: "TEXT", description: "page_view | add_to_cart | checkout | purchase | signup | login" },
      { name: "event_time", type: "DATETIME", description: "Event timestamp" },
      { name: "page", type: "TEXT", description: "URL path" },
      { name: "device", type: "TEXT", description: "desktop | mobile | tablet" },
    ],
  },
];

export const SCHEMA_DESCRIPTION = TABLES.map(
  (t) =>
    `${t.name}(${t.columns
      .map((c) => `${c.name} ${c.type}${c.pk ? " PK" : ""}${c.fk ? ` FK->${c.fk}` : ""}`)
      .join(", ")}) -- ${t.description}`,
).join("\n");
