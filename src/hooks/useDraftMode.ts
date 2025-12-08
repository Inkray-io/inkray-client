import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { draftsAPI } from "@/lib/api";
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

  const uploadDraftImage = async (image: TemporaryImage) => {
    if (!draft) {return;}
    setUploadingImage(true);
    try {
      // Convert File to base64 string (strip the data: prefix)
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.onload = () => {
            const result = reader.result as string | ArrayBuffer | null;
            if (!result) {
              reject(new Error('Empty file result'));
              return;
            }
            // readAsDataURL returns a string like: data:<mime>;base64,AAA...
            if (typeof result === 'string') {
              const commaIndex = result.indexOf(',');
              const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
              resolve(base64);
            } else {
              // Fallback: convert ArrayBuffer to base64
              const bytes = new Uint8Array(result);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              resolve(btoa(binary));
            }
          };
          reader.readAsDataURL(file);
        });
      };

      const blobBase64 = await fileToBase64(image.file);

      await draftsAPI.uploadImage(draft.id,
          {
            mediaIndex: image.index,
            filename: image.filename,
            mimeType: image.mimeType,
            blob: blobBase64
          }
      );

    } catch (e) {
      log.error('Draft image upload error:', e);
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteDraftImage = async (mediaIndex: number | string) => {
    if (!draft) { return false; }
    setDeletingImage(true);
    try {
      await draftsAPI.deleteImage(draft.id, String(mediaIndex));
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
  };
}
