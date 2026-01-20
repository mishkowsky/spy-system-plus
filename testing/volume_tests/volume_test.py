import psycopg2
import time
import statistics
from pathlib import Path
from contextlib import contextmanager

BASE_DIR = Path(__file__).parent
SQL_DIR = BASE_DIR / "sql"

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "dbname": "spy-system",
    "user": "postgres",
    "password": "postgres",
}

VOLUME = {
    "device_metrics": 100_000,
    "clients": 1_000,
    "contracts": 500,
}

RUNS = 10


@contextmanager
def db_conn():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        conn.close()


def load_sql(path: Path) -> str:
    return path.read_text()


def execute(conn, sql, params=None, commit=False):
    with conn.cursor() as cur:
        cur.execute(sql, params)
    if commit:
        conn.commit()


def timed_query(conn, sql):
    start = time.perf_counter()
    with conn.cursor() as cur:
        cur.execute(sql)
        cur.fetchall()
    return time.perf_counter() - start


def perf_test(conn, sql):
    times = [timed_query(conn, sql) for _ in range(RUNS)]

    print(f"Min: {(min(times)*1000):.4f}ms")
    print(f"Max: {(max(times)*1000):.4f}ms")
    print(f"Avg: {(statistics.mean(times))*1000:.4f}ms")


def explain(conn, sql):
    explain_template = "EXPLAIN ANALYZE %s"
    with conn.cursor() as cur:
        cur.execute(explain_template % sql)
        for row in cur.fetchall():
            print(row[0])


def main():
    with db_conn() as conn:
        conn.autocommit = False

        # Volume
        execute(
            conn,
            load_sql(SQL_DIR / "clean_up.sql"),
            commit=True,
        )
        execute(
            conn,
            load_sql(SQL_DIR / "volume/insert_device_metrics.sql"),
            {"rows": VOLUME["device_metrics"]},
            commit=True,
        )
        execute(
            conn,
            load_sql(SQL_DIR / "volume/insert_clients.sql"),
            {"rows": VOLUME["clients"]},
            commit=True,
        )
        execute(
            conn,
            load_sql(SQL_DIR / "volume/insert_contracts.sql"),
            {"rows": VOLUME["contracts"]},
            commit=True,
        )

        # Performance
        for sql_file in (SQL_DIR / "test_queries").iterdir():
            sql = load_sql(sql_file)
            print(f"\nTESTING {sql_file.stem}")
            explain(conn, sql)
            perf_test(conn, sql)

        execute(
            conn,
            load_sql(SQL_DIR / "clean_up.sql"),
            commit=True,
        )


if __name__ == "__main__":
    main()
