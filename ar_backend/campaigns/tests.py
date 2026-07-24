from django.test import TestCase
from django.core.exceptions import ValidationError
from unittest.mock import PropertyMock, patch
from campaigns.models import Campaign


class CampaignModelTest(TestCase):
    def test_clean_with_missing_video_file(self):
        # Create a campaign instance where the video file name is specified
        # but the file does not physically exist in storage/disk.
        campaign = Campaign(
            title="Test Campaign",
            target_image="targets/nonexistent_image.jpg",
            video="videos/nonexistent_video.mp4",
        )
        # Calling full_clean() should catch FileNotFoundError and pass size validation.
        # It shouldn't raise FileNotFoundError.
        try:
            campaign.full_clean()
        except FileNotFoundError:
            self.fail("FileNotFoundError was raised when file is missing on disk.")
        except ValidationError:
            # Any other validation errors are fine (e.g. if other fields failed),
            # but we want to make sure FileNotFoundError specifically wasn't raised.
            pass

    def test_clean_with_too_large_video(self):
        campaign = Campaign(
            title="Test Large Video",
            target_image="targets/test_image.jpg",
            video="videos/test_large_video.mp4",
        )
        # Mock the video field's size property to exceed the limit
        with patch('django.db.models.fields.files.FieldFile.size', new_callable=PropertyMock) as mock_size:
            mock_size.return_value = Campaign.MAX_VIDEO_SIZE_BYTES + 1
            
            with self.assertRaises(ValidationError) as ctx:
                campaign.full_clean()
            
            self.assertIn("Video must be below 100 MB.", str(ctx.exception))

    def test_clean_with_invalid_extension(self):
        campaign = Campaign(
            title="Test Invalid Ext",
            target_image="targets/test_image.jpg",
            video="videos/test_video.txt",
        )
        # File doesn't exist, size check will bypass, but extension check must fail.
        with self.assertRaises(ValidationError) as ctx:
            campaign.full_clean()
        
        self.assertIn("Only MP4, MOV and WEBM videos are allowed.", str(ctx.exception))


class CampaignViewTest(TestCase):
    def test_qr_redirect(self):
        import uuid
        campaign_id = uuid.uuid4()
        response = self.client.get(f"/ar/{campaign_id}/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "http://testserver:5173/")

