"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string;

  initialProfile: {
    fullName: string;
    headline: string;
    phone: string;
    location: string;
  };
};

export function ProfileForm({
  userId,
  email,
  initialProfile,
}: ProfileFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [location, setLocation] = useState(initialProfile.location);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        headline: headline.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setSuccessMessage("Profile updated successfully.");

    setIsSaving(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-500"
        />

        <p className="mt-2 text-xs text-slate-500">
          Your authentication email cannot be changed here.
        </p>
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Full name
        </label>

        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={isSaving}
          placeholder="Your full name"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="headline"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Professional headline
        </label>

        <input
          id="headline"
          type="text"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          disabled={isSaving}
          placeholder="Software Engineering Undergraduate"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Phone
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isSaving}
            placeholder="+94 77 123 4567"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Location
          </label>

          <input
            id="location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={isSaving}
            placeholder="Colombo, Sri Lanka"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}