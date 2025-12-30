/**
 * Recommendation Service
 * Rule-based intelligent business recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import { IResult, success, failure } from '../../../core/interfaces';
import { createModuleLogger } from '../../../core/logger';
import {
    IRecommendation,
    IRecommendationFilter,
    IRecommendationResult,
    RecommendationCategory,
    RecommendationPriority,
    IStockRecommendation
} from '../domain';
import { IAnalyticsRepository } from '../infrastructure/analytics.repository';

const logger = createModuleLogger('RecommendationService');

// ==================== CONSTANTS ====================

const STOCK_WARNING_DAYS = 14;  // Warn if stock runs out in 14 days
const STOCK_CRITICAL_DAYS = 7; // Critical if stock runs out in 7 days
const HIGH_WASTE_THRESHOLD = 15; // High waste if > 15%

// ==================== INTERFACE ====================

export interface IRecommendationService {
    generateRecommendations(): Promise<IResult<IRecommendationResult>>;
    getActiveRecommendations(filter: IRecommendationFilter): Promise<IResult<IRecommendation[]>>;
    dismissRecommendation(id: string): Promise<IResult<void>>;
    applyRecommendation(id: string): Promise<IResult<void>>;
}

// ==================== IMPLEMENTATION ====================

export class RecommendationService implements IRecommendationService {
    private activeRecommendations: Map<string, IRecommendation> = new Map();

    constructor(private readonly repository: IAnalyticsRepository) { }

    /**
     * Generate all recommendations
     */
    async generateRecommendations(): Promise<IResult<IRecommendationResult>> {
        try {
            const recommendations: IRecommendation[] = [];

            // Generate stock recommendations
            const stockRecs = await this.generateStockRecommendations();
            recommendations.push(...stockRecs);

            // Generate cost recommendations
            const costRecs = await this.generateCostRecommendations();
            recommendations.push(...costRecs);

            // Store active recommendations
            for (const rec of recommendations) {
                this.activeRecommendations.set(rec.id, rec);
            }

            const result: IRecommendationResult = {
                recommendations,
                generated: recommendations.length,
                byCategory: this.countByCategory(recommendations),
                byPriority: this.countByPriority(recommendations)
            };

            logger.info('Recommendations generated', {
                total: recommendations.length,
                critical: result.byPriority.critical,
                high: result.byPriority.high
            });

            return success(result);
        } catch (error) {
            logger.error('Recommendation generation failed', { error });
            return failure({
                code: 'RECOMMENDATION_ERROR',
                message: 'Öneriler oluşturulamadı',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
        }
    }

    /**
     * Get active recommendations with filtering
     */
    async getActiveRecommendations(filter: IRecommendationFilter): Promise<IResult<IRecommendation[]>> {
        try {
            let recommendations = Array.from(this.activeRecommendations.values())
                .filter(r => r.status === 'active');

            // Apply filters
            if (filter.category) {
                recommendations = recommendations.filter(r => r.category === filter.category);
            }
            if (filter.priority) {
                recommendations = recommendations.filter(r => r.priority === filter.priority);
            }

            // Sort by priority
            const priorityOrder: Record<RecommendationPriority, number> = {
                critical: 0,
                high: 1,
                medium: 2,
                low: 3
            };
            recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            // Apply limit
            if (filter.limit) {
                recommendations = recommendations.slice(0, filter.limit);
            }

            return success(recommendations);
        } catch (error) {
            logger.error('Failed to get recommendations', { error });
            return failure({
                code: 'GET_RECOMMENDATIONS_ERROR',
                message: 'Öneriler alınamadı'
            });
        }
    }

    /**
     * Dismiss a recommendation
     */
    async dismissRecommendation(id: string): Promise<IResult<void>> {
        const rec = this.activeRecommendations.get(id);
        if (!rec) {
            return failure({ code: 'NOT_FOUND', message: 'Öneri bulunamadı' });
        }

        rec.status = 'dismissed';
        rec.dismissedAt = new Date();
        this.activeRecommendations.set(id, rec);

        return success(undefined);
    }

    /**
     * Apply a recommendation
     */
    async applyRecommendation(id: string): Promise<IResult<void>> {
        const rec = this.activeRecommendations.get(id);
        if (!rec) {
            return failure({ code: 'NOT_FOUND', message: 'Öneri bulunamadı' });
        }

        rec.status = 'applied';
        rec.appliedAt = new Date();
        this.activeRecommendations.set(id, rec);

        logger.info('Recommendation applied', { id, category: rec.category });

        return success(undefined);
    }

    // ==================== PRIVATE METHODS ====================

    private async generateStockRecommendations(): Promise<IRecommendation[]> {
        const recommendations: IRecommendation[] = [];

        try {
            const filter = {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            };

            const stockData = await this.repository.getStockConsumptionByMaterial(filter);

            for (const material of stockData) {
                if (material.daysRemaining < STOCK_CRITICAL_DAYS) {
                    recommendations.push(this.createStockRecommendation(material, 'critical'));
                } else if (material.daysRemaining < STOCK_WARNING_DAYS) {
                    recommendations.push(this.createStockRecommendation(material, 'high'));
                }
            }
        } catch (error) {
            logger.warn('Stock recommendation generation failed', { error });
        }

        return recommendations;
    }

    private createStockRecommendation(
        material: { materialTypeId: string; materialName: string; currentStock: number; averageDaily: number; daysRemaining: number },
        priority: RecommendationPriority
    ): IStockRecommendation {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 7);

        return {
            id: uuidv4(),
            category: 'stock',
            priority,
            status: 'active',
            title: `${material.materialName} stoku kritik seviyede`,
            description: `Mevcut stok: ${material.currentStock}, günlük tüketim: ${material.averageDaily}. Tahmini ${material.daysRemaining} gün içinde tükenecek.`,
            reasoning: 'Son 30 günlük tüketim hızına göre hesaplandı.',
            createdAt: new Date(),
            validUntil,
            action: {
                type: 'reorder_stock',
                label: 'Stok Siparişi Ver',
                params: {
                    materialTypeId: material.materialTypeId,
                    suggestedQuantity: Math.ceil(material.averageDaily * 30) // 30 günlük stok
                }
            },
            impact: {
                metric: 'stockout_risk',
                currentValue: 100,
                projectedValue: 0,
                improvementPercent: 100,
                confidence: 85
            },
            relatedEntities: [{
                type: 'material',
                id: material.materialTypeId,
                name: material.materialName
            }],
            stockData: {
                materialTypeId: material.materialTypeId,
                materialName: material.materialName,
                currentQuantity: material.currentStock,
                reorderLevel: Math.ceil(material.averageDaily * STOCK_WARNING_DAYS),
                averageConsumption: material.averageDaily,
                daysUntilStockout: material.daysRemaining
            }
        };
    }

    private async generateCostRecommendations(): Promise<IRecommendation[]> {
        const recommendations: IRecommendation[] = [];

        try {
            const filter = {
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            };

            const wasteData = await this.repository.getAggregatedMetrics('waste', filter);

            if (wasteData.length > 0) {
                const avgWaste = wasteData.reduce((sum, d) => sum + d.value, 0) / wasteData.length;

                if (avgWaste > HIGH_WASTE_THRESHOLD) {
                    const validUntil = new Date();
                    validUntil.setDate(validUntil.getDate() + 3);

                    recommendations.push({
                        id: uuidv4(),
                        category: 'cost',
                        priority: 'high',
                        status: 'active',
                        title: 'Yüksek fire oranı tespit edildi',
                        description: `Son 7 günde ortalama fire oranı %${Math.round(avgWaste * 10) / 10}. Hedef: <%${HIGH_WASTE_THRESHOLD}.`,
                        reasoning: 'Son 7 günlük kesim planları analiz edildi.',
                        createdAt: new Date(),
                        validUntil,
                        action: {
                            type: 'review_optimization',
                            label: 'Optimizasyon Ayarlarını Gözden Geçir',
                            params: {}
                        },
                        impact: {
                            metric: 'waste_percentage',
                            currentValue: avgWaste,
                            projectedValue: HIGH_WASTE_THRESHOLD,
                            improvementPercent: Math.round((avgWaste - HIGH_WASTE_THRESHOLD) / avgWaste * 100),
                            confidence: 70
                        }
                    });
                }
            }
        } catch (error) {
            logger.warn('Cost recommendation generation failed', { error });
        }

        return recommendations;
    }

    private countByCategory(recommendations: IRecommendation[]): Record<RecommendationCategory, number> {
        return {
            stock: recommendations.filter(r => r.category === 'stock').length,
            optimization: recommendations.filter(r => r.category === 'optimization').length,
            capacity: recommendations.filter(r => r.category === 'capacity').length,
            cost: recommendations.filter(r => r.category === 'cost').length,
            quality: recommendations.filter(r => r.category === 'quality').length
        };
    }

    private countByPriority(recommendations: IRecommendation[]): Record<RecommendationPriority, number> {
        return {
            low: recommendations.filter(r => r.priority === 'low').length,
            medium: recommendations.filter(r => r.priority === 'medium').length,
            high: recommendations.filter(r => r.priority === 'high').length,
            critical: recommendations.filter(r => r.priority === 'critical').length
        };
    }
}
