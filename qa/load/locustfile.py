"""Locust load scenarios for CRIMEMAP.

Frontend:   locust -f load/locustfile.py --host http://localhost:5173
Backend:    locust -f load/locustfile.py --host http://localhost:8000

Tasks mirror the shapes of real user sessions: browse the map, then pull the
decision-support payloads the views render. Never point this at a production
instance with live data.
"""

from __future__ import annotations

from locust import HttpUser, between, task


class CrimeMapUser(HttpUser):
    """Frontend browse: import the SPA and render its data grid."""

    wait_time = between(1, 4)

    @task(3)
    def browse_home(self):
        # Vite dev serves the HTML shell; the data loads from the module graph.
        with self.client.get("/", catch_response=True) as response:
            if response.status_code not in (200, 304):
                response.failure(f"unexpected status {response.status_code}")
            elif "CRIMEMAP" not in response.text and "<!doctype html>" not in response.text:
                response.failure("page did not return the HTML shell")

    @task(1)
    def asset_bundle(self):
        with self.client.get("/src/main.tsx", catch_response=True) as response:
            if response.status_code not in (200, 304):
                response.failure(f"unexpected status {response.status_code}")


class ApiUser(HttpUser):
    """Backend analytics: the read endpoints the views depend on."""

    wait_time = between(0.2, 1)

    @task(4)
    def risk_zones(self):
        self.client.get("/risk/zones")

    @task(3)
    def changes(self):
        self.client.get("/changes")

    @task(3)
    def recommendations(self):
        self.client.get("/recommendations")

    @task(2)
    def patrol_plan(self):
        self.client.get("/patrol/plan")

    @task(2)
    def stats(self):
        self.client.get("/stats/dashboard")

    @task(1)
    def forecast(self):
        self.client.get("/risk/forecast")