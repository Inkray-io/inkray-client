'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { draftsAPI } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { log } from '@/lib/utils/Logger';
import { DraftArticle, TemporaryImage } from "@/types/article";
import { useThrottledCallback } from "@/hooks/useThrottledCallback";
import { transformBackendDraftMediaUrlForUrl } from "@/lib/utils/mediaUrlTransform";


export default function useDraftMode() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ id, setId ] = useState<string | null>(null);
  const [ error, setError ] = useState<string | null>(null);
  const [ draft, setDraft ] = useState<DraftArticle | null>(null);
  const [ loadingDraft, setLoadingDraft ] = useState<boolean>(false);
  const [ uploadingImage, setUploadingImage ] = useState<boolean>(false);
  const [ deletingImage, setDeletingImage ] = useState<boolean>(false);
  const [ savingDraft, setSavingDraft ] = useState<boolean>(false);
  const [ deletingDraft, setDeletingDraft ] = useState<boolean>(false);
  const [ settingEditLock, setSettingEditLock ] = useState<boolean>(false);
  const [ schedulingDraft, setSchedulingDraft ] = useState<boolean>(false);
  const [ cancellingSchedule, setCancellingSchedule ] = useState<boolean>(false);

  useEffect(() => {
    if (pathname !== '/create' && pathname !== 'draft') {
      return;
    }
    const idParam = searchParams.get("draft-id");
    if (idParam) {
      setId(idParam);
    }
  }, [ searchParams, pathname ]);

  // Method to load a draft article by ID
  const loadDraft = useCallback(async (draftId: string) => {
    try {
      setLoadingDraft(true);
      const response = await draftsAPI.get(draftId);
      if (response?.data?.data) {
        const draft = response.data.data;
        setDraft(draft);
        setError(null);
      } else {
        setDraft(null);
        setError('Draft not found');
      }
    } catch (err) {
      setDraft(null);
      setError((err instanceof Error ? err.message : 'Failed to load draft'));
      log.error('Draft load error:', err);
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  useEffect(() => {
    if (id && draft?.id !== id) {
      loadDraft(id);
    }
  }, [ id, draft, loadDraft ]);

  const lastSavedAt = useMemo(() => {
    if (!draft || !draft.updatedAt) {
      return null;
    }
    return new Date(draft.updatedAt);
  }, [ draft ]);


  // Internal method to create a draft article
  const createDraft = async (title: string, content: string) => {
    console.log('Creating new draft...');
    try {
      const response = await draftsAPI.create({
        title,
        content,
      });
      setError(null);
      if (response?.data?.data) {
        setDraft(response.data.data);
      }
      if (response?.data?.data?.id) {
        window.history.replaceState(null, '', `create?draft-id=${response.data.data.id}`);
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Failed to create draft'));
      log.error('Draft creation error:', err);
    }
  };

  const updateDraft = async (id: string, title: string, content: string) => {
    log.info(`Updating draft ${id}...`);
    try {
      const res = await draftsAPI.update(id, { title, content });
      setError(null);
      if (res?.data?.data) {
        const draft = res.data.data;
        setDraft(draft);
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Failed to update draft'));
      log.error('Draft update error:', err);
    }
  };

  // Toggle whether the draft allows editing by others / further editing
  const setEditLock = async (allow: boolean) => {
    if (!draft?.id) {
      setError('No draft available to set edit lock');
      return false;
    }
    setSettingEditLock(true);
    try {
      await draftsAPI.setEditLock(draft.id, allow);
      // Update local draft state to reflect new lock status
      setDraft(prev => prev ? { ...prev, allowDraftEditing: allow } : prev);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set edit lock');
      log.error('Set edit lock error:', err);
      return false;
    } finally {
      setSettingEditLock(false);
    }
  };

  const saveDraftStateThrottled = useThrottledCallback(async (title: string, content: string) => {
    setError(null);
    setSavingDraft(true);
    try {
      if (!id) {
        await createDraft(title, content);
        return;
      }

      await updateDraft(id, title, content);
    } finally {
      setSavingDraft(false);
    }

  }, [ id ], 15_000);

  const computeImageDraftUrl = useCallback((url: string) => {
    if (!id) { return url; }
    return transformBackendDraftMediaUrlForUrl(url, id);
  }, [ id ]);

  const uploadDraftImage = async (image: TemporaryImage): Promise<string | null> => {
    if (!draft) { return null; }
    setUploadingImage(true);
    try {
      const response = await draftsAPI.uploadImage(draft.id, image.file, image.imageId);
      const imageId = response.data?.data?.imageId;

      if (imageId) {
        // Return the backend proxy URL for the uploaded image (using UUID)
        return `${CONFIG.API_URL}/articles/draft/${draft.id}/media/${imageId}`;
      }
      return null;
    } catch (e) {
      log.error('Draft image upload error:', e);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteDraftImage = async (imageId: string) => {
    if (!draft) { return false; }
    setDeletingImage(true);
    try {
      await draftsAPI.deleteImage(draft.id, imageId);
      return true;
    } catch (err) {
      log.error('Draft image delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete draft image');
      return false;
    } finally {
      setDeletingImage(false);
    }
  };


  const deleteDraft = async (draftId?: string) => {
    const targetId = draftId ?? id;
    if (!targetId) {
      setError('No draft id provided');
      return false;
    }

    setDeletingDraft(true);
    try {
      await draftsAPI.delete(targetId);
      // Clear local state
      setDraft(null);
      setId(null);
      setError(null);
      // Remove draft-id from URL if present
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname || '/create';
        window.history.replaceState(null, '', currentPath);
      }
      return true;
    } catch (err) {
      log.error('Draft delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
      return false;
    } finally {
      setDeletingDraft(false);
    }
  };

  // Schedule a draft for automatic publishing
  const scheduleDraft = async (scheduledAt: Date): Promise<boolean> => {
    if (!draft?.id) {
      setError('No draft available to schedule');
      return false;
    }

    setSchedulingDraft(true);
    try {
      const response = await draftsAPI.schedule(draft.id, {
        scheduledPublishAt: scheduledAt.toISOString(),
      });
      // Update local draft state with scheduling info
      if (response?.data?.data) {
        setDraft(response.data.data);
      }
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule draft');
      log.error('Schedule draft error:', err);
      return false;
    } finally {
      setSchedulingDraft(false);
    }
  };

  // Cancel scheduled publishing
  const cancelSchedule = async (): Promise<boolean> => {
    if (!draft?.id) {
      setError('No draft available to cancel schedule');
      return false;
    }

    setCancellingSchedule(true);
    try {
      const response = await draftsAPI.cancelSchedule(draft.id);
      // Update local draft state to clear scheduling info
      if (response?.data?.data) {
        setDraft(response.data.data);
      }
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel schedule');
      log.error('Cancel schedule error:', err);
      return false;
    } finally {
      setCancellingSchedule(false);
    }
  };


  return {
    draftId: id,
    draft,
    loadingDraft,
    lastSavedAt,
    error,
    saveDraftStateThrottled,
    savingDraft,
    uploadingImage,
    uploadDraftImage,
    deletingImage,
    deleteDraftImage,
    computeImageDraftUrl,
    deletingDraft,
    deleteDraft,
    // Edit lock controls
    settingEditLock,
    setEditLock,
    // Scheduling controls
    schedulingDraft,
    scheduleDraft,
    cancellingSchedule,
    cancelSchedule,
  };
}
