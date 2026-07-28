import { useEffect, useRef } from "react";
import axios from "axios";

const API_URL = "https://arproject-iike.onrender.com";

function ARScanner() {
    const initialized = useRef(false);
    const currentMindar = useRef(null);
    const fullscreenVideoRef = useRef(null);
    const zoomLevel = useRef(1);
    const rotationAngle = useRef(0);
    const lastDistance = useRef(0);
    const lastAngle = useRef(0);
    const posX = useRef(0);
    const posY = useRef(0);

    const startX = useRef(0);
    const startY = useRef(0);

    const applyTransform = () => {

        if (!fullscreenVideoRef.current)
            return;

        fullscreenVideoRef.current.style.transform =
            `
        translate(${posX.current}px, ${posY.current}px)
        scale(${zoomLevel.current})
        rotate(${rotationAngle.current}deg)
        `;
    };


    useEffect(() => {

        if (!initialized.current) {
            initialized.current = true;
            startAR();
        }

        return () => {

            if (
                fullscreenVideoRef.current
            ) {

                fullscreenVideoRef.current.remove();

            }

            if (
                currentMindar.current
            ) {

                currentMindar.current.stop();

            }

        };

    }, []);


    const startAR = async () => {

        try {

            const response = await axios.get(
                `${API_URL}/api/campaigns/`
            );

            const campaigns = response.data.filter(
                (campaign) => campaign.is_active
            );

            console.log(
                "Campaigns:",
                campaigns
            );

            await import(
                "mind-ar/dist/mindar-image-three.prod.js"
            );

            const { MindARThree } =
                window.MINDAR.IMAGE;

            const mindarThree =
                new MindARThree({

                    container:
                        document.querySelector(
                            "#ar-container"
                        ),

                    imageTargetSrc:
                        `${API_URL}/media/targets_mind/campaigns.mind?t=${Date.now()}`
                });

            currentMindar.current =
                mindarThree;

            const {
                renderer,
                scene,
                camera
            } = mindarThree;

            const fullscreenVideo =
                document.createElement(
                    "video"
                );
            fullscreenVideoRef.current =
                fullscreenVideo;

            fullscreenVideo.addEventListener(
                "touchstart",
                (event) => {

                    if (
                        event.touches.length === 1
                    ) {

                        startX.current =
                            event.touches[0].clientX;

                        startY.current =
                            event.touches[0].clientY;

                    }

                    if (event.touches.length === 2) {

                        const dx =
                            event.touches[1].clientX -
                            event.touches[0].clientX;

                        const dy =
                            event.touches[1].clientY -
                            event.touches[0].clientY;

                        lastDistance.current =
                            Math.sqrt(dx * dx + dy * dy);

                        lastAngle.current =
                            Math.atan2(dy, dx) *
                            (180 / Math.PI);
                    }

                }
            );
            fullscreenVideo.addEventListener(
                "touchmove",
                (event) => {

                    if (
                        event.touches.length === 1
                    ) {

                        const dx =
                            event.touches[0].clientX -
                            startX.current;
                        const dy =
                            event.touches[0].clientY -
                            startY.current;
                        posX.current += dx;
                        posY.current += dy;

                        applyTransform();

                        fullscreenVideo.style.transform =
                            `
                translate(${posX.current}px, ${posY.current}px)
                scale(${zoomLevel.current})
                rotate(${rotationAngle.current}deg)
                `;

                        startX.current =
                            event.touches[0].clientX;

                        startY.current =
                            event.touches[0].clientY;

                    }

                    if (event.touches.length === 2) {

                        const dx =
                            event.touches[1].clientX -
                            event.touches[0].clientX;

                        const dy =
                            event.touches[1].clientY -
                            event.touches[0].clientY;

                        const distance =
                            Math.sqrt(
                                dx * dx +
                                dy * dy
                            );

                        const angle =
                            Math.atan2(
                                dy,
                                dx
                            ) *
                            (180 / Math.PI);

                        const zoomDelta =
                            distance -
                            lastDistance.current;

                        zoomLevel.current +=
                            zoomDelta * 0.005;

                        if (
                            zoomLevel.current < 1
                        ) {
                            zoomLevel.current = 1;
                        }

                        rotationAngle.current +=
                            angle -
                            lastAngle.current;

                        lastDistance.current =
                            distance;

                        lastAngle.current =
                            angle;

                        applyTransform();
                    }

                },
                {
                    passive: false,
                }
            );
            let lastTap = 0;

            fullscreenVideo.addEventListener(
                "touchend",
                () => {

                    const now = Date.now();

                    if (now - lastTap < 300) {

                        if (fullscreenVideo.paused) {
                            fullscreenVideo.play();
                        } else {
                            fullscreenVideo.pause();
                        }

                    }

                    lastTap = now;
                }
            );

            const resetVideo = () => {

                zoomLevel.current = 1;

                rotationAngle.current = 0;

                posX.current = 0;

                posY.current = 0;

                applyTransform();
            };

            fullscreenVideo.style.position =
                "fixed";

            fullscreenVideo.style.top =
                "0";

            fullscreenVideo.style.left =
                "0";

            fullscreenVideo.style.width =
                "100dvw";

            fullscreenVideo.style.height =
                "100dvh";

            fullscreenVideo.style.objectFit =
                "contain";

            fullscreenVideo.style.zIndex =
                "9999";

            fullscreenVideo.style.display =
                "none";

            fullscreenVideo.playsInline =
                true;

            fullscreenVideo.controls =
                false;
            fullscreenVideo.style.touchAction =
                "none";
            fullscreenVideo.style.transition =
                "transform 0.15s ease-out";

            fullscreenVideo.preload =
                "auto";
            document.body.appendChild(
                fullscreenVideo
            );

            const enterFullscreen = () => {

                if (fullscreenVideo.requestFullscreen) {
                    fullscreenVideo.requestFullscreen();
                }

            };

            let isPlaying = false;

            campaigns.forEach(
                (campaign) => {

                    const anchor =
                        mindarThree.addAnchor(
                            campaign.target_index
                        );

                    anchor.onTargetFound =
                        async () => {

                            if (
                                isPlaying
                            ) return;

                            isPlaying =
                                true;

                            console.log(
                                "Playing:",
                                campaign.title
                            );
                            zoomLevel.current = 1;
                            rotationAngle.current = 0;

                            posX.current = 0;
                            posY.current = 0;

                            applyTransform();
                            fullscreenVideo.pause();

                            fullscreenVideo.src =
                                campaign.video;

                            fullscreenVideo.currentTime =
                                0;

                            fullscreenVideo.style.display =
                                "block";

                            await fullscreenVideo.play();

                            enterFullscreen();


                            try {

                                await fullscreenVideo.play();

                            } catch (
                            err
                            ) {

                                console.error(
                                    err
                                );

                                isPlaying =
                                    false;
                            }

                        };

                    anchor.onTargetLost =
                        () => {

                            // Keep playing
                            // Do nothing

                        };

                }
            );

            fullscreenVideo.onended =
                () => {

                    fullscreenVideo.pause();

                    fullscreenVideo.currentTime =
                        0;

                    fullscreenVideo.style.display =
                        "none";

                    isPlaying =
                        false;

                };

            if (
                window.innerHeight >
                window.innerWidth
            ) {

                rotationAngle.current = 90;

                applyTransform();
            }



            await mindarThree.start();

            renderer.setAnimationLoop(
                () => {

                    renderer.render(
                        scene,
                        camera
                    );

                }
            );

        } catch (error) {

            console.error(
                "AR Error:",
                error
            );

        }

    };

    return (
        <>
            <div
                id="ar-container"
                style={{
                    width: "100vw",
                    height: "100vh",
                    objectFit: "cover",
                }}
            />

            <div
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    zIndex: 10000,
                    display: "flex",
                    gap: "10px",
                }}
            >

            </div >
        </>
    );

}

export default ARScanner;