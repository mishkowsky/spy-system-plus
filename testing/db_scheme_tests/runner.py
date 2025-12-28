import psycopg2
import os
import re

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "spy-system",
    "user": "postgres",
    "password": "postgres"
}

TESTS_ROOT = "./sql"


def parse_expectations(sql_text):
    name_match = re.search(r"--\s*TEST_NAME:\s*(.+)", sql_text)
    expected_match = re.search(r"--\s*EXPECTED:\s*(SUCCESS|ERROR)", sql_text)

    return {
        "name": name_match.group(1) if name_match else "Unnamed test",
        "expected": expected_match.group(1) if expected_match else "SUCCESS"
    }


def execute_sql(cursor, sql_text):
    cursor.execute(sql_text)


def run_test(cursor, sql_text):
    try:
        cursor.execute("BEGIN;")
        execute_sql(cursor, sql_text)
        cursor.execute("COMMIT;")
        return "SUCCESS", None
    except Exception as e:
        cursor.execute("ROLLBACK;")
        return "ERROR", str(e)


def run_preconditions(cursor, path):
    precondition_path = os.path.join(path, "preconditions.sql")
    if not os.path.exists(precondition_path):
        return

    with open(precondition_path, "r", encoding="utf-8") as f:
        sql = f.read()

    cursor.execute("BEGIN;")
    cursor.execute(sql)
    cursor.execute("COMMIT;")


def run_all_tests():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cursor = conn.cursor()

    results = []

    for table_dir in sorted(os.listdir(TESTS_ROOT)):
        table_path = os.path.join(TESTS_ROOT, table_dir)

        if not os.path.isdir(table_path):
            continue

        # Run preconditions first (once per table)
        run_preconditions(cursor, table_path)

        for file in sorted(os.listdir(table_path)):
            if not file.endswith(".sql") or file == "preconditions.sql":
                continue

            file_path = os.path.join(table_path, file)

            with open(file_path, "r", encoding="utf-8") as f:
                sql_text = f.read()

            meta = parse_expectations(sql_text)
            actual, error = run_test(cursor, sql_text)

            status = "PASS" if actual == meta["expected"] else "FAIL"

            results.append({
                "table": table_dir,
                "test": meta["name"],
                "expected": meta["expected"],
                "actual": actual,
                "status": status,
                "error": error
            })

    cursor.close()
    conn.close()
    return results


def print_report(results):
    print("\nDATABASE TEST REPORT")
    print("=" * 70)

    passed = failed = 0

    for r in results:
        print(f"\nTable:    {r['table']}")
        print(f"Test:     {r['test']}")
        print(f"Expected: {r['expected']}")
        print(f"Actual:   {r['actual']}")
        print(f"Status:   {r['status']}")

        if r["status"] == "FAIL":
            print(f"Error:    {r['error']}")
            failed += 1
        else:
            passed += 1

    print("\nSUMMARY")
    print("-" * 70)
    print(f"Total tests: {len(results)}")
    print(f"Passed:      {passed}")
    print(f"Failed:      {failed}")


if __name__ == "__main__":
    results = run_all_tests()
    print_report(results)
