'use client';

import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

type PDFField = {
  name: string;
  value: string;
  x: number;
  y: number;
  fontSize?: number;
  isBold?: boolean;
};

type PDFGeneratorProps = {
  title: string;
  filename: string;
  template?: Uint8Array;
  fields: PDFField[];
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
  onGenerateSuccess?: (url: string) => void;
};

export default function PDFGenerator({
  title,
  filename,
  template,
  fields,
  logo,
  signatureData,
  onGenerateSuccess
}: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
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

      // Embed fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
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
      for (const field of fields) {
        const { name, value, x, y, fontSize = 12, isBold = false } = field;
        const selectedFont = isBold ? boldFont : font;
        
        // Draw field name if it exists (as a label)
        if (name) {
          page.drawText(`${name}:`, {
            x,
            y: y + 15, // Position label slightly above the value
            size: fontSize,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
        }
        
        // Draw field value
        page.drawText(value, {
          x: name ? x + font.widthOfTextAtSize(`${name}: `, fontSize) : x,
          y,
          size: fontSize,
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
          thickness: a,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(name, {
          x,
          y: y - 15,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(date, {
          x,
          y: y - 30,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Convert to base64
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document.pdf';
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      if (onGenerateSuccess) {
        onGenerateSuccess(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Click the button to generate and download the {title.toLowerCase()}.
        </div>
      </CardContent>
    </Card>
  );
}
