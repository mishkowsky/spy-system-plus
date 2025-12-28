import os

import bcrypt
import psycopg2


def get_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "spy-system"),
        user=os.getenv("DB_USER", "postgres"),
        port=int(os.getenv("DB_PORT", 5433)),
        password=os.getenv("DB_PASS", "postgres"),
    )
    return conn


def update_password(email: str, table_name: str):
    conn = get_connection()

    try:
        password = bcrypt.hashpw(b"password", bcrypt.gensalt(rounds=10, prefix=b"2a"))
        with conn.cursor() as cur:
            sql = f"""
                UPDATE {table_name}
                SET password = %s
                WHERE email = %s
            """
            cur.execute(sql, (str(password)[2:-1], email))
            conn.commit()

            if cur.rowcount == 0:
                print("No client found with that email.")
            else:
                print("Password updated successfully.")

    finally:
        conn.close()


def setup_database():
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            sql = 'select id from manager limit 1;'
            cur.execute(sql)
            manager_id = cur.fetchone()[0]

            password = bcrypt.hashpw(b"managerpass", bcrypt.gensalt(rounds=10, prefix=b"2a"))
            sql = """
                DELETE FROM contract;
                DELETE FROM device_change_task;
                DELETE FROM device_metric;
                DELETE FROM device;
                DELETE FROM punishment_task;
                DELETE FROM time_interval;
                DELETE FROM monitoring_interval;
                DELETE FROM reset_token;
                DELETE FROM file;
                DELETE FROM notification;
                DELETE FROM client;
                DELETE FROM worker;
                DELETE FROM manager WHERE id != %s;
                UPDATE manager
                SET email = 'manager@example.com',
                    is_senior = true,
                    name = 'Менеджер',
                    surname = 'Менеджеров',
                    lastname = 'Менеджерович',
                    password = %s
                WHERE id = %s;
            """
            cur.execute(sql, [manager_id, str(password)[2:-1], manager_id])
            conn.commit()
    finally:
        conn.close()