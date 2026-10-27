import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { GroupData, Member } from "@/lib/types";

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
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: "Member name must be at least 2 characters" },
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

    const existingMembers: Member[] = groupDoc.members || [];
    if (existingMembers.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `A member named "${name}" already exists in this group` },
        { status: 400 }
      );
    }

    const newMember: Member = {
      id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name,
    };

    const now = new Date().toISOString();
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { members: newMember as unknown as never },
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

    return NextResponse.json({ success: true, member: newMember, group: updatedGroup }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}

