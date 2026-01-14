"""
Pytest configuration and fixtures for contract automation tests
Enhanced with comprehensive system workflow fixtures
"""

import os
import pytest
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


def pytest_addoption(parser):
    """Add custom command-line options for tests"""
    parser.addoption(
        "--headless",
        action="store_true",
        default=False,
        help="Run tests in headless mode"
    )
    parser.addoption(
        "--browser",
        action="store",
        default="chrome",
        help="Browser to use for testing (chrome, firefox, edge)"
    )
    parser.addoption(
        "--base-url",
        action="store",
        default="https://localhost",
        help="Base URL of the application"
    )
    parser.addoption(
        "--slow-mo",
        action="store",
        type=int,
        default=0,
        help="Slow down test execution in milliseconds"
    )


@pytest.fixture(scope="session")
def config(request):
    """Session-scoped fixture for test configuration"""
    return {
        "base_url": request.config.getoption("--base-url"),
        "headless": request.config.getoption("--headless"),
        "browser": request.config.getoption("--browser"),
        "slow_mo": request.config.getoption("--slow-mo"),
        "wait_timeout": int(os.getenv("WAIT_TIMEOUT", "15")),
    }


@pytest.fixture
def chrome_driver(config):
    """Fixture to provide Chrome WebDriver instance"""
    options = Options()

    if config["headless"]:
        options.add_argument("--headless")

    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument('--ignore-ssl-errors=yes')
    options.add_argument('--ignore-certificate-errors')
    prefs = {'profile.password_manager_leak_detection': False}
    options.add_experimental_option('prefs', prefs)

    # Run with window size to avoid mobile responsive layout
    options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(config["wait_timeout"])
    driver.set_script_timeout(config["wait_timeout"])

    yield driver

    driver.quit()


@pytest.fixture
def browser(chrome_driver, config):
    """Fixture to provide browser with wait utilities"""
    wait = WebDriverWait(chrome_driver, config["wait_timeout"])

    return {
        "driver": chrome_driver,
        "wait": wait,
        "base_url": config["base_url"],
        "slow_mo": config["slow_mo"],
    }


@pytest.fixture(autouse=True)
def reset_test_files():
    """Auto-cleanup test files before and after each test"""
    test_files = ["test_contract.pdf", "test_identity_document.pdf"]

    # Cleanup before test
    for test_file in test_files:
        if os.path.exists(test_file):
            os.remove(test_file)

    yield

    # Cleanup after test
    for test_file in test_files:
        if os.path.exists(test_file):
            os.remove(test_file)


# User role fixtures for comprehensive tests
@pytest.fixture
def manager_account():
    """Fixture providing manager test account credentials"""
    return {
        "username": "manager1",
        "password": "password123",
        "email": "manager@example.com",
        "name": "John",
        "surname": "Manager",
        "new_password": "newpassword123"
    }


@pytest.fixture
def client_account():
    """Fixture providing client test account credentials"""
    return {
        "email": "client@example.com",
        "password": "clientpass123",
        "name": "Jane",
        "surname": "Doe",
        "lastname": "Client"
    }


@pytest.fixture
def surveillance_officer_account():
    """Fixture providing surveillance officer test account credentials"""
    return {
        "name": "Alex",
        "surname": "Surveillance",
        "email": "surveillance@example.com",
        "password": "staffpass123",
        "role": "SURVEILLANCE_OFFICER"
    }


@pytest.fixture
def punishment_officer_account():
    """Fixture providing punishment officer test account credentials"""
    return {
        "name": "Pat",
        "surname": "Punishment",
        "email": "punishment@example.com",
        "password": "staffpass123",
        "role": "CORRECTIONS_OFFICER"
    }


@pytest.fixture
def test_devices():
    """Fixture providing test device IDs"""
    return {
        "device_1": "DEVICE_001",
        "device_2": "DEVICE_002",
        "device_3": "DEVICE_003"
    }


@pytest.fixture
def test_monitoring_config():
    """Fixture providing monitoring schedule configuration"""
    return {
        "day": "Monday",
        "start_time": "09:00",
        "end_time": "17:00",
        "metric_threshold": "100"
    }


@pytest.fixture
def test_violation_details():
    """Fixture providing test violation information"""
    return {
        "description": "Client detected outside allowed area",
        "severity": "Medium",
        "location": "Restricted Zone A"
    }