import { useEffect, useState } from "react";
import API from "../services/api";

function CampaignList() {
    const [campaigns, setCampaigns] = useState([]);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await API.get("/campaigns/");
            setCampaigns(response.data);
        } catch (error) {
            console.error("API Error:", error);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>AR Campaigns</h1>

            {campaigns.map((campaign) => (
                <div
                    key={campaign.id}
                    style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        marginBottom: "20px",
                    }}
                >
                    <h3>{campaign.title}</h3>

                    <img
                        src={campaign.target_image}
                        alt={campaign.title}
                        width="250"
                    />

                    <br />
                    <br />

                    <video width="400" controls>
                        <source
                            src={campaign.video}
                            type="video/mp4"
                        />
                    </video>
                </div>
            ))}
        </div>
    );
}

export default CampaignList;