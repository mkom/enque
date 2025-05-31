import { Storage } from "@google-cloud/storage";
import path from "path";
import { apiKeyMiddleware } from "@/middleware/apiKeyMiddleware";

const storage = new Storage({
  keyFilename: path.join(process.cwd(), "gcs-key.json"), // Path ke service account key
});

const bucketName = "omqoe"; // Ganti dengan nama bucket-mu

export async function POST(req) {

  try {
    apiKeyMiddleware(req);
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = `transfer_proof/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(fileName);

    // Upload file ke GCS
    await blob.save(Buffer.from(buffer), {
      metadata: { contentType: file.type },
    });

    // Buat file publik
    await blob.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    //console.log("Public URL:", publicUrl); 

    return new Response(JSON.stringify({ url: publicUrl }), { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
  }
}
