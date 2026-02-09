import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { UnitBalance, DateRange } from "@/hooks/useUnitBalanceFiltered";
import { toJalaliString } from "@/lib/jalaliDate";

export async function generateUnitReportPDF(
  elementId: string = "pdf-report-content",
  unitNumber: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("PDF element not found");
    return;
  }

  // Render DOM to canvas with high quality
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  // Calculate dimensions for A4 paper
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Create PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const imgData = canvas.toDataURL("image/png");

  // Handle multi-page content
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Save the PDF
  const fileName = `گزارش-واحد-${unitNumber}-${toJalaliString(new Date()).replace(/\//g, "-")}.pdf`;
  pdf.save(fileName);
}
