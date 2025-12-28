"""
Complete System Workflow Pytest Tests
Tests the comprehensive system lifecycle with actual UI element selectors
"""

import os
import time

import bcrypt
import pytest
from selenium.webdriver import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

from ui_autotests.tests.api_wrapper import post_metric, post_off
from ui_autotests.tests.db_patcher import update_password, setup_database


class TestCompleteSystemWorkflow:
    """Test complete system workflow with all roles and features"""

    GLOBAL_DELAY = 0.25

    # Manager credentials
    MANAGER_USERNAME = "manager@example.com"
    MANAGER_PASSWORD = "managerpass"
    MANAGER_NEW_PASSWORD = "newpassword123"
    MANAGER_NAME = "Семен"
    MANAGER_SURNAME = "Менеджеров"
    MANAGER_LASTNAME = "Семенович"

    # Staff credentials
    SURVEILLANCE_OFFICER_NAME = "Сотрудник"
    SURVEILLANCE_OFFICER_SURNAME = "Слежки"
    SURVEILLANCE_OFFICER_LASTNAME = "Петрович"
    SURVEILLANCE_OFFICER_EMAIL = "surv_officer@test.com"
    SURVEILLANCE_OFFICER_PASSWORD = "password"

    PUNISHMENT_OFFICER_NAME = "Сотрудник"
    PUNISHMENT_OFFICER_SURNAME = "Наказаний"
    PUNISHMENT_OFFICER_LASTNAME = "Иванович"
    PUNISHMENT_OFFICER_EMAIL = "corr_officer@test.com"
    PUNISHMENT_OFFICER_PASSWORD = "password"

    # Client credentials
    CLIENT_EMAIL = "client@test.com"
    CLIENT_PASSWORD = "clientpass123"
    CLIENT_NAME = "Клиент"
    CLIENT_SURNAME = "Иванов"
    CLIENT_LASTNAME = "Иванович"

    # Device IDs
    DEVICE_ID_1 = "1"
    DEVICE_ID_2 = "2"

    TEST_FILE_PATH = "test_identity_document.pdf"

    @staticmethod
    def create_test_file(filepath: str):
        """Create a dummy PDF file for upload testing"""
        test_file_content = b"%PDF-1.4\n%Test Identity Document\n"
        with open(filepath, "wb") as f:
            f.write(test_file_content)



    def login(self, browser, username: str, password: str):
        """Log in with username and password"""
        driver = browser["driver"]
        wait = browser["wait"]
        base_url = browser["base_url"]

        driver.get(f"{base_url}/login")

        # Login form selectors
        username_input = wait.until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        username_input.clear()
        username_input.send_keys(username)

        password_input = driver.find_element(By.ID, "password")
        password_input.clear()
        password_input.send_keys(password)

        # Submit button
        submit_button = driver.find_element(
            By.XPATH, "//button[@type='submit']"
        )
        submit_button.click()

        wait.until(EC.url_contains("/dashboard"))
        time.sleep(self.GLOBAL_DELAY)

    def logout(self, browser):
        self.open_profile_settings_popup(browser)
        time.sleep(self.GLOBAL_DELAY)
        self.click_element_by_text(browser, 'Выход', 'div')

    def register(self, browser, email: str, password: str, name: str, surname: str, lastname: str):
        """Register a new client"""
        driver = browser["driver"]
        wait = browser["wait"]
        base_url = browser["base_url"]

        driver.get(f"{base_url}/register")

        # Fill registration form
        wait.until(EC.presence_of_element_located((By.ID, "name")))

        name_field = driver.find_element(By.ID, "name")
        name_field.send_keys(name)

        surname_field = driver.find_element(By.ID, "surname")
        surname_field.send_keys(surname)

        lastname_field = driver.find_element(By.ID, "lastname")
        lastname_field.send_keys(lastname)

        email_field = driver.find_element(By.ID, "email")
        email_field.send_keys(email)

        password_field = driver.find_element(By.ID, "password")
        password_field.send_keys(password)

        confirm_password_field = driver.find_element(By.ID, "confirmPassword")
        confirm_password_field.send_keys(password)

        # Submit
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_button.click()

        # Wait for redirect to login or success message
        wait.until(EC.url_contains("/login"))
        time.sleep(self.GLOBAL_DELAY)

    def navigate_to_tab(self, browser, tab_name: str):
        """Navigate to a dashboard tab"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find tab button by text content
        tab_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//button[contains(normalize-space(.), '{tab_name}')]")
            )
        )
        tab_button.click()
        time.sleep(self.GLOBAL_DELAY)

    def click_element_by_text(self, browser, text: str, element: str = 'button'):
        wait = browser["wait"]
        button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//{element}[text()='{text}']")
            )
        )
        button.click()

    def create_contract(self, browser, client_details: str) -> str:
        """Create a contract in ClientDashboard"""
        driver = browser["driver"]
        wait = browser["wait"]

        self.create_test_file(self.TEST_FILE_PATH)

        # Find and click create button
        self.click_element_by_text(browser, 'Создать договор')
        time.sleep(self.GLOBAL_DELAY)

        # Wait for modal
        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )

        # Upload file
        file_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
        )
        file_input.send_keys(os.path.abspath(self.TEST_FILE_PATH))
        time.sleep(self.GLOBAL_DELAY)

        # Fill client details if field exists

        details_field = driver.find_element(By.ID, "clientDetails")
        details_field.send_keys(client_details)
        time.sleep(self.GLOBAL_DELAY)

        start_date_field = driver.find_element(By.ID, "startDate")
        start_date_field.send_keys("10.10.2010")
        time.sleep(self.GLOBAL_DELAY)

        # Submit
        submit_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[@type='submit' or contains(., 'Create')]")
            )
        )
        submit_button.click()

        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))
        time.sleep(self.GLOBAL_DELAY)

        # Get contract ID from table
        contract_row = wait.until(
            EC.presence_of_element_located((By.XPATH, "//table//tbody/tr[1]"))
        )
        cells = contract_row.find_elements(By.TAG_NAME, "td")
        contract_id = cells[0].text if cells else str(int(time.time()))

        return contract_id

    def send_contract_to_client(self, browser, contract_id: str):
        """Send contract to client for signature"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find contract row
        contract_row = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//table//tbody/tr[contains(., '{contract_id}')]")
            )
        )

        # Find send button in row
        send_button = None
        buttons = contract_row.find_elements(By.TAG_NAME, "button")
        for button in buttons:
            if "send" in button.text.lower() or "отправить" in button.text.lower():
                send_button = button
                break

        if not send_button:
            # Try clicking row to open details
            contract_row.click()
            time.sleep(self.GLOBAL_DELAY)
            send_button = wait.until(
                EC.element_to_be_clickable(
                    (By.XPATH, "//div[@role='dialog']//button[contains(., 'Send') or contains(., 'Отправить')]")
                )
            )

        send_button.click()
        time.sleep(self.GLOBAL_DELAY)

    def sign_contract(self, browser, contract_id: str):
        """Sign a contract as client"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find contract row
        contract_row = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//table//tbody/tr[contains(., '{contract_id}')]")
            )
        )

        # Find sign button
        sign_button = None
        buttons = contract_row.find_elements(By.TAG_NAME, "button")
        for button in buttons:
            if "подписать договор" in button.text.lower():
                sign_button = button
                break

        sign_button.click()
        time.sleep(self.GLOBAL_DELAY)

    def create_staff_account(self, browser, role: str, name: str, surname: str, email: str, lastname: str):
        """Create a staff account (needs to be customized based on actual modal)"""
        self.navigate_to_tab(browser, "Персонал")

        driver = browser["driver"]
        wait = browser["wait"]

        # Click create button
        create_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Создать аккаунт')]")
            )
        )
        create_button.click()
        time.sleep(self.GLOBAL_DELAY)

        # Wait for modal
        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )

        # Fill form fields
        time.sleep(self.GLOBAL_DELAY)
        if (role != 'Сотрудник наказаний'):
            role_drop_down_button = driver.find_element(
                By.XPATH, "//span[contains(., 'Сотрудник наказаний')]"
            )
            role_drop_down_button.find_element(By.XPATH, '..').click()

            role_button = driver.find_element(
                By.XPATH, f"//span[contains(., '{role}')]"
            )
            role_button.click()

        name_input = driver.find_element(By.NAME, "name")
        name_input.send_keys(name)

        surname_input = driver.find_element(By.NAME, "surname")
        surname_input.send_keys(surname)

        lastname_input = driver.find_element(By.NAME, "lastname")
        lastname_input.send_keys(lastname)

        email_input = driver.find_element(By.NAME, "email")
        email_input.send_keys(email)

        # password_input = driver.find_element(By.ID, "password")
        # password_input.send_keys(password)

        # Submit
        submit_buttons = driver.find_elements(
            By.XPATH, "//button[contains(., 'Создать аккаунт')]"
        )
        for b in submit_buttons:
            if len(b.find_elements(By.XPATH, ".//*")) != 0:
                continue
            submit_button = b
            break
        submit_button.click()

        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))
        update_password(email, "worker")
        time.sleep(self.GLOBAL_DELAY)

    def open_profile_settings_popup(self, browser):
        wait = browser["wait"]
        profile_button = wait.until(
            EC.element_to_be_clickable(
                # (By.XPATH, "//button[contains(@aria-label, 'profile') or contains(., 'Profile')]")
                (By.XPATH, "//*[@id='profile-settings-popup']")
            )
        )
        profile_button.click()

    def edit_profile(self, browser, email: str, name: str, surname: str, lastname: str):
        """Edit user profile"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Open profile menu
        try:
            self.open_profile_settings_popup(browser)
            time.sleep(self.GLOBAL_DELAY)
        except:
            pass

        # Navigate to settings
        settings_link = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(., 'Параметры профиля')]")
            )
        )
        settings_link.click()

        # Update email
        email_input = wait.until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.send_keys("")
        email_input.send_keys(Keys.CONTROL + "a")
        email_input.send_keys(Keys.DELETE)
        email_input.send_keys(email)

        # Update name
        name_inputs = driver.find_elements(By.NAME, "name")
        surname_inputs = driver.find_elements(By.NAME, "surname")
        lastname_inputs = driver.find_elements(By.NAME, "lastname")
        if name_inputs:
            name_inputs[0].send_keys("")
            name_inputs[0].send_keys(Keys.CONTROL + "a")
            name_inputs[0].send_keys(Keys.DELETE)
            name_inputs[0].send_keys(name)

        if surname_inputs:
            surname_inputs[0].send_keys("")
            surname_inputs[0].send_keys(Keys.CONTROL + "a")
            surname_inputs[0].send_keys(Keys.DELETE)
            surname_inputs[0].send_keys(surname)

        if lastname_inputs:
            lastname_inputs[0].send_keys("")
            lastname_inputs[0].send_keys(Keys.CONTROL + "a")
            lastname_inputs[0].send_keys(Keys.DELETE)
            lastname_inputs[0].send_keys(lastname)

        # Save
        save_button = driver.find_element(
            By.XPATH, "//button[contains(., 'Save') or contains(., 'Сохранить изменения')]"
        )
        save_button.click()

        wait.until(
            EC.presence_of_element_located(
                (By.XPATH, "//div[contains(., 'Профиль успешно обновлен!')]")
            )
        )

        self.MANAGER_USERNAME = email

    def change_password(self, browser, current_password: str, new_password: str):
        """Change password"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find password fields
        try:
            password_tab_button = driver.find_element(
                By.XPATH, "//button[contains(., 'Безопасность')]"
            )
            password_tab_button.click()

            current_pass = wait.until(
                EC.presence_of_element_located((By.NAME, "currentPassword"))
            )
            current_pass.send_keys(current_password)

            new_pass = driver.find_element(By.NAME, "newPassword")
            new_pass.send_keys(new_password)

            confirm_pass = driver.find_element(By.NAME, "confirmPassword")
            confirm_pass.send_keys(new_password)

            # Submit
            change_button = driver.find_element(
                By.XPATH, "//button[contains(., 'Change') or contains(., 'Обновить пароль')]"
            )
            change_button.click()

            wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//div[contains(., 'Пароль успешно обновлен!')]")
                )
            )
        except Exception as e:
            print(f"Warning: Could not change password - {e}")

    def leave_profile_settings_menu(self, browser):
        driver = browser["driver"]
        wait = browser["wait"]

        change_button = driver.find_element(
            By.XPATH, "//button[contains(., 'Вернуться')]"
        )
        change_button.click()

        wait.until(
            EC.presence_of_element_located(
                (By.XPATH, "//button[contains(., 'Мониторинг')]")
            )
        )

    def create_device(self, browser, device_id: str):
        """Create a new device"""
        driver = browser["driver"]
        wait = browser["wait"]

        self.navigate_to_tab(browser, "Устройства")

        create_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Создать устройство') or contains(., 'Add')]")
            )
        )
        create_button.click()
        time.sleep(self.GLOBAL_DELAY)

        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )

        # Fill device ID
        device_id_input = wait.until(
            EC.presence_of_element_located((By.NAME, "deviceId"))
        )
        device_id_input.send_keys(device_id)

        # Submit
        submit_button = driver.find_element(
            By.XPATH, "//button[@type='submit' or contains(., 'Register')]"
        )
        submit_button.click()

        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))
        time.sleep(self.GLOBAL_DELAY)

    def set_metric_threshold(self, browser, threshold_value: str):
        """Set metric threshold for client using Radix slider with arrow keys"""
        driver = browser["driver"]
        wait = browser["wait"]

        self.navigate_to_tab(browser, "Клиенты")

        # Open first client (created client)
        first_row = wait.until(
            EC.presence_of_element_located((By.XPATH, "//table//tbody/tr[1]"))
        )
        preference_button = first_row.find_elements(By.TAG_NAME, 'button')[1]
        preference_button.click()
        time.sleep(self.GLOBAL_DELAY)

        # Set threshold using Radix slider
        try:
            # Wait for slider to be present
            slider_root = wait.until(
                EC.presence_of_element_located((By.ID, "metricThreshold"))
            )

            # Find the slider thumb within the slider root
            # Radix slider structure: Root > Track + Thumb (siblings)
            # The Thumb has role="slider" and aria-valuenow attributes
            slider_thumb = slider_root.find_element(
                By.XPATH, ".//*[@role='slider']"
            )

            # Convert threshold value to integer
            target_value = int(threshold_value)

            # Get current value from aria-valuenow attribute
            current_value_str = slider_thumb.get_attribute("aria-valuenow")
            current_value = int(current_value_str) if current_value_str else 0

            # Click on the slider thumb to focus it
            slider_thumb.click()
            time.sleep(self.GLOBAL_DELAY)

            # Calculate the difference and move using arrow keys
            difference = target_value - current_value

            if difference > 0:
                # Move right using arrow up key (increases value)
                for _ in range(difference):
                    slider_thumb.send_keys(Keys.ARROW_UP)
                    time.sleep(self.GLOBAL_DELAY)
            elif difference < 0:
                # Move left using arrow down key (decreases value)
                for _ in range(abs(difference)):
                    slider_thumb.send_keys(Keys.ARROW_DOWN)
                    time.sleep(self.GLOBAL_DELAY)

            time.sleep(self.GLOBAL_DELAY)

            self.click_element_by_text(browser, 'Сохранить')

            time.sleep(self.GLOBAL_DELAY)

        except Exception as e:
            print(f"✗ Failed to set metric threshold: {str(e)}")
            raise

    def switch_modal_tab(self, browser, tab_name: str):
        """Switch to a tab within a modal dialog"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find tab button within dialog by text content
        # Search for button within the dialog containing the tab name
        tab_button = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    f"//div[@role='dialog']//button[contains(normalize-space(.), '{tab_name}')]"
                )
            )
        )
        tab_button.click()
        time.sleep(0.5)

    def link_device_to_client(self, browser, device_id: str):
        """Link device to client"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Check if ClientThresholdModal is already open
        modal_open = False
        try:
            wait.until(
                EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
            )
            modal_open = True
        except:
            modal_open = False

        # If modal is not open, navigate to Clients and open first client
        if not modal_open:
            self.navigate_to_tab(browser, "Клиенты")
            first_row = wait.until(
                EC.presence_of_element_located((By.XPATH, "//table//tbody/tr[1]"))
            )
            first_row.click()
            time.sleep(1)

        # Switch to Устройства (Devices) tab within the modal
        # Try to find it by Russian text first, then English fallback
        self.switch_modal_tab(browser, "Устройства")

        time.sleep(0.5)

        # Find device row and click the assign button

        # Should be in Devices tab
        # Find device row and click link action
        device_row = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//table//tbody/tr[contains(., 'Устройство #{device_id}')]")
            )
        )

        # Click link button in row
        link_button = device_row.find_element(By.XPATH, "//button[contains(., 'Назначить')]")
        link_button.click()
        time.sleep(self.GLOBAL_DELAY)
        post_metric(int(device_id), 50, "2010-10-10T00:00:00")
        post_metric(int(device_id), 53, "2010-10-10T00:05:00")

    def close_modal_window(self, browser):
        time.sleep(self.GLOBAL_DELAY)
        driver = browser["driver"]
        wait = browser["wait"]
        el = driver.find_element(By.XPATH, "//span[contains(., 'Закрыть')]")
        button = el.find_element(By.XPATH, './..')
        button.click()

        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))

        time.sleep(self.GLOBAL_DELAY)
        # self.click_element_by_text(browser, 'Закрыть', 'span')

    def replace_device(self, browser, old_device_id: str, new_device_id: str, officer_name: str):
        """Replace a device and create replacement task"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find disabled device and open details
        device_row = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//table//tbody/tr[contains(., '{old_device_id}')]")
            )
        )
        device_row.find_element(By.TAG_NAME, 'button').click()
        time.sleep(self.GLOBAL_DELAY)

        # Click Replace Device button
        replace_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Заменить устройство') or contains(., 'Replace Device')]")
            )
        )
        replace_button.click()
        time.sleep(self.GLOBAL_DELAY)

        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )
        time.sleep(self.GLOBAL_DELAY)
        # Select new device from dropdown
        device_selects = driver.find_elements(By.XPATH, "//button[contains(@role, 'combobox')]")
        device_select = device_selects[1]
        device_select.click()
        time.sleep(self.GLOBAL_DELAY)

        device_option_text = f'Устройство #{new_device_id} (Батарея: 100%)'
        device_option = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH,
                 f"//option[contains(., '{device_option_text}')] | //span[contains(., '{device_option_text}')]")
            )
        )
        device_option.click()
        time.sleep(self.GLOBAL_DELAY)

        # Select officer
        officer_selects = driver.find_elements(By.XPATH, "//button[contains(@role, 'combobox')]")
        officer_select = officer_selects[2]
        officer_select.click()
        time.sleep(self.GLOBAL_DELAY)

        officer_option = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//span[contains(., '{officer_name}')]")
            )
        )
        officer_option.click()
        time.sleep(self.GLOBAL_DELAY)

        # Create replacement task
        create_button = driver.find_element(
            By.XPATH, "//button[contains(., 'Создать задачу замены')]"
        )
        create_button.click()

        time.sleep(self.GLOBAL_DELAY)
        self.close_modal_window(browser)


    def get_listbox_item_by_text(self, browser, text: str):
        driver = browser["driver"]
        listbox = driver.find_element(By.XPATH, "//div[@role='listbox']")
        listbox_item_xpath = (f".//option[text()='{text}'] | "
                              f".//div[text()='{text}'] | "
                              f".//span[text()='{text}']")
        return listbox.find_element(By.XPATH, listbox_item_xpath)

    def update_task_status(self, browser, task_type: str, status: str):
        """Update task status to In Progress or Completed"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Find task row
        # task_row = wait.until(
        #     EC.presence_of_element_located(
        #         (By.XPATH, f"(//tr[td[1][div[contains(normalize-space(.), '{task_type}')]]])[1]")
        #     )
        # )
        task_row = self.get_task_row(browser, task_type)
        update_button = task_row.find_elements(By.TAG_NAME, 'button')[1]
        update_button.click()
        time.sleep(self.GLOBAL_DELAY)

        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )

        status_select = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//select | //button[contains(@role, 'combobox')]")
            )
        )
        status_select.click()
        time.sleep(self.GLOBAL_DELAY)

        # Select status
        # status_option = modal.until(
        #     EC.element_to_be_clickable(
        #         (By.XPATH, f"//option[contains(., '{status}')] | //div[contains(., '{status}')]")
        #     )
        # )
        status_option = self.get_listbox_item_by_text(browser, status)
        status_option.click()
        time.sleep(self.GLOBAL_DELAY)

        # Click update button
        update_button = driver.find_element(
            By.XPATH, "//button[contains(., 'Обновить статус')]"
        )
        update_button.click()

        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))
        time.sleep(self.GLOBAL_DELAY)

    def get_task_row(self, browser, task_type: str):
        driver = browser["driver"]
        wait = browser["wait"]
        tbody = wait.until(
            EC.presence_of_element_located((By.TAG_NAME, "tbody"))
        )

        rows = tbody.find_elements(By.TAG_NAME, "tr")

        for row in rows:
            first_td = row.find_elements(By.TAG_NAME, "td")[0]
            task_type_text = first_td.text.strip()

            if task_type in task_type_text:
                return row

    def view_task_details(self, browser, task_type):
        driver = browser["driver"]
        wait = browser["wait"]

        # Find task row
        task_row = self.get_task_row(browser, task_type)
        # task_row = wait.until(
        #     EC.presence_of_element_located(
        #         (By.XPATH, f"//table//tbody/tr[contains(., '{task_type}')]")
        #     )
        # )
        details_button = task_row.find_elements(By.TAG_NAME, 'button')[0]
        details_button.click()
        time.sleep(self.GLOBAL_DELAY)

        self.close_modal_window(browser)

    def create_monitoring_schedule(self, browser, day: str, start_time: str, end_time: str, officer_name: str):
        """
        Create monitoring schedule for a client.

        Args:
            browser: Browser fixture
            day: Full day name in Russian (e.g., "Понедельник")
            start_time: Start time in HH:MM format (e.g., "09:00")
            end_time: End time in HH:MM format (e.g., "17:00")
            officer_name: Officer name - can be full name or in format "surname name[0]. lastname[0]."

        The function:
        1. Navigates to the Мониторинг (Monitoring) tab
        2. Finds and clicks Edit button on the first client card
        3. In the modal, finds the card for the specified day
        4. Clicks the Add button within that day's card
        5. Fills in the time period and selects the officer
        6. Saves the schedule
        """
        driver = browser["driver"]
        wait = browser["wait"]

        # Step 1: Navigate to Мониторинг tab
        self.navigate_to_tab(browser, "Мониторинг")
        time.sleep(self.GLOBAL_DELAY)

        # Step 2: Find and click Edit button on the first client card
        # The ClientMonitoringGanttByWorker displays client cards in a grid
        # Each client card has an Edit button with an Edit icon
        edit_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Редактировать')]")
            )
        )
        edit_button.click()
        time.sleep(self.GLOBAL_DELAY)

        # Step 3: Wait for the ClientMonitoringScheduleModal to open
        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )
        time.sleep(self.GLOBAL_DELAY)

        # Step 4: Find the Add button for the specified day
        # The modal contains cards for each day, structured as:
        # <Card>
        #   <CardHeader>
        #     <CardTitle>{day.label}</CardTitle>
        #     <Button>Add</Button>
        #   </CardHeader>
        #   <CardContent>
        #     <!-- time slots -->
        #   </CardContent>
        # </Card>
        # Find the h3 element with the day name, then find the Add button in its parent Card
        add_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//h3[contains(., '{day}')]/ancestor::div[contains(@class, 'border') and contains(@class, 'rounded')]//button[contains(., 'Добавить')]")
            )
        )
        add_button.click()
        time.sleep(self.GLOBAL_DELAY)

        # Step 5: Fill in the time period
        # After clicking Add, a new time slot entry appears within the day's card
        # Each entry has: start time input, end time input, officer select, delete button

        # Get all time inputs within the day's card
        day_card_element = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//h3[contains(., '{day}')]/ancestor::div[contains(@class, 'border') and contains(@class, 'rounded')]")
            )
        )

        # Find time inputs within this specific day card
        time_inputs = day_card_element.find_elements(By.XPATH, ".//input[@type='time']")

        # The newly added entry should be the last one
        if len(time_inputs) >= 2:
            start_input = time_inputs[-2]
            end_input = time_inputs[-1]

            # Clear and set start time
            start_input.clear()
            start_input.send_keys(start_time)
            time.sleep(self.GLOBAL_DELAY)

            # Clear and set end time
            end_input.clear()
            end_input.send_keys(end_time)
            time.sleep(self.GLOBAL_DELAY)

        # Step 6: Select surveillance officer
        # Find the Select component's trigger button for the newly added entry
        officer_select_buttons = day_card_element.find_elements(
            By.XPATH, ".//button[contains(@role, 'combobox')]"
        )

        if officer_select_buttons:
            # Click the last officer selector (the newly added one)
            officer_select = officer_select_buttons[-1]
            officer_select.click()
            time.sleep(self.GLOBAL_DELAY)

            # Wait for dropdown to open and find the officer option
            # Officers are displayed in the SelectItem with format: "surname name[0]. lastname[0]."
            # The dropdown typically has role="listbox" or is in a popover
            officer_option = wait.until(
                EC.element_to_be_clickable(
                    (By.XPATH, f"//div[contains(@role, 'listbox') or @role='option']//span[contains(., '{officer_name}')] | //span[contains(., '{officer_name}')]")
                )
            )
            officer_option.click()
            time.sleep(self.GLOBAL_DELAY)

        # Step 7: Save the schedule
        # The Save button is in the DialogFooter
        save_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Сохранить')]")
            )
        )
        save_button.click()

        # Wait for modal to close
        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))
        time.sleep(self.GLOBAL_DELAY)

    def check_client_geolocation(self, browser):
        """Check client geolocation through eye icon button"""
        driver = browser["driver"]
        wait = browser["wait"]

        self.navigate_to_tab(browser, "Список клиентов")

        # Find first client row
        first_client_row = wait.until(
            EC.presence_of_element_located((By.XPATH, "//table//tbody/tr[1]"))
        )

        # Click eye icon button to view geolocation
        client_buttons = first_client_row.find_elements(By.TAG_NAME, "button")
        eye_button = client_buttons[0]
        eye_button.click()
        time.sleep(self.GLOBAL_DELAY)

        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )
        time.sleep(self.GLOBAL_DELAY)
        self.close_modal_window(browser)
        # Close modal
        # close_button = modal.find_element(
        #     By.XPATH, ".//button[contains(., 'Закрыть') or contains(@aria-label, 'Close')]"
        # )
        # close_button.click()
        # time.sleep(self.GLOBAL_DELAY)

    def register_violation(self, browser, violation_details: str) -> str:
        """Register a violation"""
        driver = browser["driver"]
        wait = browser["wait"]

        # Click register violation button
        register_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Зарегистрировать нарушение') or contains(., 'Register Violation')]")
            )
        )
        register_button.click()
        time.sleep(self.GLOBAL_DELAY)

        modal = wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
        )

        # Fill violation details
        try:
            details_textarea = driver.find_element(By.XPATH, "//textarea")
            details_textarea.send_keys(violation_details)
            time.sleep(self.GLOBAL_DELAY)
        except:
            pass

        # Submit violation
        submit_button = driver.find_element(
            By.XPATH, "//button[text()='Зарегистрировать']"
        )
        submit_button.click()

        wait.until(EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog']")))
        time.sleep(self.GLOBAL_DELAY)

        return str(int(time.time()))

    def open_notification_center(self, browser):
        """Open the notification center by clicking the bell icon"""
        driver = browser["driver"]
        wait = browser["wait"]

        bell_button = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//*[@id='notifications-center-popup']")
            )
        )
        bell_button.click()
        time.sleep(self.GLOBAL_DELAY)

        # Wait for popover to appear - it has class "w-80"
        wait.until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'w-80') and contains(@class, 'p-0')]"))
        )
        time.sleep(self.GLOBAL_DELAY)

    def get_unread_notification_count(self, browser) -> int:
        """Get the current unread notification count from the bell badge"""
        driver = browser["driver"]

        try:
            # Find the badge element with unread count
            # Badge has classes: absolute, -top-2, -right-2
            badge = driver.find_element(
                By.XPATH, "//button[contains(@class, 'relative')]//div[contains(@class, 'absolute')]"
            )
            badge_text = badge.text.strip()

            # Handle "99+" case
            if "99+" in badge_text:
                return 99

            if badge_text.isdigit():
                return int(badge_text)

            return 0
        except:
            # No badge means 0 unread notifications
            return 0

    def check_notification_exists(self, browser, notification_type: str, notification_text: str = None) -> bool:
        """
        Check if a notification with given type exists in the notification center.
        Returns True if found, False otherwise.
        Args:
            browser: The browser fixture
            notification_type: The type/title of notification (e.g., "Договор создан")
            notification_text: Optional text content to verify (partial match)
        """
        driver = browser["driver"]
        wait = browser["wait"]

        notification_items = driver.find_elements(
                By.XPATH, "//div[contains(@class, 'p-3') and contains(@class, 'border-b')]"
            )

        for item in notification_items:
             # Get the title paragraph (text-sm font-medium)
            title_elem = item.find_element(By.XPATH, ".//p[contains(@class, 'text-sm')]")
            title_text = title_elem.text.strip()

            # Check if notification type matches
            if notification_type in title_text:
                # If additional text check is required, verify it too
                if notification_text:
                    # Get the text content (text-xs below title)
                    text_elems = item.find_elements(By.XPATH, ".//p[contains(@class, 'text-xs')]")
                    for text_elem in text_elems:
                        if notification_text in text_elem.text:
                            return True
                else:
                    return True
        return False

    def wait_for(self, browser):
        driver = browser["driver"]
        wait = browser["wait"]

        notification_items = driver.find_elements(
            By.XPATH, "//div[contains(@class, 'p-3') and contains(@class, 'border-b')]"
        )

        for item in notification_items:
            # Get the title paragraph (text-sm font-medium)
            title_elem = item.find_element(By.XPATH, ".//p[contains(@class, 'text-sm')]")
            title_text = title_elem.text.strip()

    def read_notification(self, browser, notification_type: str) -> str:
        """
        Read (click) a notification by its type and return its full text content.
        Args:
            browser: The browser fixture
            notification_type: The type/title of notification to click
        Returns:
            The full text content of the notification
        """
        driver = browser["driver"]
        wait = browser["wait"]

        try:
            # Find the notification item with matching type
            notification_items = driver.find_elements(
                By.XPATH, "//div[contains(@class, 'p-3') and contains(@class, 'border-b')]"
            )

            for item in notification_items:
                try:
                    # Get the title paragraph (text-sm font-medium)
                    title_elem = item.find_element(By.XPATH, ".//p[contains(@class, 'text-sm')]")

                    if notification_type in title_elem.text:
                        # Get full notification text (type + message + timestamp)
                        full_text = item.text.strip()

                        # Click to mark as read
                        item.click()
                        time.sleep(self.GLOBAL_DELAY)

                        return full_text
                except:
                    continue

            raise ValueError(f"Notification with type '{notification_type}' not found")
        except Exception as e:
            print(f"Error reading notification: {e}")
            raise

    def wait_for_notification(self, browser, notification_type: str, timeout: int = 35) -> bool:
        """
        Wait for a notification to appear in the notification center.
        Automatically opens the notification center and checks periodically.
        Args:
            browser: The browser fixture
            notification_type: The type/title of notification to wait for
            timeout: Maximum time to wait in seconds (default 35 for 30s polling + buffer)
        Returns:
            True if notification found, False if timeout
        """
        driver = browser["driver"]
        start_time = time.time()

        while time.time() - start_time < timeout:
            try:
                # Open notification center
                self.open_notification_center(browser)

                # Check if notification exists
                if self.check_notification_exists(browser, notification_type):
                    driver.find_element(By.XPATH, "//body").send_keys(Keys.ESCAPE)
                    time.sleep(1)
                    return True

                # Close by clicking elsewhere or pressing Escape
                driver.find_element(By.XPATH, "//body").send_keys(Keys.ESCAPE)
                time.sleep(1)

            except Exception as e:
                print(f"Error while waiting for notification: {e}")
                time.sleep(1)

        return False

    def verify_and_read_notification(self, browser, notification_type: str, should_exist: bool = True) -> dict:
        """
        Comprehensive method to verify notification presence and read it.
        Args:
            browser: The browser fixture
            notification_type: The type/title of notification
            should_exist: Whether the notification should exist (default True)
        Returns:
            Dictionary with keys: 'found', 'unread_count', 'notification_text'
        """
        driver = browser["driver"]
        result = {
            'found': False,
            'unread_count': self.get_unread_notification_count(browser),
            'notification_text': None,
            'status': 'UNKNOWN'
        }

        # Open notification center
        self.open_notification_center(browser)
        time.sleep(self.GLOBAL_DELAY)

        # Check if notification exists
        notification_found = self.check_notification_exists(browser, notification_type)
        result['found'] = notification_found

        if notification_found:
            try:
                notification_text = self.read_notification(browser, notification_type)
                result['notification_text'] = notification_text
                result['status'] = 'READ'
                result['unread_count'] = self.get_unread_notification_count(browser)
            except Exception as e:
                result['status'] = f'ERROR: {str(e)}'
        else:
            result['status'] = 'NOT_FOUND'

        # Close notification center
        driver.find_element(By.XPATH, "//body").send_keys(Keys.ESCAPE)
        time.sleep(self.GLOBAL_DELAY)

        # Assert based on expectation
        if should_exist:
            assert notification_found, f"Expected notification '{notification_type}' not found"
        else:
            assert not notification_found, f"Unexpected notification '{notification_type}' found"

        return result

    def test_complete_system_workflow(self, browser):
        """Test the complete system workflow"""
        setup_database()

        self.browser = browser
        self.driver = browser["driver"]
        self.wait = browser["wait"]

        print("\n" + "=" * 70)
        print("Тестирование бизнес-цикла")
        print("=" * 70)

        # Phase 1: Manager Setup
        print("\n[1] Настройка личного профиля и создание аккаунтов сотрудников")
        print("-" * 70)

        self.login(browser, self.MANAGER_USERNAME, self.MANAGER_PASSWORD)
        print("✓ Менеджер авторизовался")

        self.edit_profile(browser, "manager@test.com", self.MANAGER_NAME, self.MANAGER_SURNAME, self.MANAGER_LASTNAME)
        print("✓ Менеджер изменил личные данные")

        self.change_password(browser, self.MANAGER_PASSWORD, self.MANAGER_NEW_PASSWORD)
        print("✓ Менеджер изменил свой пароль")

        self.leave_profile_settings_menu(browser)

        self.create_staff_account(
            browser,
            'Сотрудник слежки',
            self.SURVEILLANCE_OFFICER_NAME,
            self.SURVEILLANCE_OFFICER_SURNAME,
            self.SURVEILLANCE_OFFICER_EMAIL,
            self.SURVEILLANCE_OFFICER_LASTNAME
        )
        print("✓ Аккаунт сотрудника слежки создан")

        self.create_staff_account(
            browser,
            'Сотрудник наказаний',
            self.PUNISHMENT_OFFICER_NAME,
            self.PUNISHMENT_OFFICER_SURNAME,
            self.PUNISHMENT_OFFICER_EMAIL,
            self.PUNISHMENT_OFFICER_LASTNAME
        )
        print("✓ Аккаунт сотрудника наказаний создан")
        self.logout(browser)

        # Phase 2: Client Registration and Contract
        print("\n[2] Регистрация клиента, создание, проверка, подписание договора")
        print("-" * 70)

        self.register(
            browser,
            self.CLIENT_EMAIL,
            self.CLIENT_PASSWORD,
            self.CLIENT_NAME,
            self.CLIENT_SURNAME,
            self.CLIENT_LASTNAME
        )
        print("✓ Клиент зарегистрировался")

        self.login(browser, self.CLIENT_EMAIL, self.CLIENT_PASSWORD)
        print("✓ Клиент авторизовался")

        contract_id = self.create_contract(browser, "Детали представлены в прикрепленном документе")
        print(f"✓ Клиент создал {contract_id}")
        self.logout(browser)
        print("✓ Клиент вышел из системы")

        self.login(browser, self.MANAGER_USERNAME, self.MANAGER_NEW_PASSWORD)
        print("✓ Менеджер авторизовался")

        result = self.verify_and_read_notification(browser, "Договор создан", should_exist=True)
        print(f"✓ Менеджер получил уведомление о созданном договоре - {result['status']}")

        self.navigate_to_tab(browser, "Договоры")

        self.send_contract_to_client(browser, contract_id)
        print("✓ Менеджер отправил договор на подпись клиенту")

        self.logout(browser)
        print("✓ Менеджер вышел из системы")

        self.login(browser, self.CLIENT_EMAIL, self.CLIENT_PASSWORD)
        print("✓ Клиент авторизовался")

        result = self.verify_and_read_notification(browser, "Обновлен статус договора", should_exist=True)
        print(f"✓ Клиент получил уведомление о том, что менеджер проверил договор - {result['status']}")

        self.sign_contract(browser, contract_id)
        print("✓ Договор подписан")
        self.logout(browser)
        print("✓ Клиент вышел из системы")

        # Phase 5: Device Management
        print("\n[3] Создание устройства, привязка устройства к клиенту")
        print("-" * 70)

        self.login(browser, self.MANAGER_USERNAME, self.MANAGER_NEW_PASSWORD)
        print("✓ Менеджер авторизовался")

        result = self.verify_and_read_notification(browser, "Обновлен статус договора", should_exist=True)
        print(f"✓ Менеджер получил уведомление о подписании договора клиентом - {result['status']}")

        self.create_device(browser, self.DEVICE_ID_1)
        print(f"✓ Устройство #{self.DEVICE_ID_1} создано")

        self.set_metric_threshold(browser, "95")
        print("✓ Порог метрики клиента установлен")

        self.link_device_to_client(browser, self.DEVICE_ID_1)
        print("✓ Устройство привязано к клиенту")

        self.close_modal_window(browser)

        # Phase 6: Device Replacement and Task Management
        print("\n[4] Создание задания на замену устройства")
        print("-" * 70)

        # Verify manager received device shutdown notification
        post_off(int(self.DEVICE_ID_1))
        print(f"✓ Система сэмулировала выключение устройства")

        self.wait_for_notification(browser, 'Устройство выключено')

        result = self.verify_and_read_notification(browser, "Устройство выключено", should_exist=True)
        print(f"✓ Менеджер получил уведомление о выключении устройства - {result['status']}")

        self.create_device(browser, self.DEVICE_ID_2)
        print(f"✓ Устройство #{self.DEVICE_ID_2} создано")

        # Replace first device with second device
        officer_full_name = f"{self.PUNISHMENT_OFFICER_SURNAME} {self.PUNISHMENT_OFFICER_NAME} {self.PUNISHMENT_OFFICER_LASTNAME}"
        self.replace_device(browser, self.DEVICE_ID_1, self.DEVICE_ID_2, officer_full_name)
        print("✓ Менеджер создал задание замены устройства")

        self.logout(browser)
        print("✓ Менеджер вышел из системы")

        # Punishment officer accepts replacement task
        print("\n[5] Сотрудник наказаний выполняет задание замены устройств")
        print("-" * 70)

        self.login(browser, self.PUNISHMENT_OFFICER_EMAIL, self.PUNISHMENT_OFFICER_PASSWORD)
        print("✓ Сотрудник наказаний авторизовался")
        # Verify punishment officer received replacement task notification
        result = self.verify_and_read_notification(browser, "Создано задание замены устройства", should_exist=True)
        print(f"✓ Сотрудник наказаний получил уведомлении о новом задании замены устрйоства - {result['status']}")

        task_type = "Замена устройства"

        self.update_task_status(browser, task_type, "В процессе")
        print("✓ Сотрудник наказаний принял задание")

        self.view_task_details(browser, task_type)
        print("✓ Сотрудник наказаний просмотрел детали задания")

        self.update_task_status(browser, task_type, "Выполнено")
        print("✓ Сотрудник наказаний завершил выполнение задания")

        self.logout(browser)
        print("✓ Сотрудник наказаний вышел из системы")

        # Phase 7: Monitoring Schedule Setup
        print("\n[6] Настройка расписания слежки")
        print("-" * 70)

        self.login(browser, self.MANAGER_USERNAME, self.MANAGER_NEW_PASSWORD)
        print("✓ Менеджер авторизовался")

        # Format: "surname name[0]. lastname[0]." (e.g., "Слежки С. П.")
        surveillance_officer_name = f"{self.SURVEILLANCE_OFFICER_SURNAME} {self.SURVEILLANCE_OFFICER_NAME[0]}. {self.SURVEILLANCE_OFFICER_LASTNAME[0]}."
        self.create_monitoring_schedule(browser, "Понедельник", "09:00", "17:00", surveillance_officer_name)
        print("✓ Менеджер задал расписание слежки и сохранил")

        self.logout(browser)
        print("✓ Менеджер вышел из системы")

        # Phase 8: Surveillance Officer Monitoring Workflow
        print("\n[7] Работа сотрудника слежки")
        print("-" * 70)

        self.login(browser, self.SURVEILLANCE_OFFICER_EMAIL, self.SURVEILLANCE_OFFICER_PASSWORD)
        print("✓ Сотрудник слежки авторизовался")

        self.navigate_to_tab(browser, "График мониторинга")
        print("✓ Сотрудник слежки сверился с графиком слежки")

        self.check_client_geolocation(browser)
        print("✓ Сотрудник слежки просмотрел геолокацию клиента")

        violation_id = self.register_violation(browser, "Клиента подюили на перекур коллеги")
        print(f"✓ Сотрудник слежки зарегистрировал нарушение")

        self.logout(browser)
        print("✓ Сотрудник слежки вышел из системы")

        # Phase 9: Punishment Officer Violation Task Management
        print("\n[8] Сотрудник наказаний выполняет задание наказания")
        print("-" * 70)

        self.login(browser, self.PUNISHMENT_OFFICER_EMAIL, self.PUNISHMENT_OFFICER_PASSWORD)
        print("✓ Сотрудник наказаний авторизовался")
        # Verify punishment officer received violation task notification
        result = self.verify_and_read_notification(browser, "Создано задание наказания", should_exist=True)
        print(f"✓ Сотрудник наказаний получил уведомление о новом задании наказания - {result['status']}")

        task_type = "Задача наказания"

        self.update_task_status(browser, task_type, "В процессе")
        print("✓ Сотрудник наказаний принял задание в работу")

        self.view_task_details(browser, task_type)
        print("✓ Сотрудник наказаний просмотрел детели задачи")

        self.update_task_status(browser, task_type, "Выполнено")
        print("✓ Сотрудник наказаний завершил выполнения задания")

        self.logout(browser)
        print("✓ Сотрудник наказаний вышел из системы")

        print("\n" + "=" * 70)
        print("✓ Тестирование бизнес-цикла завершено успешно")
        print("=" * 70 + "\n")
