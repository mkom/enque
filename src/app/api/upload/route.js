// app/api/upload/images/route.js
import cloudinary from "@/lib/cloudinary";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { successResponse,errorResponse } from "@/utils/apiResponse";
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from "@/middleware/apiKeyMiddleware";

export const config = {
  api: {
    bodyParser: false,
  },
};

function bufferToStream(buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
}

export async function POST(req) {
    apiKeyMiddleware(req);

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 'Token not provided', 401);
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return errorResponse('Unauthorized', 'Invalid or expired token', 401);
    }

    const { tenantId, userId: createdBy } = decodedToken;

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return errorResponse('No files uploaded', 'Please upload at least one file', 400);
    }

    const uploadResults = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "uploads",
            timeout: 60000,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        bufferToStream(buffer).pipe(uploadStream);
      });
      uploadResults.push(result);
    }

    return NextResponse.json({ success: true, data: uploadResults });

}
