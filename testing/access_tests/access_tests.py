
from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Union

import requests
from requests.auth import HTTPBasicAuth


# -----------------------------
# Models
# -----------------------------

@dataclass(frozen=True)
class Actor:
    name: str
    auth: Optional[HTTPBasicAuth]  # None => no auth


@dataclass(frozen=True)
class Case:
    id: str
    title: str
    method: str
    path: str
    actor: str
    expected_status: int
    json_body: Optional[Dict[str, Any]] = None


Json = Union[Dict[str, Any], list, str, int, float, bool, None]


# -----------------------------
# Helpers
# -----------------------------

def env(name: str, default: str) -> str:
    v = os.getenv(name)
    return v if v else default


def make_actors() -> Dict[str, Actor]:
    return {
        "noauth": Actor("noauth", None),
        "client": Actor("client", HTTPBasicAuth(env("SPY_CLIENT_USER", "client@example.com"), env("SPY_CLIENT_PASS", "clientpass"))),
        "worker": Actor("worker", HTTPBasicAuth(env("SPY_WORKER_USER", "worker@example.com"), env("SPY_WORKER_PASS", "workerpass"))),
        "manager": Actor("manager", HTTPBasicAuth(env("SPY_MANAGER_USER", "manager@example.com"), env("SPY_MANAGER_PASS", "managerpass"))),
        "senior": Actor("senior", HTTPBasicAuth(env("SPY_SENIOR_USER", "manager@example.com"), env("SPY_SENIOR_PASS", "managerpass"))),
    }


def safe_json(resp: requests.Response) -> Optional[Json]:
    try:
        return resp.json()
    except Exception:
        return None


def find_int_id(obj: Json) -> Optional[int]:
    """
    Tries to extract an integer id from different JSON shapes:
      {"id":123}
      {"clientId":123}
      {"id":"123"}
      {"data":{"id":123}}
      {"result":{"clientId":"123"}}
      {"payload":{"client":{"id":123}}}
    """
    if obj is None:
        return None

    # direct scalar
    if isinstance(obj, int):
        return obj
    if isinstance(obj, str) and obj.isdigit():
        return int(obj)

    # list: search inside
    if isinstance(obj, list):
        for it in obj:
            v = find_int_id(it)
            if v is not None:
                return v
        return None

    # dict: try common keys first, then deep scan
    if isinstance(obj, dict):
        for key in ("id", "clientId", "client_id", "clientID"):
            if key in obj:
                v = obj[key]
                if isinstance(v, int):
                    return v
                if isinstance(v, str) and v.isdigit():
                    return int(v)

        # deep scan
        for _, v in obj.items():
            got = find_int_id(v)
            if got is not None:
                return got

    return None


def http_call(
    s: requests.Session,
    base_url: str,
    c: Case,
    actor: Actor,
    timeout_s: float,
    verify_tls: bool,
) -> requests.Response:
    url = base_url.rstrip("/") + c.path
    headers = {"Accept": "application/json"}

    kwargs: Dict[str, Any] = {
        "method": c.method,
        "url": url,
        "headers": headers,
        "auth": actor.auth,
        "timeout": timeout_s,
        "verify": verify_tls,
    }
    if c.json_body is not None:
        kwargs["json"] = c.json_body

    return s.request(**kwargs)


def print_result(ok: bool, c: Case, got: int) -> None:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {c.id} {c.title} | expected={c.expected_status}, got={got}")


# -----------------------------
# Cases
# -----------------------------

def build_cases(client_id: int) -> list[Case]:
    new_client_payload = {
        "email": f"sec_test_{os.getpid()}_{int(time.time())}@example.com",
        "password": "123456",
        "name": "Sec",
        "surname": "Test",
        "lastname": "User",
        "metricThreshold": 100,
        "violationsCount": 0,
    }

    metric_payload = {
        "deviceId": 1,
        "value": 51,
        "timestamp": "1970-01-01T00:00:00",
        "latitude": 1,
        "longitude": 1,
    }

    return [
        Case("S-01", "POST /api/clients without auth (public регистрация клиента)", "POST", "/api/clients", "noauth", 200, new_client_payload),

        Case("S-02", f"DELETE /api/clients/{client_id} as client (forbidden)", "DELETE", f"/api/clients/{client_id}", "client", 403),
        Case("S-03", f"DELETE /api/clients/{client_id} as worker (forbidden)", "DELETE", f"/api/clients/{client_id}", "worker", 403),
        Case("S-04", f"DELETE /api/clients/{client_id} as manager (succeed)", "DELETE", f"/api/clients/{client_id}", "manager", 204),

        Case("S-05", "POST /api/metrics without auth (public IoT metrics)", "POST", "/api/metrics", "noauth", 200, metric_payload),
        Case("S-06", "POST /api/devices/1/off without auth (public device-off)", "POST", "/api/devices/1/off", "noauth", 200),
        Case("S-07", "GET /api/clients without auth (unauthorized)", "GET", "/api/clients", "noauth", 401),
        Case("S-08", f"DELETE /api/clients/{client_id} without auth (unauthorized)", "DELETE", f"/api/clients/{client_id}", "noauth", 401),

        Case("S-09", "GET /api/managers as non-senior manager (200 OK)", "GET", "/api/managers", "manager", 200),
        Case("S-10", "POST /api/managers as non-senior manager (403)", "POST", "/api/managers", "manager", 403, {
            "email": f"mgr_{os.getpid()}_{int(time.time())}@example.com",
            "name": "New",
            "surname": "Manager",
            "lastname": "User",
            "isSenior": "false",
        }),
        Case("S-11", "GET /api/managers as senior manager (200 OK)", "GET", "/api/managers", "senior", 200),
        Case("S-12", "POST /api/managers as senior manager (200 OK)", "POST", "/api/managers", "senior", 200, {
            "email": f"senior_created_{os.getpid()}_{int(time.time())}@example.com",
            "name": "Created",
            "surname": "BySenior",
            "lastname": "Manager",
            "isSenior": "false",
        }),
    ]


