"""Run this script once to create and seed the demo SQLite database."""
import sqlite3
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "demo.db"

CATEGORIES = ["Electronics", "Clothing", "Books", "Home", "Sports"]
PRODUCTS = [
    ("Wireless Headphones", "Electronics", 79.99),
    ("Running Shoes", "Sports", 59.99),
    ("Python Cookbook", "Books", 39.99),
    ("Desk Lamp", "Home", 24.99),
    ("T-Shirt", "Clothing", 14.99),
    ("USB-C Hub", "Electronics", 34.99),
    ("Yoga Mat", "Sports", 29.99),
    ("Coffee Maker", "Home", 49.99),
    ("Jeans", "Clothing", 44.99),
    ("Novel: The Brief", "Books", 12.99),
]


def seed():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.executescript("""
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS customers;

        CREATE TABLE customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            acquired_at TEXT NOT NULL,
            churn_date TEXT
        );

        CREATE TABLE products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL
        );

        CREATE TABLE orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            amount REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    """)

    # Insert products
    product_ids = []
    for name, cat, price in PRODUCTS:
        pid = str(uuid.uuid4())
        product_ids.append(pid)
        cur.execute("INSERT INTO products VALUES (?,?,?,?)", (pid, name, cat, price))

    # Insert customers
    first_names = ["Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Hank", "Iris", "Jack"]
    last_names = ["Smith", "Jones", "Brown", "Wilson", "Davis", "Taylor", "Clark", "Lewis", "Young", "Hall"]
    customer_ids = []
    base = datetime(2023, 1, 1)
    for i in range(500):
        cid = str(uuid.uuid4())
        customer_ids.append(cid)
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"user{i}@example.com"
        acq = (base + timedelta(days=random.randint(0, 500))).isoformat()
        churn = None if random.random() > 0.2 else (base + timedelta(days=random.randint(300, 700))).isoformat()
        cur.execute("INSERT INTO customers VALUES (?,?,?,?,?)", (cid, name, email, acq, churn))

    # Insert 5000 orders
    for _ in range(5000):
        oid = str(uuid.uuid4())
        cid = random.choice(customer_ids)
        pid_idx = random.randint(0, len(product_ids) - 1)
        pid = product_ids[pid_idx]
        amount = PRODUCTS[pid_idx][2] * random.uniform(0.9, 1.1)
        created = (base + timedelta(days=random.randint(0, 700), hours=random.randint(0, 23))).isoformat()
        cur.execute("INSERT INTO orders VALUES (?,?,?,?,?)", (oid, cid, pid, round(amount, 2), created))

    conn.commit()
    conn.close()
    print(f"Seeded {DB_PATH}")


if __name__ == "__main__":
    seed()
