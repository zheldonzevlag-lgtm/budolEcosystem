"""
Direct database seed script for budolshap production.
Connects directly to the RDS PostgreSQL instance and inserts
the minimum required data for products to display on the site.

Why: ECS-based seeding was failing due to Prisma generate permission issues.
     Direct SQL via psycopg2 bypasses that entirely.
"""
import psycopg2
import uuid
from datetime import datetime

DB_URL = "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid"

def main():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    USER_ID = '8b23b71b-c27e-4964-a15a-ead0b563ea8d'
    now = datetime.utcnow().isoformat()

    print("=== Starting Production Seed ===")

    # 1. Check/Create User
    cur.execute('SELECT id FROM "User" WHERE id = %s', (USER_ID,))
    if not cur.fetchone():
        cur.execute("""
            INSERT INTO "User" (id, name, email, password, image, "isAdmin", "accountType", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (USER_ID, 'Reynaldo Galvez', 'reynaldomgalvez@gmail.com',
              '$2b$10$placeholder_hashed_password', 'https://via.placeholder.com/150',
              True, 'ADMIN'))
        print("✅ User created")
    else:
        print("ℹ️  User already exists")

    # 2. Check/Create SystemSetting
    cur.execute('SELECT id FROM "SystemSetting" WHERE id = %s', ('default',))
    if not cur.fetchone():
        cur.execute("""
            INSERT INTO "SystemSetting" (id, "realtimeProvider", "cacheProvider", "marketingAdsEnabled", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, NOW(), NOW())
        """, ('default', 'POLLING', 'MEMORY', False))
        print("✅ SystemSetting created")
    else:
        print("ℹ️  SystemSetting already exists")

    # 3. Check/Create Category
    cur.execute('SELECT id FROM "Category" WHERE slug = %s', ('socks',))
    row = cur.fetchone()
    if not row:
        cat_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO "Category" (id, name, slug, icon, "isActive", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """, (cat_id, 'Socks', 'socks', 'Footprints', True))
        print(f"✅ Category created: {cat_id}")
    else:
        cat_id = row[0]
        print(f"ℹ️  Category already exists: {cat_id}")

    # 4. Check/Create Store
    cur.execute('SELECT id FROM "Store" WHERE "userId" = %s', (USER_ID,))
    row = cur.fetchone()
    if not row:
        store_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO "Store" (id, "userId", name, username, description, address, logo, email, contact, status, "isActive", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (store_id, USER_ID, 'Budol Official Store', 'budol_official',
              'Official store of Budol Ecosystem', 'Manila, Philippines',
              'https://budolshap.duckdns.org/logo.png', 'admin@budol.org',
              '09123456789', 'APPROVED', True))
        print(f"✅ Store created: {store_id}")
    else:
        store_id = row[0]
        print(f"ℹ️  Store already exists: {store_id}")

    # 5. Create Sample Products
    products = [
        ('Budol Premium Socks', 'High-quality cotton socks for everyday use', 500.00, 299.00, 'Socks'),
        ('Budol Sport Socks', 'Comfortable sport socks with moisture-wicking technology', 450.00, 249.00, 'Socks'),
        ('Budol Kids Socks Bundle', 'Pack of 5 colorful socks for kids', 350.00, 199.00, 'Socks'),
    ]

    for name, desc, mrp, price, cat in products:
        prod_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO "Product" (id, "storeId", name, description, mrp, price, images, category, "categoryId", "inStock", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (prod_id, store_id, name, desc, mrp, price,
              '["https://images.unsplash.com/photo-1582966298636-a1d08e19997b?auto=format&fit=crop&q=80&w=300"]',
              cat, cat_id, True))
        print(f"✅ Product created: {name}")

    print("\n=== Seeding Complete! ===")

    # Verify
    cur.execute('SELECT COUNT(*) FROM "Product"')
    count = cur.fetchone()[0]
    print(f"📊 Total products in DB: {count}")

    cur.execute('SELECT COUNT(*) FROM "Category"')
    print(f"📊 Total categories in DB: {cur.fetchone()[0]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
