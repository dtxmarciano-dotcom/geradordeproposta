import PDFDocument from "pdfkit";
import { ComparisonResult } from "../services/comparisonService";

const GREEN = "#15803d";
const DARK = "#14181a";
const MUTED = "#71717a";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date): string {
  return date.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

// Gera o PDF a partir do resultado já calculado pelo comparisonService — não
// recalcula preços aqui, apenas formata o que já foi produzido por /compare.
export function generateComparisonPdf(listTitle: string, result: ComparisonResult): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

  drawHeader(doc, listTitle);

  if (!result.has_any_result || result.supermarkets.length === 0) {
    doc
      .fontSize(12)
      .fillColor(DARK)
      .text(
        "Não encontramos preços para os itens desta lista em nenhum supermercado cadastrado.",
        { align: "left" }
      );
    drawFooter(doc);
    return doc;
  }

  drawSummary(doc, result);
  drawSupermarketTable(doc, result);
  drawItemsTable(doc, result);
  drawFooter(doc);

  return doc;
}

function drawHeader(doc: PDFKit.PDFDocument, listTitle: string): void {
  doc.fontSize(24).fillColor(GREEN).font("Helvetica-Bold").text("Vantta", { continued: false });
  doc
    .fontSize(10)
    .fillColor(MUTED)
    .font("Helvetica")
    .text("Comparador de preços de supermercado");
  doc.moveDown(0.8);
  doc.fontSize(16).fillColor(DARK).font("Helvetica-Bold").text(listTitle || "Lista de compras");
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(`Gerado em ${formatDate(new Date())}`);
  doc.moveDown(1);
  drawDivider(doc);
  doc.moveDown(0.8);
}

function drawDivider(doc: PDFKit.PDFDocument): void {
  const y = doc.y;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor("#e4e4e7")
    .lineWidth(1)
    .stroke();
}

function drawSummary(doc: PDFKit.PDFDocument, result: ComparisonResult): void {
  const winner = result.winner;

  doc.fontSize(13).fillColor(DARK).font("Helvetica-Bold").text("Resumo");
  doc.moveDown(0.3);

  if (winner) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor(DARK)
      .text(`Supermercado mais barato: `, { continued: true })
      .font("Helvetica-Bold")
      .fillColor(GREEN)
      .text(winner.supermarket_name);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor(DARK)
      .text(`Total estimado: `, { continued: true })
      .font("Helvetica-Bold")
      .text(formatCurrency(winner.total));
  }

  if (result.max_savings > 0) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor(DARK)
      .text(`Economia possível: `, { continued: true })
      .font("Helvetica-Bold")
      .fillColor(GREEN)
      .text(formatCurrency(result.max_savings));
  }

  doc.fillColor(DARK).moveDown(1);
}

function drawSupermarketTable(doc: PDFKit.PDFDocument, result: ComparisonResult): void {
  doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK).text("Comparação por supermercado");
  doc.moveDown(0.4);

  const columns = [
    { label: "Supermercado", width: 170 },
    { label: "Total", width: 90 },
    { label: "Itens encontrados", width: 110 },
    { label: "Economia vs. mais caro", width: 125 },
  ];

  drawTableHeader(doc, columns);

  for (const basket of result.supermarkets) {
    ensureSpace(doc, 20);
    const startX = doc.page.margins.left;
    const y = doc.y;
    let x = startX;

    doc.font(basket.is_winner ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    doc.fillColor(basket.is_winner ? GREEN : DARK);
    doc.text(basket.supermarket_name + (basket.is_winner ? " (melhor preço)" : ""), x, y, {
      width: columns[0].width,
    });
    x += columns[0].width;

    doc.fillColor(DARK).text(formatCurrency(basket.total), x, y, { width: columns[1].width });
    x += columns[1].width;

    doc.text(`${basket.items_found} de ${basket.items_total}`, x, y, { width: columns[2].width });
    x += columns[2].width;

    doc.text(
      basket.savings_vs_most_expensive > 0 ? formatCurrency(basket.savings_vs_most_expensive) : "-",
      x,
      y,
      { width: columns[3].width }
    );

    doc.moveDown(0.7);
    doc.fillColor(DARK).font("Helvetica");
  }

  doc.moveDown(0.6);
  drawDivider(doc);
  doc.moveDown(0.8);
}

function drawTableHeader(doc: PDFKit.PDFDocument, columns: { label: string; width: number }[]): void {
  const startX = doc.page.margins.left;
  const y = doc.y;
  let x = startX;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
  for (const col of columns) {
    doc.text(col.label.toUpperCase(), x, y, { width: col.width });
    x += col.width;
  }
  doc.moveDown(0.6);
  doc.fillColor(DARK).font("Helvetica");
}

function drawItemsTable(doc: PDFKit.PDFDocument, result: ComparisonResult): void {
  doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK).text("Itens da lista");
  doc.moveDown(0.4);

  const columns = [
    { label: "Produto", width: 160 },
    { label: "Qtd.", width: 50 },
    { label: "Menor preço em", width: 140 },
    { label: "Preço", width: 80 },
  ];

  drawTableHeader(doc, columns);

  for (const item of result.items) {
    ensureSpace(doc, 30);
    const startX = doc.page.margins.left;
    const y = doc.y;
    let x = startX;

    doc.font("Helvetica").fontSize(10).fillColor(DARK);
    doc.text(item.product_name, x, y, { width: columns[0].width });
    x += columns[0].width;

    doc.text(String(item.quantity), x, y, { width: columns[1].width });
    x += columns[1].width;

    const cheapest = item.offers.find((o) => o.is_cheapest);
    doc.text(cheapest ? cheapest.supermarket_name : "Não disponível", x, y, {
      width: columns[2].width,
    });
    x += columns[2].width;

    doc
      .font("Helvetica-Bold")
      .fillColor(cheapest ? GREEN : MUTED)
      .text(cheapest ? formatCurrency(cheapest.unit_price as number) : "-", x, y, {
        width: columns[3].width,
      });

    doc.fillColor(DARK).font("Helvetica");
    doc.moveDown(0.55);

    const unavailable = item.offers.filter((o) => !o.available).map((o) => o.supermarket_name);
    if (unavailable.length > 0) {
      ensureSpace(doc, 15);
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .text(`Preço não disponível em: ${unavailable.join(", ")}`, startX, doc.y, {
          width: 460,
        });
      doc.moveDown(0.5);
    }
    doc.fillColor(DARK).fontSize(10);
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, minHeight: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + minHeight > bottom) {
    doc.addPage();
  }
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const bottom = doc.page.height - doc.page.margins.bottom + 15;
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text(`Gerado por Vantta em ${formatDate(new Date())}`, doc.page.margins.left, bottom, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "center",
      });
  }
}
