"use client";

import { useSession } from "next-auth/react";
import { useAppContext } from "@/contexts/app";

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const { user } = useAppContext();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Next-Auth Session:</h2>
          <p>Status: {status}</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">App Context User:</h2>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

