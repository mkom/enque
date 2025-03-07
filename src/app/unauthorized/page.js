"use client";

export default function Unauthorized() {

  return (
    
    <section className="grid text-center h-screen items-center p-8 bg-light-blue-200">
      <div className="w-full max-w-md m-auto">
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      </div>
    </section>
  );
}
