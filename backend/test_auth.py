import requests

BASE_URL = "http://127.0.0.1:8000"

def test_signup():
    payload = {
        "email": "mahi@example.com",
        "password": "test123"
    }

    response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
    print("Signup status:", response.status_code)
    print("Signup response:", response.json())


def test_login():
    payload = {
        "email": "testuser@example.com",
        "password": "test1234"
    }

    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print("Login status:", response.status_code)
    print("Login response:", response.json())


if __name__ == "__main__":
    test_signup()
    print("-" * 40)
    test_login()
