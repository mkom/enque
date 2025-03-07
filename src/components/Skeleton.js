"use client";
import React from "react";
import { Typography } from "@material-tailwind/react";

export function Skeleton() {
    return (
        <div className="max-w-full animate-pulse py-3">
        <Typography
            as="div"
            variant="h1"
            className="mb-2 h-4 rounded-full bg-gray-300"
        >
            &nbsp;
        </Typography>
        <Typography
            as="div"
            variant="paragraph"
            className="mb-2 h-2 rounded-full bg-gray-300"
        >
            &nbsp;
        </Typography>
        <Typography
            as="div"
            variant="paragraph"
            className="mb-2 h-2  rounded-full bg-gray-300"
        >
            &nbsp;
        </Typography>
        </div>
    );
}