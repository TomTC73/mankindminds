import unittest
from unittest.mock import patch

from app import AccountAdminClient


class ClaimEmailClientTest(unittest.TestCase):
    def test_sends_selected_recipient_and_displayed_credentials(self):
        client = AccountAdminClient("staff-token")
        credentials = {"username": "creator-123", "temporaryPassword": "temporary-secret"}
        with patch.object(client, "request", return_value={}) as request:
            client.email_claim_credentials("account/id", "creator@example.com", credentials)
        request.assert_called_once_with(
            "POST",
            "/staff/account%2Fid/claim-credentials/email",
            {"email": "creator@example.com", "username": "creator-123", "temporaryPassword": "temporary-secret"},
        )


if __name__ == "__main__":
    unittest.main()