# -----------------------------
# Main
# -----------------------------

def bootstrap_client_id(
    s: requests.Session,
    base_url: str,
    timeout_s: float,
    verify_tls: bool,
    retries: int,
) -> tuple[Optional[int], Optional[requests.Response], Optional[Json]]:
    url = base_url.rstrip("/") + "/api/clients"
    payload = {
        "email": f"bootstrap_{os.getpid()}_{int(time.time())}@example.com",
        "password": "123456",
        "name": "Boot",
        "surname": "Strap",
        "lastname": "User",
        "metricThreshold": 100,
        "violationsCount": 0,
    }

    last_resp: Optional[requests.Response] = None
    last_json: Optional[Json] = None

    for attempt in range(1, retries + 1):
        try:
            r = s.post(url, json=payload, timeout=timeout_s, verify=verify_tls)
            last_resp = r
            last_json = safe_json(r)

            # Retry only for typical gateway errors
            if r.status_code in (502, 503, 504):
                print(f"[WARN] bootstrap attempt {attempt}/{retries}: got {r.status_code}, retrying...")
                time.sleep(0.7)
                continue

            if r.status_code != 200:
                return None, last_resp, last_json

            cid = find_int_id(last_json)
            return cid, last_resp, last_json

        except Exception as e:
            print(f"[WARN] bootstrap attempt {attempt}/{retries} failed: {e}")
            time.sleep(0.7)

    return None, last_resp, last_json


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True, help="e.g. http://localhost:8080")
    ap.add_argument("--timeout", type=float, default=10.0)
    ap.add_argument("--insecure", action="store_true", help="Disable TLS verification (https/self-signed)")
    ap.add_argument("--client-id", type=int, default=None, help="Use existing client id if bootstrap can't extract one")
    ap.add_argument("--retries", type=int, default=5)
    args = ap.parse_args()

    actors = make_actors()
    s = requests.Session()

    print("== Bootstrap: create a temp client to obtain clientId ==")
    client_id, resp, body = bootstrap_client_id(
        s=s,
        base_url=args.base_url,
        timeout_s=args.timeout,
        verify_tls=not args.insecure,
        retries=args.retries,
    )

    if resp is None:
        print("[FATAL] bootstrap didn't return a response at all (network problem).")
        return 2

    if resp.status_code != 200:
        print(f"[FATAL] bootstrap expected 200, got {resp.status_code}.")
        print(f"        body (first 400 chars): {resp.text[:400]}")
        return 2

    if client_id is None:
        print("[WARN] bootstrap returned 200, but I can't extract clientId from JSON.")
        print(f"       response JSON: {body}")
        if args.client_id is None:
            print("[FATAL] Provide --client-id N (existing client) or adjust id parsing to your response DTO.")
            return 2
        client_id = args.client_id
        print(f"[INFO] Using provided clientId={client_id}")
    else:
        print(f"Bootstrap OK: clientId={client_id}")

    print()

    cases = build_cases(client_id)
    failures = 0

    for c in cases:
        actor = actors[c.actor]
        try:
            r = http_call(
                s=s,
                base_url=args.base_url,
                c=c,
                actor=actor,
                timeout_s=args.timeout,
                verify_tls=not args.insecure,
            )
        except Exception as e:
            failures += 1
            print(f"[FAIL] {c.id} {c.title} | request error: {e}")
            continue

        ok = (r.status_code == c.expected_status)
        if not ok:
            failures += 1
        print_result(ok, c, r.status_code)

    print("\n== Summary ==")
    total = len(cases)
    print(f"Total: {total} | Passed: {total - failures} | Failed: {failures}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
