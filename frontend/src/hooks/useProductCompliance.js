import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

/**
 * Custom Hook: useProductCompliance
 * Centralized data access layer for Product Compliance & Batch Traceability
 */
export const useProductCompliance = (productId) => {
    const [compliance, setCompliance] = useState(null);
    const [latestBatch, setLatestBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCompliance = useCallback(async () => {
        if (!productId) {
            setCompliance(null);
            setLatestBatch(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [complianceRes, batchRes] = await Promise.all([
                client.get(`/products/${productId}/compliance`),
                client.get(`/products/${productId}/batches/latest`)
            ]);

            setCompliance(complianceRes.data?.compliance || null);
            setLatestBatch(batchRes.data?.batch || null);
        } catch (err) {
            console.error('Error fetching product compliance:', err);
            setError(err.response?.data?.message || 'Failed to load verification details');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchCompliance();
    }, [fetchCompliance]);

    const productTrustStatus = compliance?.trustStatus || null;
    const isTripleVerified = Boolean(productTrustStatus?.isTripleVerified);

    const batchTrustStatus = latestBatch ? {
        isActive: latestBatch.status === 'active',
        isQualityVerified: latestBatch.qualityVerification?.status === 'verified',
        isTraceable: latestBatch.traceability?.status === 'verified',
        isLabTested: (latestBatch.laboratoryEvidence || []).some(e => e.status === 'verified'),
    } : null;

    return {
        compliance,
        latestBatch,
        productTrustStatus,
        batchTrustStatus,
        isTripleVerified,
        loading,
        error,
        refetch: fetchCompliance
    };
};

export default useProductCompliance;
