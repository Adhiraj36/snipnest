"use client"
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const {userId, getToken} = useAuth()
  const router = useRouter()
  if (!userId || !getToken()) {
    router.push("/sign-in")
  }
  return (
    <>
      <p>HEllo!</p>
      <Link href={"/dashboard"}>Dashboard</Link>
    </>
  );
}
