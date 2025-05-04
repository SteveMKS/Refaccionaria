import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

interface Producto {
  name: string;
  quantity: number;
  price: number;
}

interface TicketModalProps {
  open: boolean;
  onClose: () => void;
  productos: Producto[];
  total: number;
  fecha: string;
  hora: string;
  cliente: string;
}

export const TicketModal = ({ open, onClose, productos, total, fecha, hora, cliente }: TicketModalProps) => {
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfUri, setPdfUri] = useState<string>("");

  useEffect(() => {
    if (open) {
      const doc = generarTicket();
      const uri = doc.output("datauristring");
      setPdfDoc(doc);
      setPdfUri(uri);
    } else {
      setPdfDoc(null);
      setPdfUri("");
    }
  }, [open]);
  

  const generarTicket = () => {
    const baseHeight = 80; // Altura base para header, fecha, cliente, totales
    const extraHeightPerProduct = 10; // Cada producto ocupa 10mm aprox
    const totalHeight = baseHeight + productos.length * extraHeightPerProduct;

    const doc = new jsPDF({ unit: "mm", format: [100, totalHeight] }); // 🔥 Altura dinámica
    doc.setFont("helvetica");

    const margin = { left: 5, right: 5, top: 10 };
    const width = 100 - margin.left - margin.right;
    const cols = {
      producto: margin.left,
      cantidad: 40,
      precio: 55,
      total: 85,
    };
    const lineHeight = 5;
    const rowPadding = 4;

    let y = margin.top;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("**** RECIBO DE COMPRA ****", 50, y, { align: "center" });
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${fecha}`, margin.left, y);
    doc.text(`Hora: ${hora}`, 50, y);
    y += 6;

    doc.text(`Cliente: ${cliente}`, margin.left, y);
    y += 8;

    doc.line(margin.left, y, 100 - margin.right, y);
    y += rowPadding + 2;

    doc.setFont("helvetica", "bold");
    doc.text("Producto", cols.producto, y);
    doc.text("Cant", cols.cantidad, y, { align: "center" });
    doc.text("P.Unit", cols.precio, y, { align: "center" });
    doc.text("Total", cols.total, y, { align: "right" });
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    doc.line(margin.left, y, 100 - margin.right, y);
    y += rowPadding;

    productos.forEach((item) => {
      const startY = y;
      const productLines = doc.splitTextToSize(item.name, 30);

      productLines.forEach((line: string, i: number) => {
        doc.text(line, cols.producto, y + (i * lineHeight));
      });

      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      const centerY = startY + (productHeight / 2) - 2;

      doc.text(`${item.quantity}`, cols.cantidad, centerY, { align: "center" });
      doc.text(`$${item.price.toFixed(2)}`, cols.precio, centerY, { align: "center" });
      const subtotal = (item.price * item.quantity).toFixed(2);
      doc.text(`$${subtotal}`, cols.total, centerY, { align: "right" });

      y = startY + productHeight + rowPadding;
    });

    doc.line(margin.left, y, 100 - margin.right, y);
    y += rowPadding + 4;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, 50, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("¡Gracias por su compra!", 50, y, { align: "center" });

    return doc;
  };

  const descargarPDF = () => {
    if (!pdfDoc) return;
    pdfDoc.save("ticket.pdf");
  };

  const imprimirPDF = () => {
    if (!pdfUri) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUri;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  };

  return (
    open && (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vista previa del Ticket</DialogTitle>
          </DialogHeader>
          {pdfUri && (
            <iframe src={pdfUri} className="w-full h-96 border rounded" />
          )}
          <div className="flex justify-between gap-2 pt-4">
            <Button variant="outline" onClick={descargarPDF} className="w-full">
              Descargar
            </Button>
            <Button onClick={imprimirPDF} className="w-full">
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    ) 
  );
};
