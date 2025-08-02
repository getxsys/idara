import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { ComplianceReportingService } from '../compliance-reporting';
import {
  ComplianceType,
  ReportStatus,
  SecuritySeverity
} from '@/types/security';

describe('ComplianceReportingService', () => {
  let service: ComplianceReportingService;

  beforeEach(() => {
    service = new ComplianceReportingService();
  });

  describe('generateComplianceReport', () => {
    it('should generate a GDPR compliance report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const generatedBy = 'admin-1';

      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate, endDate },
        generatedBy
      );

      expect(report.id).toBeDefined();
      expect(report.type).toBe(ComplianceType.GDPR);
      expect(report.period.startDate).toEqual(startDate);
      expect(report.period.endDate).toEqual(endDate);
      expect(report.generatedBy).toBe(generatedBy);
      expect(report.status).toBe(ReportStatus.COMPLETED);
      expect(report.data).toBeDefined();
      expect(report.filePath).toBeDefined();
    });

    it('should generate a HIPAA compliance report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const generatedBy = 'admin-2';

      const report = await service.generateComplianceReport(
        ComplianceType.HIPAA,
        { startDate, endDate },
        generatedBy
      );

      expect(report.type).toBe(ComplianceType.HIPAA);
      expect(report.status).toBe(ReportStatus.COMPLETED);
      expect(report.data.metadata?.hipaaSpecific).toBe(true);
    });

    it('should generate a SOX compliance report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const generatedBy = 'admin-3';

      const report = await service.generateComplianceReport(
        ComplianceType.SOX,
        { startDate, endDate },
        generatedBy
      );

      expect(report.type).toBe(ComplianceType.SOX);
      expect(report.status).toBe(ReportStatus.COMPLETED);
      expect(report.data.metadata?.soxSpecific).toBe(true);
    });

    it('should include comprehensive compliance data', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.securityEvents).toBeDefined();
      expect(report.data.accessLogs).toBeDefined();
      expect(report.data.dataProcessingActivities).toBeDefined();
      expect(report.data.breachIncidents).toBeDefined();
      expect(report.data.userConsents).toBeDefined();
      expect(report.data.dataRetentionCompliance).toBeDefined();
    });

    it('should handle report generation errors', async () => {
      // Mock processReport to throw an error
      const originalProcessReport = (service as any).processReport;
      (service as any).processReport = jest.fn().mockRejectedValue(new Error('Processing failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.status).toBe(ReportStatus.FAILED);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate compliance report'),
        expect.any(Error)
      );

      // Restore original method
      (service as any).processReport = originalProcessReport;
      consoleSpy.mockRestore();
    });
  });

  describe('getReport', () => {
    it('should retrieve a report by ID', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      const retrievedReport = service.getReport(report.id);

      expect(retrievedReport).toBeDefined();
      expect(retrievedReport?.id).toBe(report.id);
      expect(retrievedReport?.type).toBe(ComplianceType.GDPR);
    });

    it('should return undefined for non-existent report', () => {
      const report = service.getReport('non-existent-id');
      expect(report).toBeUndefined();
    });
  });

  describe('getReportsByType', () => {
    it('should return reports filtered by type', async () => {
      await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );
      await service.generateComplianceReport(
        ComplianceType.HIPAA,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );
      await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-02-01'), endDate: new Date('2024-02-28') },
        'admin-1'
      );

      const gdprReports = service.getReportsByType(ComplianceType.GDPR);
      const hipaaReports = service.getReportsByType(ComplianceType.HIPAA);

      expect(gdprReports).toHaveLength(2);
      expect(hipaaReports).toHaveLength(1);
      expect(gdprReports.every(r => r.type === ComplianceType.GDPR)).toBe(true);
      expect(hipaaReports.every(r => r.type === ComplianceType.HIPAA)).toBe(true);
    });

    it('should return reports sorted by generation date (newest first)', async () => {
      const report1 = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const report2 = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-02-01'), endDate: new Date('2024-02-28') },
        'admin-1'
      );

      const reports = service.getReportsByType(ComplianceType.GDPR);

      expect(reports).toHaveLength(2);
      expect(reports[0].generatedAt.getTime()).toBeGreaterThan(reports[1].generatedAt.getTime());
    });
  });

  describe('getRecentReports', () => {
    it('should return recent reports with default limit', async () => {
      // Generate more than 10 reports
      for (let i = 0; i < 15; i++) {
        await service.generateComplianceReport(
          ComplianceType.GDPR,
          { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
          'admin-1'
        );
      }

      const recentReports = service.getRecentReports();

      expect(recentReports).toHaveLength(10); // Default limit
    }, 20000); // 20 second timeout

    it('should respect custom limit', async () => {
      for (let i = 0; i < 8; i++) {
        await service.generateComplianceReport(
          ComplianceType.GDPR,
          { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
          'admin-1'
        );
      }

      const recentReports = service.getRecentReports(5);

      expect(recentReports).toHaveLength(5);
    }, 15000); // 15 second timeout

    it('should return reports sorted by generation date (newest first)', async () => {
      const report1 = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const report2 = await service.generateComplianceReport(
        ComplianceType.HIPAA,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      const recentReports = service.getRecentReports();

      expect(recentReports[0].generatedAt.getTime()).toBeGreaterThan(recentReports[1].generatedAt.getTime());
    });
  });

  describe('convenience methods', () => {
    it('should generate GDPR report using convenience method', async () => {
      const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') };
      const report = await service.generateGDPRReport(period, 'admin-1');

      expect(report.type).toBe(ComplianceType.GDPR);
      expect(report.status).toBe(ReportStatus.COMPLETED);
    });

    it('should generate HIPAA report using convenience method', async () => {
      const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') };
      const report = await service.generateHIPAAReport(period, 'admin-1');

      expect(report.type).toBe(ComplianceType.HIPAA);
      expect(report.status).toBe(ReportStatus.COMPLETED);
    });

    it('should generate SOX report using convenience method', async () => {
      const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') };
      const report = await service.generateSOXReport(period, 'admin-1');

      expect(report.type).toBe(ComplianceType.SOX);
      expect(report.status).toBe(ReportStatus.COMPLETED);
    });
  });

  describe('data collection', () => {
    it('should collect security event summaries', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.securityEvents).toHaveLength(1);
      expect(report.data.securityEvents[0].type).toBeDefined();
      expect(report.data.securityEvents[0].count).toBeGreaterThan(0);
      expect(report.data.securityEvents[0].severity).toBeDefined();
      expect(report.data.securityEvents[0].resolved).toBeDefined();
      expect(report.data.securityEvents[0].unresolved).toBeDefined();
    });

    it('should collect access log summaries', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.accessLogs).toHaveLength(2);
      expect(report.data.accessLogs[0].userId).toBeDefined();
      expect(report.data.accessLogs[0].accessCount).toBeGreaterThan(0);
      expect(report.data.accessLogs[0].dataAccessed).toBeDefined();
      expect(report.data.accessLogs[0].purposes).toBeDefined();
      expect(report.data.accessLogs[0].legalBasis).toBeDefined();
    });

    it('should collect data processing activities', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.dataProcessingActivities).toHaveLength(2);
      expect(report.data.dataProcessingActivities[0].purpose).toBeDefined();
      expect(report.data.dataProcessingActivities[0].dataTypes).toBeDefined();
      expect(report.data.dataProcessingActivities[0].legalBasis).toBeDefined();
      expect(report.data.dataProcessingActivities[0].securityMeasures).toBeDefined();
    });

    it('should collect breach incidents', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.breachIncidents).toHaveLength(1);
      expect(report.data.breachIncidents[0].type).toBeDefined();
      expect(report.data.breachIncidents[0].severity).toBeDefined();
      expect(report.data.breachIncidents[0].affectedUsers).toBeGreaterThan(0);
      expect(report.data.breachIncidents[0].reportedToAuthority).toBeDefined();
    });

    it('should collect user consents', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.userConsents).toHaveLength(2);
      expect(report.data.userConsents[0].userId).toBeDefined();
      expect(report.data.userConsents[0].purpose).toBeDefined();
      expect(report.data.userConsents[0].granted).toBeDefined();
    });

    it('should collect data retention compliance', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.dataRetentionCompliance).toHaveLength(2);
      expect(report.data.dataRetentionCompliance[0].dataType).toBeDefined();
      expect(report.data.dataRetentionCompliance[0].retentionPeriod).toBeDefined();
      expect(report.data.dataRetentionCompliance[0].compliantRecords).toBeGreaterThan(0);
    });
  });

  describe('compliance-specific processing', () => {
    it('should add GDPR-specific analysis', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.metadata?.gdprSpecific).toBe(true);
      expect(report.data.metadata?.consentCompliance).toBeDefined();
      expect(report.data.metadata?.retentionCompliance).toBeDefined();
    });

    it('should add HIPAA-specific analysis', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.HIPAA,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.metadata?.hipaaSpecific).toBe(true);
      expect(report.data.metadata?.phiAccess).toBeDefined();
      expect(report.data.metadata?.securityIncidents).toBeDefined();
    });

    it('should add SOX-specific analysis', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.SOX,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.data.metadata?.soxSpecific).toBe(true);
      expect(report.data.metadata?.financialControls).toBeDefined();
      expect(report.data.metadata?.itControls).toBeDefined();
    });
  });

  describe('analysis functions', () => {
    it('should analyze consent compliance correctly', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      const consentCompliance = report.data.metadata?.consentCompliance;
      
      expect(consentCompliance.totalConsents).toBe(2);
      expect(consentCompliance.grantedConsents).toBe(2);
      expect(consentCompliance.withdrawnConsents).toBe(1);
      expect(consentCompliance.complianceRate).toBe(100);
    });

    it('should analyze retention compliance correctly', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      const retentionCompliance = report.data.metadata?.retentionCompliance;
      
      expect(retentionCompliance.totalRecords).toBe(6987); // 1250 + 5680 + 45 + 12
      expect(retentionCompliance.compliantRecords).toBe(6930); // 1250 + 5680
      expect(retentionCompliance.expiredRecords).toBe(57); // 45 + 12
      expect(retentionCompliance.deletedRecords).toBe(52); // 40 + 12
    });

    it('should calculate compliance rates correctly', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      const retentionCompliance = report.data.metadata?.retentionCompliance;
      
      expect(retentionCompliance.complianceRate).toBeCloseTo(99.18, 1); // (6930/6987)*100
      expect(retentionCompliance.deletionRate).toBeCloseTo(91.23, 1); // (52/57)*100
    });
  });

  describe('file operations', () => {
    it('should generate file path for completed reports', async () => {
      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.filePath).toBeDefined();
      expect(report.filePath).toContain('compliance_report_gdpr_');
      expect(report.filePath).toContain('.json');
    });

    it('should not have file path for failed reports', async () => {
      // Mock processReport to throw an error
      const originalProcessReport = (service as any).processReport;
      (service as any).processReport = jest.fn().mockRejectedValue(new Error('Processing failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const report = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report.filePath).toBeUndefined();

      // Restore original method
      (service as any).processReport = originalProcessReport;
      consoleSpy.mockRestore();
    });
  });

  describe('report ID generation', () => {
    it('should generate unique report IDs', async () => {
      const report1 = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      const report2 = await service.generateComplianceReport(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );

      expect(report1.id).not.toBe(report2.id);
      expect(report1.id).toMatch(/^report_\d+_[a-z0-9]+$/);
      expect(report2.id).toMatch(/^report_\d+_[a-z0-9]+$/);
    });
  });
});