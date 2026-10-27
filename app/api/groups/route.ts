import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { GroupData } from "@/lib/types";

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection("groups")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    const groups: GroupData[] = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      members: doc.members || [],
      expenses: doc.expenses || [],
      settlements: doc.settlements || [],
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, groups, dbConnected: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database connection failed";
    return NextResponse.json(
      { success: false, error: message, dbConnected: false, groups: [] },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const rawMembers: string[] = Array.isArray(body.members) ? body.members : [];

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: "Group name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const trimmedMembers = rawMembers
      .map((m) => (typeof m === "string" ? m.trim() : ""))
      .filter((m) => m.length > 0);

    if (trimmedMembers.length < 2) {
      return NextResponse.json(
        { success: false, error: "A group must have at least 2 members" },
        { status: 400 }
      );
    }

    // Ensure distinct names
    const uniqueNames = Array.from(new Set(trimmedMembers));
    if (uniqueNames.length < 2) {
      return NextResponse.json(
        { success: false, error: "Member names must be distinct" },
        { status: 400 }
      );
    }

    const memberObjects = uniqueNames.map((memberName, idx) => ({
      id: `m_${Date.now().toString(36)}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      name: memberName,
    }));

    const now = new Date().toISOString();
    const newGroup = {
      name,
      members: memberObjects,
      expenses: [],
      settlements: [],
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const result = await db.collection("groups").insertOne(newGroup);

    const createdGroup: GroupData = {
      id: result.insertedId.toString(),
      ...newGroup,
    };

    return NextResponse.json({ success: true, group: createdGroup, dbConnected: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message, dbConnected: false },
      { status: 503 }
    );
  }
}

