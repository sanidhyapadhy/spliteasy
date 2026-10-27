import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { GroupData } from "@/lib/types";

export async function GET(
  _request: Request,
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

    const db = await getDb();
    const doc = await db.collection("groups").findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const group: GroupData = {
      id: doc._id.toString(),
      name: doc.name,
      members: doc.members || [],
      expenses: doc.expenses || [],
      settlements: doc.settlements || [],
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    };

    return NextResponse.json({ success: true, group });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}

export async function PATCH(
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
    const name = typeof body.name === "string" ? body.name.trim() : null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: "Group name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const db = await getDb();
    const result = await db.collection("groups").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, updatedAt: now } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const group: GroupData = {
      id: result._id.toString(),
      name: result.name,
      members: result.members || [],
      expenses: result.expenses || [],
      settlements: result.settlements || [],
      createdAt: result.createdAt || now,
      updatedAt: result.updatedAt || now,
    };

    return NextResponse.json({ success: true, group });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}

export async function DELETE(
  _request: Request,
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

    const db = await getDb();
    const result = await db.collection("groups").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Group deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}


