import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Franze William Calleja — Full-Stack Software Engineer",
    short_name: "Franze Calleja",
    description:
      "Personal portfolio of Franze William Calleja featuring full-stack systems, cloud architecture, mobile and web projects, and technical skills.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efdd",
    theme_color: "#0E100F",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
