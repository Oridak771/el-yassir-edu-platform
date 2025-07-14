'use client';

import { useState, useEffect } from 'react';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type PDFField = { // Added export
  name: string; // This can be the label or an internal identifier
  value: string; // Default or static value
  x: number;
  y: number;
  font?: 'Helvetica' | 'Helvetica-Bold'; // More font options can be added
  size?: number;
  dynamic?: boolean; // If true, its value can be updated by promptFields
  fieldName?: string; // Identifier to match with promptFields
  // Removed isBold, using font prop instead
};

type PromptFieldConfig = {
  fieldName: string; // Corresponds to PDFField.fieldName
  label: string;
  defaultValue?: string;
  required?: boolean;
};

type PDFGeneratorProps = {
  title: string;
  filename: string | ((dynamicData: Record<string, string>) => string); // Explicitly allow function
  template?: Uint8Array;
  fields: PDFField[];
  buttonText?: string;
  promptFields?: PromptFieldConfig[];
  onBeforeGenerate?: (dynamicData: Record<string, string>) => boolean | Promise<boolean>; // Optional validation
  logo?: {
    data: Uint8Array;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  signatureData?: {
    name: string;
    date: string;
    x: number;
    y: number;
  };
  onGenerateSuccess?: (url: string, pdfBytes: Uint8Array) => void;
};

export default function PDFGenerator({
  title = 'Document',
  filename: initialFilename,
  template,
  fields: initialFields,
  logo,
  signatureData,
  onGenerateSuccess,
  buttonText = 'Generate PDF',
  promptFields,
  onBeforeGenerate
}: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [promptData, setPromptData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (promptFields) {
      const initialPromptData: Record<string, string> = {};
      promptFields.forEach(pf => {
        initialPromptData[pf.fieldName] = pf.defaultValue || '';
      });
      setPromptData(initialPromptData);
    }
  }, [promptFields]);

  const handlePromptInputChange = (fieldName: string, value: string) => {
    setPromptData(prev => ({ ...prev, [fieldName]: value }));
  };

  const generatePDF = async (currentDynamicData?: Record<string, string>) => {
    try {
      setIsGenerating(true);
      
      // Create a new PDF document or use template if provided
      const pdfDoc = template 
        ? await PDFDocument.load(template)
        : await PDFDocument.create();
      
      // Get the first page or create one if not exists
      let page = pdfDoc.getPages().length > 0 
        ? pdfDoc.getPages()[0] 
        : pdfDoc.addPage();
      
      // Set page dimensions if creating a new document
      if (!template) {
        page = pdfDoc.addPage([595.276, 841.89]); // A4 size
      }

      // Embed fonts - consider making this more dynamic or part of PDFField
      const fonts: Record<string, PDFFont> = {
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      };

      // Update fields with dynamic data from prompt
      const finalFields = initialFields.map(field => {
        if (field.dynamic && field.fieldName && currentDynamicData && currentDynamicData[field.fieldName] !== undefined) {
          return { ...field, value: currentDynamicData[field.fieldName] };
        }
        return field;
      });
      
      // Add logo if provided
      if (logo) {
        const pngImage = await pdfDoc.embedPng(logo.data);
        page.drawImage(pngImage, {
          x: logo.x,
          y: logo.y,
          width: logo.width,
          height: logo.height,
        });
      }
      
      // Add fields
      for (const field of finalFields) {
        const { name, value, x, y, size = 12, font: fontName = 'Helvetica' } = field;
        const selectedFont = fonts[fontName] || fonts['Helvetica'];
        
        // For 'name' acting as a label vs. 'value' being the text to draw:
        // The original logic was a bit mixed. Assuming 'value' is the primary text.
        // If 'name' is meant to be a separate label, that needs distinct drawing logic.
        // For now, drawing 'value'. If 'name' is a label, it should be a separate field entry.
        page.drawText(value || '', { // Ensure value is a string
          x,
          y,
          size,
          font: selectedFont,
          color: rgb(0, 0, 0),
        });
      }
      
      // Add signature if provided
      if (signatureData) {
        const { name, date, x, y } = signatureData;
        
        page.drawLine({
          start: { x, y },
          end: { x: x + 150, y },
          thickness: 1, // Was 'a', assuming 1
          color: rgb(0, 0, 0),
        });
        
        page.drawText(name, {
          x,
          y: y - 15,
          size: 10,
          font: fonts['Helvetica'], // Use from embedded fonts
          color: rgb(0, 0, 0),
        });
        
        page.drawText(date, {
          x,
          y: y - 30,
          size: 10,
          font: fonts['Helvetica'], // Use from embedded fonts
          color: rgb(0, 0, 0),
        });
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Convert to base64
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const finalFilename = typeof initialFilename === 'function'
        ? initialFilename(currentDynamicData || {})
        : initialFilename || 'document.pdf';

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = finalFilename;
      downloadLink.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      if (onGenerateSuccess) {
        onGenerateSuccess(url, pdfBytes);
      }
      setShowPromptDialog(false); // Close dialog on success
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMainButtonClick = () => {
    if (promptFields && promptFields.length > 0) {
      setShowPromptDialog(true);
    } else {
      if (onBeforeGenerate) {
        const canProceed = onBeforeGenerate({});
        if (typeof canProceed === 'boolean' && !canProceed) return;
        // Handle promise if returned
        if (typeof canProceed === 'object' && typeof (canProceed as Promise<boolean>).then === 'function') {
          (canProceed as Promise<boolean>).then(proceed => {
            if (proceed) generatePDF({});
          });
          return;
        }
      }
      generatePDF({});
    }
  };

  const handlePromptDialogSubmit = async () => {
    if (onBeforeGenerate) {
      const canProceed = await onBeforeGenerate(promptData);
      if (!canProceed) return;
    }
    generatePDF(promptData);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              onClick={handleMainButtonClick}
              disabled={isGenerating}
              className="flex items-center w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : buttonText}
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Click the button to {promptFields && promptFields.length > 0 ? 'configure and ' : ''}generate and download the {(title || 'Document').toLowerCase()}.
          </div>
        </CardContent>
      </Card>

      {promptFields && promptFields.length > 0 && (
        <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure {title || 'Document'}</DialogTitle>
              <DialogDescription>
                Please provide the following details to generate the document.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {promptFields.map(pf => (
                <div key={pf.fieldName}>
                  <Label htmlFor={pf.fieldName}>{pf.label} {pf.required && <span className="text-red-500">*</span>}</Label>
                  <Input
                    id={pf.fieldName}
                    value={promptData[pf.fieldName] || ''}
                    onChange={(e) => handlePromptInputChange(pf.fieldName, e.target.value)}
                    required={pf.required}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromptDialog(false)}>Cancel</Button>
              <Button onClick={handlePromptDialogSubmit} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : `Generate ${title || 'Document'}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
