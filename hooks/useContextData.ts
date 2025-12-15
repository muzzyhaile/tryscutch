/**
 * Custom hook for managing context data with localStorage persistence
 */

import { useEffect, useRef, useState } from 'react';
import { ContextData, ICP, MarketFeedback, ProductInfo, ProductPrinciple } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_CONTEXT: ContextData = {
  icps: [],
  productInfos: [],
  marketFeedbacks: [],
  productPrinciples: [],
};

export function useContextData(userId?: string) {
  const [contextData, setContextData] = useState<ContextData>(DEFAULT_CONTEXT);
  const [isLoadedFromRemote, setIsLoadedFromRemote] = useState(false);
  const skipNextSyncRef = useRef(false);

  const isUuid = (value: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  // Load from Supabase when authenticated; fall back to localStorage if no userId.
  useEffect(() => {
    if (!userId) {
      const stored = storage.get<ContextData>(STORAGE_KEYS.CONTEXT);
      setContextData(stored ?? DEFAULT_CONTEXT);
      setIsLoadedFromRemote(false);
      return;
    }

    let isMounted = true;
    (async () => {
      const [icpsRes, productsRes, marketRes, principlesRes] = await Promise.all([
        supabase.from('context_icps').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('context_product_infos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('context_market_feedbacks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('context_product_principles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      if (!isMounted) return;

      const anyError = icpsRes.error || productsRes.error || marketRes.error || principlesRes.error;
      if (anyError) {
        console.error(anyError);
        const stored = storage.get<ContextData>(STORAGE_KEYS.CONTEXT);
        setContextData(stored ?? DEFAULT_CONTEXT);
        setIsLoadedFromRemote(false);
        return;
      }

      const remote: ContextData = {
        icps: (icpsRes.data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          demographics: r.demographics ?? '',
          painPoints: r.pain_points ?? '',
          goals: r.goals ?? '',
          createdAt: r.created_at,
        })) as ICP[],
        productInfos: (productsRes.data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          features: r.features ?? '',
          targetMarket: r.target_market ?? '',
          valueProposition: r.value_proposition ?? '',
          createdAt: r.created_at,
        })) as ProductInfo[],
        marketFeedbacks: (marketRes.data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          source: r.source,
          content: r.content,
          date: r.date ?? '',
          createdAt: r.created_at,
        })) as MarketFeedback[],
        productPrinciples: (principlesRes.data ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          priority: r.priority,
          createdAt: r.created_at,
        })) as ProductPrinciple[],
      };

      const local = storage.get<ContextData>(STORAGE_KEYS.CONTEXT) ?? DEFAULT_CONTEXT;
      const localHasAny =
        (local.icps?.length ?? 0) +
          (local.productInfos?.length ?? 0) +
          (local.marketFeedbacks?.length ?? 0) +
          (local.productPrinciples?.length ?? 0) >
        0;

      const remoteHasAny =
        (remote.icps.length + remote.productInfos.length + remote.marketFeedbacks.length + remote.productPrinciples.length) > 0;

      if (!remoteHasAny && localHasAny) {
        // Backfill local data into remote, remapping IDs to UUIDs if needed.
        const migrated: ContextData = {
          icps: (local.icps ?? []).map(i => ({ ...i, id: isUuid(i.id) ? i.id : crypto.randomUUID() })),
          productInfos: (local.productInfos ?? []).map(p => ({ ...p, id: isUuid(p.id) ? p.id : crypto.randomUUID() })),
          marketFeedbacks: (local.marketFeedbacks ?? []).map(m => ({ ...m, id: isUuid(m.id) ? m.id : crypto.randomUUID() })),
          productPrinciples: (local.productPrinciples ?? []).map(pr => ({ ...pr, id: isUuid(pr.id) ? pr.id : crypto.randomUUID() })),
        };

        storage.set(STORAGE_KEYS.CONTEXT, migrated);

        await Promise.all([
          migrated.icps.length
            ? supabase.from('context_icps').upsert(
                migrated.icps.map(i => ({
                  id: i.id,
                  user_id: userId,
                  name: i.name,
                  description: i.description,
                  demographics: i.demographics ?? null,
                  pain_points: i.painPoints ?? null,
                  goals: i.goals ?? null,
                  created_at: i.createdAt,
                })),
                { onConflict: 'id' }
              )
            : Promise.resolve({}),
          migrated.productInfos.length
            ? supabase.from('context_product_infos').upsert(
                migrated.productInfos.map(p => ({
                  id: p.id,
                  user_id: userId,
                  name: p.name,
                  description: p.description,
                  features: p.features ?? null,
                  target_market: p.targetMarket ?? null,
                  value_proposition: p.valueProposition ?? null,
                  created_at: p.createdAt,
                })),
                { onConflict: 'id' }
              )
            : Promise.resolve({}),
          migrated.marketFeedbacks.length
            ? supabase.from('context_market_feedbacks').upsert(
                migrated.marketFeedbacks.map(m => ({
                  id: m.id,
                  user_id: userId,
                  name: m.name,
                  source: m.source,
                  content: m.content,
                  date: m.date ?? null,
                  created_at: m.createdAt,
                })),
                { onConflict: 'id' }
              )
            : Promise.resolve({}),
          migrated.productPrinciples.length
            ? supabase.from('context_product_principles').upsert(
                migrated.productPrinciples.map(pr => ({
                  id: pr.id,
                  user_id: userId,
                  title: pr.title,
                  description: pr.description,
                  category: pr.category,
                  priority: pr.priority,
                  created_at: pr.createdAt,
                })),
                { onConflict: 'id' }
              )
            : Promise.resolve({}),
        ]);

        skipNextSyncRef.current = true;
        setContextData(migrated);
        setIsLoadedFromRemote(true);
        return;
      }

      skipNextSyncRef.current = true;
      setContextData(remote);
      setIsLoadedFromRemote(true);
    })().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Persist to storage whenever data changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.CONTEXT, contextData);
  }, [contextData]);

  // Sync to Supabase whenever context changes.
  useEffect(() => {
    if (!userId) return;
    if (!isLoadedFromRemote) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    (async () => {
      // For simplicity, keep remote in sync by replacing by ID set: upsert all, delete removed.
      // ICPs
      const icpIds = new Set(contextData.icps.map(i => i.id));
      const productIds = new Set(contextData.productInfos.map(p => p.id));
      const marketIds = new Set(contextData.marketFeedbacks.map(m => m.id));
      const principleIds = new Set(contextData.productPrinciples.map(p => p.id));

      const [remoteIcpIds, remoteProductIds, remoteMarketIds, remotePrincipleIds] = await Promise.all([
        supabase.from('context_icps').select('id').eq('user_id', userId),
        supabase.from('context_product_infos').select('id').eq('user_id', userId),
        supabase.from('context_market_feedbacks').select('id').eq('user_id', userId),
        supabase.from('context_product_principles').select('id').eq('user_id', userId),
      ]);

      const delIcp = (remoteIcpIds.data ?? []).map((r: any) => r.id).filter((id: string) => !icpIds.has(id));
      const delProd = (remoteProductIds.data ?? []).map((r: any) => r.id).filter((id: string) => !productIds.has(id));
      const delMarket = (remoteMarketIds.data ?? []).map((r: any) => r.id).filter((id: string) => !marketIds.has(id));
      const delPrinciples = (remotePrincipleIds.data ?? []).map((r: any) => r.id).filter((id: string) => !principleIds.has(id));

      await Promise.all([
        delIcp.length ? supabase.from('context_icps').delete().eq('user_id', userId).in('id', delIcp) : Promise.resolve({}),
        delProd.length ? supabase.from('context_product_infos').delete().eq('user_id', userId).in('id', delProd) : Promise.resolve({}),
        delMarket.length ? supabase.from('context_market_feedbacks').delete().eq('user_id', userId).in('id', delMarket) : Promise.resolve({}),
        delPrinciples.length ? supabase.from('context_product_principles').delete().eq('user_id', userId).in('id', delPrinciples) : Promise.resolve({}),
      ]);

      await Promise.all([
        contextData.icps.length
          ? supabase.from('context_icps').upsert(
              contextData.icps.map(i => ({
                id: i.id,
                user_id: userId,
                name: i.name,
                description: i.description,
                demographics: i.demographics ?? null,
                pain_points: i.painPoints ?? null,
                goals: i.goals ?? null,
                created_at: i.createdAt,
              })),
              { onConflict: 'id' }
            )
          : Promise.resolve({}),
        contextData.productInfos.length
          ? supabase.from('context_product_infos').upsert(
              contextData.productInfos.map(p => ({
                id: p.id,
                user_id: userId,
                name: p.name,
                description: p.description,
                features: p.features ?? null,
                target_market: p.targetMarket ?? null,
                value_proposition: p.valueProposition ?? null,
                created_at: p.createdAt,
              })),
              { onConflict: 'id' }
            )
          : Promise.resolve({}),
        contextData.marketFeedbacks.length
          ? supabase.from('context_market_feedbacks').upsert(
              contextData.marketFeedbacks.map(m => ({
                id: m.id,
                user_id: userId,
                name: m.name,
                source: m.source,
                content: m.content,
                date: m.date ?? null,
                created_at: m.createdAt,
              })),
              { onConflict: 'id' }
            )
          : Promise.resolve({}),
        contextData.productPrinciples.length
          ? supabase.from('context_product_principles').upsert(
              contextData.productPrinciples.map(pr => ({
                id: pr.id,
                user_id: userId,
                title: pr.title,
                description: pr.description,
                category: pr.category,
                priority: pr.priority,
                created_at: pr.createdAt,
              })),
              { onConflict: 'id' }
            )
          : Promise.resolve({}),
      ]);
    })().catch(console.error);
  }, [contextData, isLoadedFromRemote, userId]);

  return {
    contextData,
    setContextData,
  };
}
