import subprocess
from pathlib import Path
from campaigns.models import Campaign

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def generate_targets():
    script = BASE_DIR / "tools" / "generateMind.js"

    # Get active campaigns ordered by ID to maintain a deterministic compilation index
    active_campaigns = list(Campaign.objects.filter(is_active=True).order_by("id"))
    
    image_paths = []
    for campaign in active_campaigns:
        if campaign.target_image:
            image_paths.append(str(campaign.target_image.path))

    if not image_paths:
        print("No active campaigns with target images to compile.")
        # If there are no target images, ensure we remove any stale .mind files
        outputPath = BASE_DIR / "media" / "targets_mind" / "campaigns.mind"
        if outputPath.exists():
            outputPath.unlink()
        return

    try:
        # Pass the image paths to node generateMind.js as command-line arguments
        result = subprocess.run(
            ["node", str(script)] + image_paths,
            check=True,
            capture_output=True,
            text=True
        )

        print(result.stdout)

        # Update target_index using .update() to bypass Django's signal receivers and avoid recursion
        for index, campaign in enumerate(active_campaigns):
            Campaign.objects.filter(id=campaign.id).update(target_index=index)

        print("campaigns.mind regenerated and target indices updated successfully.")

    except subprocess.CalledProcessError as e:
        print("Node compilation failed with error:")
        print(e.stderr)
        raise e
    except Exception as e:
        print("Mind generation error:", e)
        raise e