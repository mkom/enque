// Components UploadFile.js
"use client";
import { useDropzone } from "react-dropzone";
import { useCallback, useEffect, useState } from "react";
import { Typography } from "@material-tailwind/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const MAX_FILE_SIZE_MB = 2;

export default function UploadFile({ files, images, setFiles, handleRemove }) {
    const [errorMessage, setErrorMessage] = useState("");

    // Always derive existingFiles from images prop, not from state
    const existingFiles = (() => {
        if (Array.isArray(images)) {
            return images;
        }
        if (typeof images === "string" && images) {
            let cleaned = images.replace(/[{}]/g, "");
            if (!cleaned.includes(",")) {
                cleaned = cleaned.trim().replace(/^"|"$/g, "");
                return cleaned ? [cleaned] : [];
            }
            return cleaned
                .split(",")
                .map(s => s.trim().replace(/^"|"$/g, ""))
                .filter(Boolean);
        }
        return [];
    })();

    const onDrop = useCallback((acceptedFiles, fileRejections) => {
        setErrorMessage("");

        const oversizedFiles = fileRejections
            .map((rej) => rej.file)
            .filter((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);

        if (oversizedFiles.length > 0) {
            setErrorMessage(`Ukuran file tidak boleh lebih dari ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        const mappedFiles = acceptedFiles.map((file) => ({
            file,
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }));
        setFiles((prev) => [...prev, ...mappedFiles]);
    }, [setFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            "image/*": [],
            "application/pdf": [],
        },
        maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    });

    useEffect(() => {
        // Cleanup URL object
        return () => {
            files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        };
    }, [files]);

    return (
        <>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
            >
                <input {...getInputProps()} />
                <Typography variant="small" className="font-medium" color="blue-gray">
                    {isDragActive
                        ? "Lepaskan file di sini..."
                        : "Drag & drop gambar atau PDF, atau klik untuk memilih"}
                </Typography>
                <Typography variant="small" color="gray">
                    Hanya file bertipe <strong>image</strong> dan <strong>PDF</strong>.
                </Typography>
            </div>

            {errorMessage && (
                <p className="text-red-500 text-sm mt-1 ml-1">{errorMessage}</p>
            )}

            {(files.length > 0 || (files.length === 0 && existingFiles.length > 0)) && (
                <div className="flex justify-start gap-4 mt-6 flex-wrap">
                    {files.length > 0
                        ? files.map((entry, index) => (
                            <div
                                key={index}
                                className="relative border rounded-md p-2 shadow-sm w-24 bg-gray-50"
                            >
                                {entry.preview ? (
                                    <Zoom>
                                        <img
                                            src={entry.preview}
                                            alt={`Preview ${index}`}
                                            className="w-24 h-24 object-cover cursor-pointer rounded"
                                        />
                                    </Zoom>
                                ) : (
                                    <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
                                        {entry.file.name}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="h-8 absolute cursor-pointer top-0 right-2"
                                    onClick={() => handleRemove(index)}
                                >
                                    <TrashIcon className="h-4 w-4 text-red-500" />
                                </button>
                            </div>
                        ))
                        : existingFiles.map((url, index) => (
                            <div
                                key={index}
                                className="relative border rounded-md p-2 shadow-sm w-24 bg-gray-50"
                            >
                                <Zoom>
                                    <img
                                        src={url}
                                        alt={`Existing ${index}`}
                                        className="w-24 h-24 object-cover cursor-pointer rounded"
                                    />
                                </Zoom>
                                {/* No remove button for existing files, or add one if needed */}
                            </div>
                        ))
                    }
                </div>
            )}
        </>
    );
}
