/**
 * Custom hook for managing feedback forms.
 * - LocalStorage is used as a fast cache.
 * - When authenticated, data is synced to Supabase tables.
 */

import { useEffect, useRef, useState } from 'react';
import { FeedbackForm, FormResponse } from '../types-forms';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

type FormRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  questions: any;
  is_active: boolean;
  settings: any;
  shareable_link: string | null;
  created_at: string;
  updated_at: string;
};

type ResponseRow = {
  id: string;
  form_id: string;
  submitted_at: string;
  respondent_email: string | null;
  answers: any;
  imported: boolean;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function rowToForm(row: FormRow, responseCount: number): FeedbackForm {
  const shareableLink =
    row.shareable_link ?? `${window.location.origin}/f/${row.id}`;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    questions: Array.isArray(row.questions) ? row.questions : [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shareableLink,
    responseCount,
    settings: row.settings ?? {
      allowAnonymous: true,
      requireEmail: false,
      showBranding: true,
      autoImportToAnalysis: false,
      theme: 'light',
    },
  };
}

function formToUpsertRow(userId: string, form: FeedbackForm) {
  return {
    id: form.id,
    user_id: userId,
    name: form.name,
    description: form.description ?? null,
    questions: form.questions ?? [],
    is_active: form.isActive,
    settings: form.settings ?? {},
    shareable_link: form.shareableLink ?? null,
  };
}

function rowToResponse(row: ResponseRow): FormResponse {
  return {
    id: row.id,
    formId: row.form_id,
    submittedAt: row.submitted_at,
    respondentEmail: row.respondent_email ?? undefined,
    answers: Array.isArray(row.answers) ? row.answers : [],
    imported: !!row.imported,
  };
}

function responseToUpsertRow(userId: string, response: FormResponse) {
  return {
    id: response.id,
    form_id: response.formId,
    submitted_at: response.submittedAt,
    respondent_email: response.respondentEmail ?? null,
    answers: response.answers ?? [],
    imported: response.imported ?? false,
  };
}

export function useForms(userId?: string) {
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoadedFromRemote, setIsLoadedFromRemote] = useState(false);
  const prevFormIdsRef = useRef<Set<string>>(new Set());
  const prevResponseIdsRef = useRef<Set<string>>(new Set());
  const skipNextSyncRef = useRef(false);

  // Always load local cache immediately.
  useEffect(() => {
    const storedForms = storage.get<FeedbackForm[]>(STORAGE_KEYS.FORMS);
    const storedResponses = storage.get<FormResponse[]>(STORAGE_KEYS.RESPONSES);
    if (storedForms) setForms(storedForms);
    if (storedResponses) setResponses(storedResponses);
  }, []);

  // Persist to localStorage.
  useEffect(() => {
    storage.set(STORAGE_KEYS.FORMS, forms);
  }, [forms]);
  useEffect(() => {
    storage.set(STORAGE_KEYS.RESPONSES, responses);
  }, [responses]);

  // Load from Supabase when authenticated.
  useEffect(() => {
    if (!userId) {
      setIsLoadedFromRemote(false);
      prevFormIdsRef.current = new Set((storage.get<FeedbackForm[]>(STORAGE_KEYS.FORMS) ?? []).map(f => f.id));
      prevResponseIdsRef.current = new Set((storage.get<FormResponse[]>(STORAGE_KEYS.RESPONSES) ?? []).map(r => r.id));
      return;
    }

    let isMounted = true;
    (async () => {
      const formsRes = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (formsRes.error) {
        console.error(formsRes.error);
        setIsLoadedFromRemote(false);
        return;
      }

      const formIds = (formsRes.data as FormRow[]).map((f) => f.id);
      const responsesRes =
        formIds.length > 0
          ? await supabase
              .from('form_responses')
              .select('*')
              .in('form_id', formIds)
              .order('submitted_at', { ascending: false })
          : ({ data: [], error: null } as const);

      if (!isMounted) return;

      if ((responsesRes as any).error) {
        console.error((responsesRes as any).error);
        setIsLoadedFromRemote(false);
        return;
      }

      const remoteResponses = ((responsesRes as any).data as ResponseRow[]).map(rowToResponse);
      const responseCountByFormId = new Map<string, number>();
      for (const r of remoteResponses) {
        responseCountByFormId.set(r.formId, (responseCountByFormId.get(r.formId) ?? 0) + 1);
      }

      const remoteForms = (formsRes.data as FormRow[]).map((row) =>
        rowToForm(row, responseCountByFormId.get(row.id) ?? 0)
      );

      // One-time backfill: if remote is empty but local has data, upload it.
      const localForms = storage.get<FeedbackForm[]>(STORAGE_KEYS.FORMS) ?? [];
      const localResponses = storage.get<FormResponse[]>(STORAGE_KEYS.RESPONSES) ?? [];
      const remoteHasAny = remoteForms.length > 0 || remoteResponses.length > 0;
      const localHasAny = localForms.length > 0 || localResponses.length > 0;

      if (!remoteHasAny && localHasAny) {
        const formIdMap = new Map<string, string>();
        const migratedForms = localForms.map((f) => {
          const nextId = isUuid(f.id) ? f.id : crypto.randomUUID();
          formIdMap.set(f.id, nextId);
          return { ...f, id: nextId };
        });

        const migratedResponses = localResponses
          .map((r) => {
            const nextId = isUuid(r.id) ? r.id : crypto.randomUUID();
            const nextFormId = formIdMap.get(r.formId) ?? r.formId;
            return { ...r, id: nextId, formId: nextFormId };
          })
          .filter((r) => isUuid(r.formId));

        storage.set(STORAGE_KEYS.FORMS, migratedForms);
        storage.set(STORAGE_KEYS.RESPONSES, migratedResponses);

        const formRows = migratedForms.map(f => formToUpsertRow(userId, f));
        const { error: upsertFormsError } = await supabase.from('forms').upsert(formRows, { onConflict: 'id' });
        if (upsertFormsError) {
          console.error(upsertFormsError);
          skipNextSyncRef.current = true;
          setForms(migratedForms);
          setResponses(migratedResponses);
          setIsLoadedFromRemote(true);
          prevFormIdsRef.current = new Set(migratedForms.map(f => f.id));
          prevResponseIdsRef.current = new Set(migratedResponses.map(r => r.id));
          return;
        }

        if (migratedResponses.length > 0) {
          const responseRows = migratedResponses.map(r => responseToUpsertRow(userId, r));
          const { error: upsertResponsesError } = await supabase
            .from('form_responses')
            .upsert(responseRows, { onConflict: 'id' });
          if (upsertResponsesError) console.error(upsertResponsesError);
        }

        skipNextSyncRef.current = true;
        setForms(migratedForms);
        setResponses(migratedResponses);
        setIsLoadedFromRemote(true);
        prevFormIdsRef.current = new Set(migratedForms.map(f => f.id));
        prevResponseIdsRef.current = new Set(migratedResponses.map(r => r.id));
        return;
      }

      skipNextSyncRef.current = true;
      setForms(remoteForms);
      setResponses(remoteResponses);
      setIsLoadedFromRemote(true);
      prevFormIdsRef.current = new Set(remoteForms.map(f => f.id));
      prevResponseIdsRef.current = new Set(remoteResponses.map(r => r.id));
    })().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Sync forms to Supabase.
  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) return;

    const nextIds = new Set(forms.map(f => f.id));
    const prevIds = prevFormIdsRef.current;
    const removedIds: string[] = [];
    for (const id of prevIds) {
      if (!nextIds.has(id)) removedIds.push(id);
    }
    prevFormIdsRef.current = nextIds;

    (async () => {
      if (removedIds.length > 0) {
        const { error } = await supabase.from('forms').delete().eq('user_id', userId).in('id', removedIds);
        if (error) console.error(error);
      }

      if (forms.length > 0) {
        const rows = forms.map(f => formToUpsertRow(userId, f));
        const { error } = await supabase.from('forms').upsert(rows, { onConflict: 'id' });
        if (error) console.error(error);
      }
    })().catch(console.error);
  }, [forms, userId, isLoadedFromRemote]);

  // Sync responses to Supabase.
  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const nextIds = new Set(responses.map(r => r.id));
    const prevIds = prevResponseIdsRef.current;
    const removedIds: string[] = [];
    for (const id of prevIds) {
      if (!nextIds.has(id)) removedIds.push(id);
    }
    prevResponseIdsRef.current = nextIds;

    (async () => {
      if (removedIds.length > 0) {
        const { error } = await supabase
          .from('form_responses')
          .delete()
          .in('id', removedIds);
        if (error) console.error(error);
      }

      if (responses.length > 0) {
        const rows = responses.map(r => responseToUpsertRow(userId, r));
        const { error } = await supabase
          .from('form_responses')
          .upsert(rows, { onConflict: 'id' });
        if (error) console.error(error);
      }
    })().catch(console.error);
  }, [responses, userId, isLoadedFromRemote]);

  const deleteResponse = (id: string) => {
    setResponses(prev => prev.filter(r => r.id !== id));
  };

  return {
    forms,
    setForms,
    responses,
    setResponses,
    deleteResponse,
  };
}
