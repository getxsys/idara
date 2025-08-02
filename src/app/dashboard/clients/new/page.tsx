"use client";

import ClientForm from "@/components/clients/ClientForm";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();

  async function handleSubmit(data: any) {
    // You can POST to your API here
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      router.push("/dashboard/clients");
    } else {
      // handle error
      alert("Failed to create client");
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Add New Client</h1>
      <ClientForm onSubmit={handleSubmit} />
    </div>
  );
}
