// Seed schema for the practice "warehouse". Snowflake-flavored but SQLite-compatible.
export const SEED_SQL = `
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS web_events;

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  country TEXT,
  signup_date TEXT,
  segment TEXT
);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC,
  cost NUMERIC
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  order_date TEXT,
  status TEXT,
  total NUMERIC
);

CREATE TABLE order_items (
  order_item_id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id),
  product_id INTEGER REFERENCES products(product_id),
  quantity INTEGER,
  unit_price NUMERIC
);

CREATE TABLE departments (
  department_id INTEGER PRIMARY KEY,
  name TEXT
);

CREATE TABLE employees (
  employee_id INTEGER PRIMARY KEY,
  name TEXT,
  department_id INTEGER REFERENCES departments(department_id),
  manager_id INTEGER REFERENCES employees(employee_id),
  hire_date TEXT,
  salary NUMERIC
);

CREATE TABLE web_events (
  event_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  event_type TEXT,
  event_time TEXT,
  page TEXT
);

INSERT INTO customers VALUES
 (1,'Ada Lovelace','ada@example.com','UK','2023-01-15','Enterprise'),
 (2,'Linus Torvalds','linus@example.com','FI','2023-02-08','SMB'),
 (3,'Grace Hopper','grace@example.com','US','2023-03-20','Enterprise'),
 (4,'Alan Turing','alan@example.com','UK','2023-04-11','SMB'),
 (5,'Margaret Hamilton','margaret@example.com','US','2023-05-02','Consumer'),
 (6,'Dennis Ritchie','dennis@example.com','US','2023-06-19','Consumer'),
 (7,'Barbara Liskov','barbara@example.com','US','2023-07-22','Enterprise'),
 (8,'Ken Thompson','ken@example.com','US','2023-08-30','SMB'),
 (9,'Donald Knuth','don@example.com','US','2023-09-12','Enterprise'),
 (10,'Edsger Dijkstra','ed@example.com','NL','2023-10-05','SMB');

INSERT INTO products VALUES
 (1,'Snow Boots','Apparel',120,55),
 (2,'Data Mug','Merch',18,4),
 (3,'Query Hoodie','Apparel',65,22),
 (4,'Warehouse Backpack','Bags',95,40),
 (5,'CTE Cap','Apparel',28,9),
 (6,'Lateral Lamp','Home',75,30),
 (7,'Window Frame','Home',210,90);

INSERT INTO orders VALUES
 (1001,1,'2024-01-05','completed',183),
 (1002,2,'2024-01-12','completed',65),
 (1003,3,'2024-02-03','completed',330),
 (1004,4,'2024-02-19','cancelled',95),
 (1005,1,'2024-03-08','completed',56),
 (1006,5,'2024-03-22','completed',120),
 (1007,7,'2024-04-01','completed',285),
 (1008,3,'2024-04-15','completed',75),
 (1009,8,'2024-05-09','completed',46),
 (1010,9,'2024-05-30','completed',420),
 (1011,2,'2024-06-11','refunded',18),
 (1012,10,'2024-06-25','completed',155),
 (1013,1,'2024-07-04','completed',95),
 (1014,6,'2024-07-19','completed',28);

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
 (21,1014,5,1,28);

INSERT INTO departments VALUES (1,'Engineering'),(2,'Sales'),(3,'Marketing'),(4,'Data');

INSERT INTO employees VALUES
 (1,'Sam CEO',1,NULL,'2020-01-01',250000),
 (2,'Alice Manager',1,1,'2020-06-01',160000),
 (3,'Bob Dev',1,2,'2021-03-10',120000),
 (4,'Carol Dev',1,2,'2021-09-22',125000),
 (5,'Dave Sales',2,1,'2022-02-14',95000),
 (6,'Eve Sales',2,5,'2022-08-30',82000),
 (7,'Frank Mktg',3,1,'2023-01-05',88000),
 (8,'Gina Data',4,1,'2023-04-18',135000),
 (9,'Hank Data',4,8,'2023-11-01',105000);

INSERT INTO web_events VALUES
 (1,1,'page_view','2024-07-01 09:01','/home'),
 (2,1,'page_view','2024-07-01 09:02','/products'),
 (3,1,'add_to_cart','2024-07-01 09:05','/products/1'),
 (4,1,'checkout','2024-07-01 09:09','/checkout'),
 (5,2,'page_view','2024-07-02 10:00','/home'),
 (6,3,'page_view','2024-07-02 11:15','/home'),
 (7,3,'page_view','2024-07-02 11:16','/products'),
 (8,5,'page_view','2024-07-03 14:00','/home'),
 (9,5,'add_to_cart','2024-07-03 14:08','/products/3'),
 (10,7,'page_view','2024-07-04 08:00','/home'),
 (11,7,'checkout','2024-07-04 08:22','/checkout');
`;

export const SCHEMA_DESCRIPTION = `
TABLES (SQLite engine, Snowflake-style syntax where compatible):

customers(customer_id PK, name, email, country, signup_date, segment)
products(product_id PK, name, category, price, cost)
orders(order_id PK, customer_id FK, order_date, status, total)
order_items(order_item_id PK, order_id FK, product_id FK, quantity, unit_price)
departments(department_id PK, name)
employees(employee_id PK, name, department_id FK, manager_id FK->employees, hire_date, salary)
web_events(event_id PK, customer_id, event_type, event_time, page)
`;
