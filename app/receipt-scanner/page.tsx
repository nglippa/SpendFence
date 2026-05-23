"use client";

import Link from "next/link";
import { ArrowRight, ScanLine, ShieldCheck } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";

export default function ReceiptScannerPage() {
  return (
    <>
      <PageHeader
        kicker="Receipt scanner"
        title="Review receipt suggestions before saving"
        body="Receipt scanning now lives below manual purchase entry so adding a purchase never requires a receipt."
      />
      <Card>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#183f36] sm:h-12 sm:w-12 sm:rounded-2xl">
            <ScanLine size={21} />
          </div>
          <div>
            <h2 className="text-lg font-black sm:text-xl">Scan from the Add page</h2>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:leading-6">
              Upload a receipt, analyze it, review merchant/date/total, edit split category allocations, then confirm before SpendFence saves anything.
            </p>
            <div className="mt-3 rounded-xl bg-[#f7faf7] p-3 text-sm font-bold leading-5 text-slate-600 sm:rounded-2xl">
              <ShieldCheck size={17} className="mr-2 inline text-[#327d6d]" />
              Receipt suggestions can be reviewed and edited before saving.
            </div>
            <Button asChild className="mt-4">
              <Link href="/add-purchase">
                Open Add Purchase <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
