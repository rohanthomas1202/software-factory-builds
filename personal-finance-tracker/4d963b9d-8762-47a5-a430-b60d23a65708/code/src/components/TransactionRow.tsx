"use client";

import { useState } from "react";
import { Transaction, Category, TransactionType } from "@/lib/types";
import { format } from "date-fns";

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  isEditing: boolean;
}

export default function TransactionRow({
  transaction,
  categories,
  onUpdate,
  onDelete,
  isUpdating,
  onEditStart,
  onEditCancel,
  isEditing,
}: TransactionRowProps) {
  const [editNote, setEditNote] = useState(transaction.note || "");
  const [editCategoryId, setEditCategoryId] = useState(transaction.categoryId || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const amountInDollars = (transaction.amountCents / 100).toFixed(2);
  const transactionDate = new Date(transaction.transactionDate);
  const category = categories.find((c) => c.id === transaction.categoryId);

  const handleSave = async () => {
    const updates: Partial<Transaction> = {};
    if (editNote !== transaction.note) {
      updates.note = editNote;
    }
    if (editCategoryId !== transaction.categoryId) {
      updates.categoryId = editCategoryId || null;
    }
    if (Object.keys(updates).length > 0) {
      await onUpdate(transaction.id, updates);
    }
    onEditCancel();
  };

  const handleCancel = () => {
    setEditNote(transaction.note || "");
    setEditCategoryId(transaction.categoryId || "");
    onEditCancel();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(transaction.id);
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      {isEditing ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Category Edit */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isUpdating}
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note Edit */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isUpdating}
              placeholder="Add a note"
            />
          </div>

          {/* Edit Actions */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Date */}
          <div className="w-32 flex-shrink-0">
            <div className="text-sm font-medium text-gray-900">
              {format(transactionDate, "MMM d, yyyy")}
            </div>
            <div className="text-sm text-gray-500">{format(transactionDate, "EEEE")}</div>
          </div>

          {/* Amount */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  transaction.type === "INCOME"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {transaction.type}
              </div>
              <span
                className={`text-lg font-semibold ${
                  transaction.type === "INCOME" ? "text-green-700" : "text-red-700"
                }`}
              >
                {transaction.type === "INCOME" ? "+" : "-"}${amountInDollars}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="flex-1">
            {category ? (
              <div className="flex items-center">
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.colorHex || "#6b7280" }}
                />
                <span className="text-sm text-gray-900">{category.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No category</span>
            )}
          </div>

          {/* Note */}
          <div className="flex-1">
            <div className="text-sm text-gray-600">
              {transaction.note || <span className="italic text-gray-400">No note</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEditStart}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Note/Category
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Delete Transaction</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}