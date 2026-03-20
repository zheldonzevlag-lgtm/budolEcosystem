import psycopg2

conn_str = "postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require"

try:
    print("Connecting to DB via Prisma Accelerate...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("""
        UPDATE "SystemSettings" 
        SET "realtimeProvider" = 'SOCKET_IO', "socketUrl" = 'https://budolws.duckdns.org' 
        WHERE "id" = 'default';
    """)
    conn.commit()
    print("Successfully updated settings to use budolws socket.io!")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
