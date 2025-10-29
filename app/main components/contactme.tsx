"use client";

import React, { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { MessageItem } from "../types/messages";

export default function ContactMe() {
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | {
    type: "success" | "error";
    msg: string;
  }>(null);

  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const submit = async () => {
    setStatus(null);

    if (!validateEmail(email)) {
      setStatus({
        type: "error",
        msg: "Please put in your email so I can contact you!",
      });
      return;
    }
    if (!content.trim()) {
      setStatus({
        type: "error",
        msg: "Please enter a message so I can contact you!.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const t: Omit<MessageItem, "id"> = {
        email: email.trim(),
        content: content.trim(),
        read: false,
        createdAt: serverTimestamp() as unknown as Timestamp,
        deleted: false,
      };
      await addDoc(collection(db, "messages"), t);

      setEmail("");
      setContent("");
      setStatus({
        type: "success",
        msg: "Thanks! I have received your message. I will email you as soon as I can!",
      });
    } catch (error) {
      console.error(error);
      setStatus({
        type: "error",
        msg: "Something went wrong while sending your message. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto mt-24 flex w-full max-w-2xl flex-col gap-3 md:gap-6 overflow-hidden px-6 pb-12 sm:px-10">
      <h2 className="text-2xl font-semibold">Contact Me</h2>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Enter an email I can message
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
          placeholder="johndoe@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium">
          And a message for me
        </label>
        <textarea
          id="message"
          rows={6}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
          placeholder="Hey Rhenji..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
        />
      </div>

      {/* Status */}
      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {status?.type === "success" && (
          <p className="text-green-700">{status.msg}</p>
        )}
        {status?.type === "error" && (
          <p className="text-red-700">{status.msg}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-row-reverse">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
