import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { equalSplit } from "@/lib/settle";
import { GroupData, GroupExpense } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid group ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const paidBy = typeof body.paidBy === "string" ? body.paidBy.trim() : "";
    const amountPaise = Number(body.amountPaise);
    const rawSplitIds: unknown = body.splitMemberIds;

    if (!description) {
      return NextResponse.json(
        { success: false, error: "Expense description is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive integer in paise (greater than 0)" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const groupDoc = await db.collection("groups").findOne({ _id: new ObjectId(id) });

    if (!groupDoc) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const memberIds = (groupDoc.members || []).map((m: { id: string }) => m.id);
    if (!memberIds.includes(paidBy)) {
      return NextResponse.json(
        { success: false, error: "Payer must be a valid member of this group" },
        { status: 400 }
      );
    }

    let splitMemberIds: string[] = memberIds;
    if (Array.isArray(rawSplitIds) && rawSplitIds.length > 0) {
      const validSplits = rawSplitIds.filter((sid) => typeof sid === "string" && memberIds.includes(sid));
      if (validSplits.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one valid group member must be selected for the split" },
          { status: 400 }
        );
      }
      splitMemberIds = validSplits;
    }

    const shares = equalSplit(amountPaise, splitMemberIds);

    const newExpense: GroupExpense = {
      id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      description,
      paidBy,
      amountPaise,
      shares,
      createdAt: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { expenses: newExpense as unknown as never },
        $set: { updatedAt: now },
      }
    );

    const updatedDoc = await db.collection("groups").findOne({ _id: new ObjectId(id) });
    if (!updatedDoc) {
      return NextResponse.json({ success: false, error: "Failed to reload updated group" }, { status: 500 });
    }

    const updatedGroup: GroupData = {
      id: updatedDoc._id.toString(),
      name: updatedDoc.name,
      members: updatedDoc.members || [],
      expenses: updatedDoc.expenses || [],
      settlements: updatedDoc.settlements || [],
      createdAt: updatedDoc.createdAt || now,
      updatedAt: updatedDoc.updatedAt || now,
    };

    return NextResponse.json({ success: true, expense: newExpense, group: updatedGroup }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}

