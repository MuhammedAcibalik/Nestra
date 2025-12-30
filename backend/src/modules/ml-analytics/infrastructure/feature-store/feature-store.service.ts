import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createModuleLogger } from '../../../../core/logger';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { eq, and, desc, gte, lte, isNotNull } from 'drizzle-orm';
import { mlPredictions, modelTypeEnum } from '../../../../db/schema/ml-analytics';
import { IServiceResult, MLModelType } from '../../domain';

const logger = createModuleLogger('FeatureStore');

export class FeatureStoreService {
    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) { }

    /**
     * Verilen model tipi ve zaman aralığı için eğitim verilerini dışa aktarır.
     * Veriler mlPredictions tablosundan 'inputFeatures' ve 'actualValue' kullanılarak oluşturulur.
     * Batch işleme (sayfalama) kullanarak bellek taşmasını önler.
     * 
     * @param modelType Eğitilecek model tipi
     * @param outputPath CSV dosyasının yazılacağı tam yol
     * @param timeWindow Geriye dönük taranacak gün sayısı
     */
    async exportTrainingData(
        modelType: string,
        outputPath: string,
        timeWindow: number = 30
    ): Promise<IServiceResult<{ rowCount: number; features: string[] }>> {
        try {
            logger.info('Eğitim verisi dışa aktarılıyor...', { modelType, outputPath, timeWindow });

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - timeWindow);

            const BATCH_SIZE = 1000;
            let offset = 0;
            let processedRows = 0;
            let headersWritten = false;
            let detectedFeatures: string[] = [];

            // Dosya yazma akışını başlat
            const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });

            while (true) {
                // Batch sorgusu
                const rows = await this.db.select({
                    inputFeatures: mlPredictions.inputFeatures,
                    actualValue: mlPredictions.actualValue
                })
                    .from(mlPredictions)
                    .where(and(
                        eq(mlPredictions.modelType, modelType as MLModelType),
                        gte(mlPredictions.createdAt, startDate),
                        isNotNull(mlPredictions.actualValue) // Sadece gerçek sonucu (feedback) olanlar
                    ))
                    .limit(BATCH_SIZE)
                    .offset(offset);

                if (rows.length === 0) {
                    break;
                }

                // İlk batch'te header'ları belirle ve yaz
                if (!headersWritten) {
                    const firstRow = rows[0];
                    if (!firstRow.inputFeatures || !firstRow.actualValue) {
                        logger.warn('İlk satırda özellik veya hedef veri eksik, atlanıyor.');
                        offset += BATCH_SIZE;
                        continue;
                    }

                    const featureKeys = Object.keys(firstRow.inputFeatures);
                    // Actual value bir obje olabilir veya tek değer. Genelde obje { target: 1 } gibi beklenir.
                    // Eğer jsonb ise içindeki keyleri flatten etmek gerekebilir. 
                    // Basitlik için actualValue içindeki ilk key'i target kabul edelim veya "target" keyini arayalım.
                    const targetKeys = Object.keys(firstRow.actualValue);

                    detectedFeatures = [...featureKeys, ...targetKeys];

                    // CSV Header
                    writeStream.write(detectedFeatures.join(',') + '\n');
                    headersWritten = true;
                }

                // Satırları CSV formatına çevirip yaz
                for (const row of rows) {
                    if (!row.inputFeatures || !row.actualValue) continue;

                    const features = row.inputFeatures as Record<string, number | string>;
                    const targets = row.actualValue as Record<string, number | string>;

                    const csvRow = detectedFeatures.map(key => {
                        // Önce feature'larda ara, sonra target'larda
                        let val = features[key] ?? targets[key];
                        // CSV için escape (gerekirse) - şimdilik basit number/string varsayıyoruz
                        if (val === null || val === undefined) return '';
                        return String(val);
                    });

                    writeStream.write(csvRow.join(',') + '\n');
                    processedRows++;
                }

                offset += BATCH_SIZE;

                // Güvenlik kilidi (Sonsuz döngü önleme)
                if (processedRows > 1_000_000) {
                    logger.warn('Veri limiti aşıldı (1M satır), durduruluyor.');
                    break;
                }
            }

            writeStream.end();

            // Stream'in tamamen kapanmasını beklemek için basit bir event listener veya promise (stream/promises pipeline daha iyi ama manuel write yaptık)
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            if (processedRows === 0) {
                return { success: false, error: 'Belirtilen kriterlere uygun eğitim verisi bulunamadı.' };
            }

            logger.info('Eğitim verisi başarıyla aktarıldı.', { processedRows, path: outputPath });
            return { success: true, data: { rowCount: processedRows, features: detectedFeatures } };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            logger.error('Data export hatası', { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
}
