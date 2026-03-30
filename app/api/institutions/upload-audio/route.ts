import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
    const { audioContentFr, audioContentYor, postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    if (!audioContentFr || !audioContentYor) {
      return NextResponse.json(
        { error: "Both audioContentFr and audioContentYor are required" },
        { status: 400 }
      );
    }

    // Convert base64 to Buffer for upload
    const frBuffer = Buffer.from(audioContentFr, "base64");
    const yorBuffer = Buffer.from(audioContentYor, "base64");

    // Generate unique filenames
    const timestamp = Date.now();
    const frFilename = `fr/audio-${postId}-${timestamp}.mp3`;
    const yorFilename = `yor/audio-${postId}-${timestamp}.mp3`;

    // Upload to Supabase storage
    const [frUpload, yorUpload] = await Promise.all([
      supabaseAdmin.storage
        .from("audio")
        .upload(frFilename, frBuffer, {
          contentType: "audio/mpeg",
          upsert: false,
        }),
      supabaseAdmin.storage
        .from("audio")
        .upload(yorFilename, yorBuffer, {
          contentType: "audio/mpeg",
          upsert: false,
        }),
    ]);

    if (frUpload.error || yorUpload.error) {
      throw new Error(
        `Upload failed: ${frUpload.error?.message || yorUpload.error?.message}`
      );
    }

    // Get public URLs
    const { data: frUrl } = supabaseAdmin.storage
      .from("audio")
      .getPublicUrl(frFilename);

    const { data: yorUrl } = supabaseAdmin.storage
      .from("audio")
      .getPublicUrl(yorFilename);

    // Update post_institutions with audio URLs
    const { error: updateError } = await supabaseAdmin
      .from("post_institutions")
      .update({
        audio_fr: frUrl.publicUrl,
        audio_yor: yorUrl.publicUrl,
      })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      urls: {
        fr: frUrl.publicUrl,
        yor: yorUrl.publicUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload audio",
      },
      { status: 500 }
    );
  }
}
