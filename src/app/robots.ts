import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/panel", "/api", "/login", "/login-local", "/registro", "/registro-local"],
      },
    ],
    sitemap: "https://deseocomer.com/sitemap.xml",
  };
}
