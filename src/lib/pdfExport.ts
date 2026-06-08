import type { PlanResult } from '@/types';

export async function generatePDF(plan: PlanResult): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const GREEN = [59, 109, 17] as [number, number, number];
  const DARK = [44, 44, 42] as [number, number, number];
  const GRAY = [95, 94, 90] as [number, number, number];
  const W = 210;
  let y = 0;

  // Header
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ANDES PLANNER AI', 15, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Plan de Expedición — Ecuador', 15, 24);
  doc.text(`Generado: ${new Date(plan.createdAt).toLocaleDateString('es-EC')}`, 15, 31);
  doc.setTextColor(...DARK);
  y = 45;

  // Profile summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('Perfil del Viajero', 15, y);
  y += 7;
  
  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Valor']],
    body: [
      ['Destino', plan.profile.destination || 'Ecuador'],
      ['Duración', `${plan.profile.duration} días`],
      ['Grupo', `${plan.profile.groupSize} personas`],
      ['Presupuesto', `$${plan.profile.budget?.toLocaleString()} USD/persona`],
      ['Montañas objetivo', (plan.profile.targetMountains || []).join(', ')],
      ['Experiencia', plan.profile.mountainExperience || '-'],
      ['Condición física', plan.profile.fitnessLevel || '-'],
    ],
    headStyles: { fillColor: GREEN, textColor: 255 },
    alternateRowStyles: { fillColor: [240, 247, 230] },
    margin: { left: 15, right: 15 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Recommended agency
  if (plan.recommendedAgency) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('Agencia Recomendada', 15, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      body: [
        ['Nombre', plan.recommendedAgency.name],
        ['Ubicación', plan.recommendedAgency.location],
        ['Rating', `${plan.recommendedAgency.rating}/5 ★ (${plan.recommendedAgency.reviewCount} reseñas)`],
        ['Precio por persona', `$${plan.recommendedAgency.pricePerPerson.toLocaleString()} USD`],
        ['Presupuesto total estimado', `$${plan.recommendation.totalBudget.toLocaleString()} USD`],
        ['Certificaciones', plan.recommendedAgency.certifications.join(', ')],
        ['Servicios incluidos', plan.recommendedAgency.servicesIncluded.join(', ')],
      ],
      headStyles: { fillColor: GREEN, textColor: 255 },
      alternateRowStyles: { fillColor: [240, 247, 230] },
      margin: { left: 15, right: 15 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Safety alerts
  if (plan.recommendation.safetyAlerts.length) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(163, 45, 45);
    doc.text('⚠ Alertas de Seguridad', 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    plan.recommendation.safetyAlerts.forEach(alert => {
      const lines = doc.splitTextToSize(`• ${alert}`, W - 30);
      doc.text(lines, 15, y);
      y += lines.length * 5 + 2;
    });
    y += 5;
  }

  // Itinerary table
  doc.addPage();
  y = 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('Itinerario de Aclimatación', 15, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [['Día(s)', 'Lugar', 'Altitud', 'Actividades principales', 'Notas']],
    body: plan.itinerary.map(day => [
      String(day.day),
      day.location,
      `${day.altitude.toLocaleString()}m`,
      day.activities.slice(0, 2).join('; '),
      day.notes.substring(0, 80) + (day.notes.length > 80 ? '...' : ''),
    ]),
    headStyles: { fillColor: GREEN, textColor: 255 },
    alternateRowStyles: { fillColor: [240, 247, 230] },
    columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 55 }, 4: { cellWidth: 55 } },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8 },
  });

  // Checklist
  doc.addPage();
  y = 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('Checklist Personalizada', 15, y);
  y += 7;

  const categories = [...new Set(plan.checklist.map(i => i.category))];
  for (const cat of categories) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text(cat, 15, y);
    y += 6;
    
    const items = plan.checklist.filter(i => i.category === cat);
    autoTable(doc, {
      startY: y,
      body: items.map(item => [
        item.priority === 'essential' ? '★' : item.priority === 'recommended' ? '○' : '·',
        item.item,
        item.coveredByAgency ? 'Agencia' : 'Tu cargo',
      ]),
      columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 2: { cellWidth: 25 } },
      styles: { fontSize: 9 },
      margin: { left: 15, right: 15 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Andes Planner AI — Plan confidencial · Página ${i} de ${pageCount}`, W / 2, 290, { align: 'center' });
  }

  doc.save(`Andes_Planner_${plan.profile.destination || 'Ecuador'}_${new Date().toISOString().split('T')[0]}.pdf`);
}
