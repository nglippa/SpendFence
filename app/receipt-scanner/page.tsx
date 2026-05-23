"use client";

import Link from "next/link";
import { ArrowRight, ScanLine, ShieldCheck } from "lucide-react";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";

export default function ReceiptScannerPage() {
  return (
    <>
      <PageHeader
        kicker="Receipt scanner"
        title="Review receipt suggestions before saving"
        body="Receipt scanning now lives below manual purchase entry so adding a purchase never requires a receipt."
      />
      <Card>
        <EmptyState
          icon={ScanLine}
          title="Start receipt review from Add Purchase"
          body="Receipt capture now starts from Add Purchase, where you can review merchant, date, total, line items, and category splits before saving."
          action={
            <div className="grid gap-3">
              <div className="rounded-xl bg-white p-3 text-sm font-bold leading-5 text-slate-600 shadow-soft sm:rounded-2xl">
                <ShieldCheck size={17} className="mr-2 inline text-[#327d6d]" />
                Suggestions stay editable until you confirm.
              </div>
              <Button asChild>
                <Link href="/add-purchase">
                  Open Add Purchase <ArrowRight size={17} />
                </Link>
              </Button>
            </div>
          }
        />
      </Card>
    </>
  );
}
