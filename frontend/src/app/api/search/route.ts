import { NextRequest, NextResponse } from "next/server";

const ES_ENDPOINT = process.env.ES_ENDPOINT || "https://ac85903cc1d440b09fd813ee4e4d16c9.us-central1.gcp.cloud.es.io:443";
const ES_API_KEY = process.env.ES_API_KEY || "";
const INDEX_NAME = "sentinel-detections";

interface DetectionHit {
  _source: {
    object_class: string;
    start_time: number;
    end_time: number;
    duration: number;
    frame_count: number;
    avg_confidence: number;
    start_time_str: string;
    end_time_str: string;
    video_id: string;
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    if (!ES_API_KEY) {
      return NextResponse.json({ error: "Elasticsearch API key not configured" }, { status: 500 });
    }

    // Search for the object class in Elastic
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    const res = await fetch(`${ES_ENDPOINT}/${INDEX_NAME}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${ES_API_KEY}`,
      },
      body: JSON.stringify({
        size: 100,
        query: {
          bool: {
            should: searchTerms.map(term => ({
              wildcard: { object_class: { value: `*${term}*` } }
            })),
            minimum_should_match: 1,
          },
        },
        sort: [{ start_time: "asc" }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Elasticsearch query failed: ${err}`);
    }

    const data = await res.json();
    const hits: DetectionHit[] = data.hits?.hits || [];

    if (hits.length === 0) {
      // Try a broader search — list all available classes
      const aggRes = await fetch(`${ES_ENDPOINT}/${INDEX_NAME}/_search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${ES_API_KEY}`,
        },
        body: JSON.stringify({
          size: 0,
          aggs: {
            classes: {
              terms: { field: "object_class", size: 50 },
            },
          },
        }),
      });

      const aggData = await aggRes.json();
      const classes = (aggData.aggregations?.classes?.buckets || []).map(
        (b: { key: string }) => b.key
      );

      return NextResponse.json({
        found: false,
        query,
        message: `No "${query}" detected in the footage.`,
        available_classes: classes,
      });
    }

    // Group by object class
    const grouped: Record<string, { intervals: { start: number; end: number; start_str: string; end_str: string }[]; total_time: number }> = {};

    for (const hit of hits) {
      const src = hit._source;
      if (!grouped[src.object_class]) {
        grouped[src.object_class] = { intervals: [], total_time: 0 };
      }
      grouped[src.object_class].intervals.push({
        start: src.start_time,
        end: src.end_time,
        start_str: formatTime(src.start_time),
        end_str: formatTime(src.end_time),
      });
      grouped[src.object_class].total_time += src.duration;
    }

    return NextResponse.json({
      found: true,
      query,
      results: grouped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
