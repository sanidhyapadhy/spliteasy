import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { GroupData } from "@/lib/types";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const { id, expenseId } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid group ID format" },
        { status: 400 }
      );
    }

    if (!expenseId || typeof expenseId !== "string" || expenseId.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid expense ID" },
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

    const existingExpenses: { id: string }[] = groupDoc.expenses || [];
    const found = existingExpenses.some((e) => e.id === expenseId);
    if (!found) {
      return NextResponse.json(
        { success: false, error: "Expense not found in this group" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { expenses: { id: expenseId } as never },
        $set: { updatedAt: now },
      }
    );

    const updatedDoc = await db.collection("groups").findOne({ _id: new ObjectId(id) });
    if (!updatedDoc) {
      return NextResponse.json({ success: false, error: "Failed to reload group" }, { status: 500 });
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

    return NextResponse.json({ success: true, group: updatedGroup });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 503 }
    );
  }
}

