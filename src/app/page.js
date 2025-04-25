"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useRouter } from 'next/navigation';

const socialPlatforms = [
  { id: "twitter", label: "Twitter", logo: "/X.jpg" },
  { id: "instagram", label: "Instagram", logo: "/insta.jpg" },
  { id: "youtube", label: "YouTube", logo: "/Youtube.png" },
];




export default function Home() {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [hashtag, setHashtag] = useState("");
  const [keywordCount, setKeywordCount] = useState("");
  const [status, setStatus] = useState(""); // '', 'loading', 'done'


  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const router = useRouter();
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        const data = await res.json();
        setSearches(data.collections || []);
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    };

    fetchCollections();
  }, []);


  const handleSubmit = async () => {
    if (!hashtag || selectedPlatforms.length === 0) {
      alert("Please enter a hashtag and select at least one platform.");
      return;
    }

    setStatus("loading");

    const fetchPromises = selectedPlatforms.map((platform) => {
      switch (platform) {
        case "youtube":
          return fetch("/api/youtube", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: hashtag,
              maxResults: Number(keywordCount) || 5,
            }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "YouTube fetch failed");
              console.log("YouTube Data:", data);
            });

        case "twitter":
          return fetch("/api/x", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: hashtag }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Twitter fetch failed");
              console.log("Twitter Data:", data);
            });

        default:
          return Promise.resolve(); // ignore unsupported platforms
      }
    });

    try {
      await Promise.all(fetchPromises);
      setStatus("done");
    } catch (err) {
      console.error("Error in one of the fetches:", err);
      alert(`Error: ${err.message}`);
      setStatus("");
    }
  };


  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-4">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.gif"
            alt="logo"
            width={60}
            height={60}
            className="rounded-full"
          />
          <h2 className="text-2xl font-bold">EM-Social</h2>
        </div>
        <div className="flex gap-4">
          {/* <button className="rounded-lg border-2 p-2 border-white hover:bg-white hover:text-black transition">
            Playground
          </button> */}
          <button className="rounded-lg border-2 p-2 border-black bg-white text-black hover:bg-gray-200 transition"
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Input Card */}
      <Card className="bg-gray-900 border-gray-700 text-white mb-6 max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Start your Search</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="hashtag">Hashtag</Label>
            <Input
              id="hashtag"
              placeholder="#example"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keywords">No. of Keywords</Label>
            <Input
              id="keywords"
              type="number"
              placeholder="5"
              value={keywordCount}
              onChange={(e) => setKeywordCount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl mx-auto">
        {socialPlatforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);

          return (
            <><Card
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`cursor-pointer transition-all rounded-xl shadow-md border-2 text-center flex flex-col items-center justify-center gap-2 py-6 hover:scale-[1.02] ${isSelected
                ? "border-blue-500 bg-blue-900"
                : "border-gray-700 bg-gray-800 hover:bg-gray-700"}`}
            >
              <Image
                src={platform.logo}
                alt={platform.label}
                width={24}
                height={24}
                className="rounded-sm" />
            </Card>
            </>
          );
        })}
      </div>
      <div className="flex flex-col items-center mt-6 gap-2">
        <button
          className="text-lg border-md p-4 text-white font-semibold border border-white rounded-lg hover:bg-white hover:text-black transition disabled:opacity-50"
          onClick={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Loading..." : status === "done" ? "Completed" : "Submit"}
        </button>

      </div>
      <br />
      <div className="py-4 text-lg font-semibold">
        Recent Searches :
        <ul className="list-disc list-inside">
          {searches.length > 0 ? (
            searches.map((name, idx) => (
              <li
                key={idx}
                className="cursor-pointer text-blue-400 hover:underline"
                onClick={() => router.push(`/${name}`)}
              >
                {name}
              </li>
            ))
          ) : (
            <li>Loading collections...</li>
          )}
        </ul>
      </div>

    </div>
  );
}
