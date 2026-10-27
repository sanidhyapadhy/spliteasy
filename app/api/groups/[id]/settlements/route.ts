import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { GroupData, GroupSettlement } from "@/lib/types";

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
    const from = typeof body.from === "string" ? body.from.trim() : "";
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const amountPaise = Number(body.amountPaise);

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: "Both 'from' and 'to' members are required" },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json(
        { success: false, error: "Sender and recipient cannot be the same member" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "Settlement amount must be a positive integer in paise (greater than 0)" },
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
    if (!memberIds.includes(from) || !memberIds.includes(to)) {
      return NextResponse.json(
        { success: false, error: "Both members must belong to this group" },
        { status: 400 }
      );
    }

    const newSettlement: GroupSettlement = {
      id: `set_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      from,
      to,
      amountPaise,
      createdAt: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { settlements: newSettlement as unknown as never },
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

    return NextResponse.json({ success: true, settlement: newSettlement, group: updatedGroup }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}

