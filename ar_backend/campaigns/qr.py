import qrcode
from io import BytesIO

from django.core.files import File


def generate_qr(instance):
    """
    Generate and save a QR code for a campaign.
    """

    url = f"http://127.0.0.1:8000/ar/{instance.campaign_id}/"

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=5,
    )

    qr.add_data(url)
    qr.make(fit=True)

    image = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    buffer = BytesIO()

    image.save(buffer, format="PNG")

    filename = f"{instance.campaign_id}.png"

    instance.qr_code.save(
        filename,
        File(buffer),
        save=False
    )