"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  HiDocumentText,
  HiTag,
  HiEye,
  HiCheckCircle,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { RssFeedPreviewResult, FieldMappings } from "@/lib/api";

interface FieldMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: RssFeedPreviewResult | null;
  onConfirm: (mappings: FieldMappings) => void;
}

function truncate(text: string | undefined | null, maxLength: number): string {
  if (!text) return "";
  // Strip HTML tags for preview
  const stripped = text.replace(/<[^>]*>/g, "");
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength) + "...";
}

function getFieldLength(value: any): string {
  if (!value) return "empty";
  if (typeof value === "string") {
    return `${value.length} chars`;
  }
  return "N/A";
}

export function FieldMappingDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
}: FieldMappingDialogProps) {
  const [titleField, setTitleField] = useState<string>("title");
  const [contentField, setContentField] = useState<string>("description");

  // Reset to suggested mappings when preview changes
  useEffect(() => {
    if (preview?.sampleItem?.suggestedMapping) {
      setTitleField(preview.sampleItem.suggestedMapping.titleField);
      setContentField(preview.sampleItem.suggestedMapping.contentField);
    }
  }, [preview]);

  const rawFields = preview?.sampleItem?.rawFields || {};
  const availableFields = useMemo(() => Object.keys(rawFields), [rawFields]);

  // Filter fields suitable for title (typically shorter text fields)
  const titleFieldOptions = useMemo(() => {
    return availableFields.filter((field) => {
      const value = rawFields[field];
      return typeof value === "string" && value.length > 0;
    });
  }, [availableFields, rawFields]);

  // Filter fields suitable for content (typically longer text fields)
  const contentFieldOptions = useMemo(() => {
    return availableFields.filter((field) => {
      const value = rawFields[field];
      return typeof value === "string" && value.length > 0;
    });
  }, [availableFields, rawFields]);

  const handleConfirm = () => {
    onConfirm({
      titleField,
      contentField,
    });
    onOpenChange(false);
  };

  const handleUseDefaults = () => {
    if (preview?.sampleItem?.suggestedMapping) {
      setTitleField(preview.sampleItem.suggestedMapping.titleField);
      setContentField(preview.sampleItem.suggestedMapping.contentField);
    }
  };

  if (!preview || !preview.sampleItem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HiDocumentText className="size-5 text-primary" />
            Configure Field Mapping
          </DialogTitle>
          <DialogDescription>
            Select which RSS fields should be used for the article title and
            content. This helps ensure your imported articles display correctly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feed Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="outline" className="text-xs">
              {preview.itemCount} items
            </Badge>
            {preview.feedTitle && (
              <span className="text-sm text-gray-600 truncate">
                {preview.feedTitle}
              </span>
            )}
          </div>

          {/* Title Field Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <HiTag className="size-4 text-gray-500" />
              Title Field
            </label>
            <Select
              value={titleField}
              onChange={(e) => setTitleField(e.target.value)}
              className="w-full"
            >
              {titleFieldOptions.map((field) => (
                <option key={field} value={field}>
                  {field} ({getFieldLength(rawFields[field])})
                </option>
              ))}
            </Select>
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Preview:</p>
              <p className="text-sm text-blue-900 font-medium">
                {truncate(rawFields[titleField], 100) || "(empty)"}
              </p>
            </div>
          </div>

          {/* Content Field Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <HiDocumentText className="size-4 text-gray-500" />
              Content Field
            </label>
            <Select
              value={contentField}
              onChange={(e) => setContentField(e.target.value)}
              className="w-full"
            >
              {contentFieldOptions.map((field) => (
                <option key={field} value={field}>
                  {field} ({getFieldLength(rawFields[field])})
                </option>
              ))}
            </Select>
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-xs text-emerald-600 mb-1">Preview:</p>
              <p className="text-sm text-emerald-900 line-clamp-3">
                {truncate(rawFields[contentField], 250) || "(empty)"}
              </p>
            </div>
          </div>

          {/* Article Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <HiEye className="size-4 text-gray-500" />
              Article Preview
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {truncate(rawFields[titleField], 80) || "Untitled Article"}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-4">
                {truncate(rawFields[contentField], 300) || "No content available"}
              </p>
            </div>
          </div>

          {/* Suggested Mapping Info */}
          {preview.sampleItem.suggestedMapping && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <HiCheckCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">Suggested Mapping</p>
                <p>
                  Title: <code className="px-1 py-0.5 bg-amber-100 rounded">{preview.sampleItem.suggestedMapping.titleField}</code>,{" "}
                  Content: <code className="px-1 py-0.5 bg-amber-100 rounded">{preview.sampleItem.suggestedMapping.contentField}</code>
                </p>
                <button
                  onClick={handleUseDefaults}
                  className="mt-2 text-amber-700 underline hover:no-underline"
                >
                  Use suggested mapping
                </button>
              </div>
            </div>
          )}

          {/* Available Fields Reference */}
          <details className="group">
            <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              View all available fields ({availableFields.length})
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {availableFields.map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className={cn(
                      "text-xs cursor-default",
                      field === titleField && "bg-blue-100 border-blue-300",
                      field === contentField && "bg-emerald-100 border-emerald-300"
                    )}
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          </details>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <HiCheckCircle className="size-4 mr-2" />
            Apply Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
